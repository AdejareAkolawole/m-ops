import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { planConfig } from "@/lib/plans"
import { sendProjectDownAlert, sendProjectUpAlert } from "@/lib/email"

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
    try {
      if (isDown) {
        await sendProjectDownAlert(user.email!, projectName, projectUrl, checkError || null)
      } else {
        await sendProjectUpAlert(user.email!, projectName, projectUrl, responseMs ?? null)
      }
      results.email = "sent"
    } catch { results.email = "error" }
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
