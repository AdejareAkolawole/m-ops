import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function StatusPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const page = await prisma.statusPage.findUnique({
    where: { slug },
    include: {
      project: {
        include: {
          incidents: { orderBy: { startedAt: "desc" }, take: 10 },
          uptimeLogs: {
            orderBy: { checkedAt: "desc" },
            take: 288, // last 24h at 5min intervals
          },
        },
      },
    },
  })

  if (!page || !page.public) notFound()

  const { project } = page
  const logs = project.uptimeLogs
  const lastLog = logs[0]
  const isUp = lastLog?.ok !== false
  const uptime = logs.length ? (logs.filter(l => l.ok).length / logs.length * 100).toFixed(2) : "100.00"
  const responseTimes = logs.filter(l => l.responseMs != null).map(l => l.responseMs!)
  const avgMs = responseTimes.length ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : null

  // 90-day uptime from DB
  const since90 = new Date(Date.now() - 90 * 86_400_000)
  const logs90 = await prisma.uptimeLog.findMany({ where: { projectId: project.id, checkedAt: { gte: since90 } } })
  const uptime90 = logs90.length ? (logs90.filter(l => l.ok).length / logs90.length * 100).toFixed(2) : "100.00"

  function timeAgo(date: Date) {
    const diff = Date.now() - date.getTime()
    if (diff < 60_000) return "just now"
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
    return `${Math.floor(diff / 86_400_000)}d ago`
  }

  function duration(secs: number | null) {
    if (!secs) return "—"
    if (secs < 60) return `${secs}s`
    if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`
    return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`
  }

  const BAR_COUNT = 90
  const barLogs = await prisma.uptimeLog.findMany({
    where: { projectId: project.id, checkedAt: { gte: since90 } },
    orderBy: { checkedAt: "asc" },
  })

  // Group into 90 daily buckets
  const buckets: boolean[] = Array(BAR_COUNT).fill(true)
  barLogs.forEach(log => {
    const daysAgo = Math.floor((Date.now() - log.checkedAt.getTime()) / 86_400_000)
    const idx = BAR_COUNT - 1 - Math.min(daysAgo, BAR_COUNT - 1)
    if (!log.ok) buckets[idx] = false
  })

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e8e8e8", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "20px 0" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.03em", color: "#fff" }}>{page.title}</span>
          <span style={{ fontSize: 11, color: "#444", fontWeight: 600, letterSpacing: "0.06em" }}>POWERED BY M-OPS.PRO</span>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
        {/* Status hero */}
        <div style={{ background: isUp ? "#0a1a0f" : "#1a0a0a", border: `1px solid ${isUp ? "#1a3a1a" : "#3a1a1a"}`, borderRadius: 16, padding: "32px 32px", marginBottom: 32, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: isUp ? "#4ade80" : "#f87171", flexShrink: 0, boxShadow: `0 0 12px ${isUp ? "#4ade8066" : "#f8717166"}` }} />
          <div>
            <p style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 4px", color: "#fff" }}>
              {isUp ? "All systems operational" : "Service disruption detected"}
            </p>
            <p style={{ fontSize: 13, color: "#555", margin: 0 }}>
              Last checked {lastLog ? timeAgo(lastLog.checkedAt) : "never"}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 32 }}>
          {[
            { label: "Uptime (24h)", value: `${uptime}%` },
            { label: "Uptime (90d)", value: `${uptime90}%` },
            { label: "Avg response", value: avgMs ? `${avgMs}ms` : "—" },
          ].map(s => (
            <div key={s.label} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "20px 20px" }}>
              <p style={{ fontSize: 11, color: "#444", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 8px" }}>{s.label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "#fff", margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* 90-day uptime bar */}
        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "24px 24px", marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#888", margin: 0 }}>90-day history</p>
            <p style={{ fontSize: 12, color: "#333", margin: 0 }}>{uptime90}% uptime</p>
          </div>
          <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 40 }}>
            {buckets.map((up, i) => (
              <div key={i} title={up ? "Operational" : "Incident"} style={{ flex: 1, height: up ? 40 : 20, borderRadius: 3, background: up ? "#4ade8033" : "#f8717166", border: `1px solid ${up ? "#4ade8022" : "#f8717133"}` }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 11, color: "#333" }}>90 days ago</span>
            <span style={{ fontSize: 11, color: "#333" }}>Today</span>
          </div>
        </div>

        {/* Incident history */}
        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #1a1a1a" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#888", margin: 0 }}>Recent incidents</p>
          </div>
          {project.incidents.length === 0 ? (
            <div style={{ padding: "32px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#333", margin: 0 }}>No incidents recorded 🎉</p>
            </div>
          ) : project.incidents.map((inc, i) => (
            <div key={inc.id} style={{ padding: "16px 24px", borderBottom: i < project.incidents.length - 1 ? "1px solid #141414" : "none", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: inc.resolvedAt ? "#888" : "#f87171", margin: "0 0 4px" }}>
                  {inc.resolvedAt ? "Resolved" : "Ongoing"} — {inc.error || "Service unavailable"}
                </p>
                <p style={{ fontSize: 12, color: "#333", margin: 0 }}>
                  {timeAgo(inc.startedAt)} · Duration: {duration(inc.duration)}
                </p>
              </div>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: inc.resolvedAt ? "#1a1a1a" : "#1a0a0a", color: inc.resolvedAt ? "#555" : "#f87171", border: `1px solid ${inc.resolvedAt ? "#222" : "#3a1a1a"}`, flexShrink: 0, marginLeft: 16 }}>
                {inc.resolvedAt ? "resolved" : "active"}
              </span>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#2a2a2a", marginTop: 48 }}>
          Monitored by <a href="https://m-ops.pro" style={{ color: "#444", textDecoration: "none" }}>m-ops.pro</a>
        </p>
      </div>
    </div>
  )
}
