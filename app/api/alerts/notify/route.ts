import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { planConfig } from "@/lib/plans"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { projectName, projectUrl, status, responseMs, error: checkError } = await req.json()
  if (!projectName || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, plan: true, notifyEmail: true, notifyIncidents: true, slackWebhookUrl: true, pagerdutyKey: true },
  })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const cfg = planConfig(user.plan)
  const isDown = status === "down"
  const results: Record<string, string> = {}

  // ── Email alert (Free+) ──────────────────────────────────────────────────
  if (user.notifyEmail && user.notifyIncidents) {
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      try {
        const subject = isDown
          ? `🔴 ${projectName} is down`
          : `✅ ${projectName} is back up`
        const body = isDown
          ? `<p>Your project <strong>${projectName}</strong> (${projectUrl}) is <strong>down</strong>.</p><p>Error: ${checkError || "No response"}</p>`
          : `<p>Your project <strong>${projectName}</strong> (${projectUrl}) is <strong>back online</strong>. Response time: ${responseMs}ms.</p>`

        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: "m-ops <alerts@m-ops.pro>",
            to: [user.email],
            subject,
            html: `<div style="font-family:sans-serif;max-width:500px">${body}<hr/><p style="color:#888;font-size:12px">m-ops monitoring · <a href="https://m-ops.pro/settings">Manage alerts</a></p></div>`,
          }),
        })
        results.email = emailRes.ok ? "sent" : "failed"
      } catch { results.email = "error" }
    } else {
      results.email = "no_api_key"
    }
  }

  // ── Slack alert (Pro+) ────────────────────────────────────────────────────
  if (cfg.slackAlerts && user.slackWebhookUrl) {
    try {
      const emoji = isDown ? "🔴" : "✅"
      const text = isDown
        ? `${emoji} *${projectName}* is DOWN — ${checkError || "no response"}\n<${projectUrl}|View project>`
        : `${emoji} *${projectName}* is back UP — ${responseMs}ms response\n<${projectUrl}|View project>`
      const slackRes = await fetch(user.slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, username: "m-ops", icon_emoji: ":satellite:" }),
      })
      results.slack = slackRes.ok ? "sent" : "failed"
    } catch { results.slack = "error" }
  }

  // ── PagerDuty alert (Pro+) ────────────────────────────────────────────────
  if (cfg.slackAlerts && user.pagerdutyKey) {
    try {
      const pdRes = await fetch("https://events.pagerduty.com/v2/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routing_key: user.pagerdutyKey,
          event_action: isDown ? "trigger" : "resolve",
          dedup_key: `mops-${projectName.replace(/\s+/g, "-").toLowerCase()}`,
          payload: {
            summary: isDown ? `${projectName} is down` : `${projectName} recovered`,
            source: projectUrl,
            severity: isDown ? "critical" : "info",
            custom_details: { url: projectUrl, error: checkError, responseMs },
          },
        }),
      })
      results.pagerduty = pdRes.ok ? "sent" : "failed"
    } catch { results.pagerduty = "error" }
  }

  return NextResponse.json({ ok: true, results })
}
