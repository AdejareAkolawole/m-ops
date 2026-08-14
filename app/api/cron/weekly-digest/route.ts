import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendWeeklyDigest } from "@/lib/email"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const since = new Date(Date.now() - 7 * 86_400_000)

  const users = await prisma.user.findMany({
    where: { notifyWeeklyReport: true, email: { not: "" } },
    include: {
      projects: {
        include: {
          uptimeLogs: { where: { checkedAt: { gte: since } } },
          incidents: { where: { startedAt: { gte: since } } },
        },
      },
    },
  })

  let sent = 0
  for (const user of users) {
    if (!user.email || !user.projects.length) continue
    const projectStats = user.projects.map(p => {
      const logs = p.uptimeLogs
      const uptime = logs.length ? (logs.filter(l => l.ok).length / logs.length) * 100 : 100
      const responseTimes = logs.filter(l => l.responseMs != null).map(l => l.responseMs as number)
      const avgMs = responseTimes.length ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : null
      return { name: p.name, uptime, incidents: p.incidents.length, avgMs }
    })
    await sendWeeklyDigest(user.email, user.name ?? "there", projectStats).catch(() => {})
    sent++
  }

  return NextResponse.json({ ok: true, sent })
}
