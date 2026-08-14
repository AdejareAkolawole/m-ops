import Link from "next/link"

export const metadata = { title: "Roadmap — m-ops", description: "What we've shipped and where m-ops is going." }

type Status = "shipped" | "active" | "planned" | "later"

interface Item { title: string; desc: string; status: Status; tag: string }
interface Phase { label: string; phase: Status; quarter: string; items: Item[] }

const PHASES: Phase[] = [
  {
    label: "Shipped", phase: "shipped", quarter: "Live now",
    items: [
      { title: "Uptime monitoring", desc: "5-minute checks via external cron. Alerts on down and recovery. CHECKING→ status while in-flight.", status: "shipped", tag: "✓ Live" },
      { title: "Hub-health endpoint", desc: "Drop /api/hub-health into any backend. m-ops reads DB latency, payment counts, signups, custom stats — anything your app knows about itself.", status: "shipped", tag: "✓ Live" },
      { title: "Email + Slack alerts", desc: "Down/recovery notifications via email and Slack webhook. Alert deduplication prevents spam across cold starts.", status: "shipped", tag: "✓ Live" },
      { title: "Vercel integration", desc: "Connect your Vercel account. See deployments, rollback, manage env vars — all without leaving m-ops.", status: "shipped", tag: "✓ Live" },
      { title: "Public status pages", desc: "Shareable m-ops.pro/status/your-project — 90-day uptime bar, incident history, live status. No config needed.", status: "shipped", tag: "✓ Live" },
      { title: "Incident history + response time graphs", desc: "Every incident auto-created and closed with duration tracked. Response time logged per check. 90 days retained.", status: "shipped", tag: "✓ Live" },
      { title: "Weekly digest email", desc: "Monday morning summary: uptime %, incidents, avg response per project. Toggle in settings.", status: "shipped", tag: "✓ Live" },
      { title: "Free / Pro plans + billing", desc: "3 projects free. Pro unlocks unlimited projects, 30s checks, Slack, 90-day history.", status: "shipped", tag: "✓ Live" },
    ],
  },
  {
    label: "Building", phase: "active", quarter: "Q3 2026",
    items: [
      { title: "Custom metric threshold alerts", desc: "Set thresholds on any hub-health stat — crash_rate > 2%, error_rate spikes, failed_payments > 0. Alert fires the moment your app crosses the line.", status: "active", tag: "Building" },
      { title: "Multi-region uptime checks", desc: "Checks from US-East, EU-West, and Asia-Pacific simultaneously. See if your CDN is working everywhere, not just where your server is.", status: "active", tag: "Building" },
      { title: "API response validation", desc: "Not just 'did it respond?' — validate the actual response body. Alert when a key field is missing, null, or changed shape.", status: "active", tag: "Building" },
    ],
  },
  {
    label: "Next", phase: "planned", quarter: "Q4 2026",
    items: [
      { title: "Crash SDK integration", desc: "Connect Crashlytics, Sentry, or Bugsnag. Real-time crash spike alerts in minutes — not the day-late trend report App Store Connect gives you. Get paged the moment a release breaks.", status: "planned", tag: "Planned" },
      { title: "Cron job monitoring", desc: "Register your scheduled jobs. If a cron doesn't check in on time, you get alerted. Works with any language or platform.", status: "planned", tag: "Planned" },
      { title: "Error tracking (lite Sentry)", desc: "Catch unhandled exceptions directly in m-ops. Stack traces, frequency, first/last seen — no separate account needed.", status: "planned", tag: "Planned" },
      { title: "GitHub Actions deployment tracking", desc: "Link deployments to uptime. See exactly which release caused the spike. Correlate git SHA, deploy time, and incident start.", status: "planned", tag: "Planned" },
      { title: "SMS / WhatsApp alerts", desc: "For when email and Slack aren't enough at 3am. Pro feature.", status: "planned", tag: "Planned" },
    ],
  },
  {
    label: "Later", phase: "later", quarter: "2027",
    items: [
      { title: "AI anomaly detection", desc: "Learn your app's normal patterns. Flag anomalies before they become incidents — no threshold to configure.", status: "later", tag: "Later" },
      { title: "Database performance monitoring", desc: "Slow query detection, connection pool exhaustion, replication lag. Postgres, MySQL, SQLite.", status: "later", tag: "Later" },
      { title: "Team collaboration", desc: "Invite devs to your workspace. Assign incidents, shared on-call rotation, per-member notification preferences.", status: "later", tag: "Later" },
      { title: "Log streaming", desc: "Tail live logs from your app inside m-ops. Search, filter, and jump to the exact moment an incident started.", status: "later", tag: "Later" },
      { title: "Mobile app", desc: "iOS and Android. Push notifications for incidents. Full dashboard in your pocket.", status: "later", tag: "Later" },
    ],
  },
]

const phaseColors: Record<Status, { label: string; dot: string; tag: string }> = {
  shipped: {
    label: "bg-emerald-950 text-emerald-400",
    dot: "bg-emerald-500",
    tag: "bg-emerald-950 text-emerald-400",
  },
  active: {
    label: "bg-amber-950 text-amber-400",
    dot: "bg-amber-400 animate-pulse",
    tag: "bg-amber-950 text-amber-400",
  },
  planned: {
    label: "bg-zinc-900 text-zinc-400",
    dot: "border border-zinc-700 bg-transparent",
    tag: "border border-zinc-800 text-zinc-600",
  },
  later: {
    label: "bg-zinc-900 text-zinc-500",
    dot: "border border-zinc-800 bg-transparent",
    tag: "border border-zinc-800 text-zinc-700",
  },
}

export default function RoadmapPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#f0f0ee", fontFamily: "'Satoshi', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "64px 24px 96px" }}>

        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "ui-monospace,'SF Mono',monospace", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4a8af4", textDecoration: "none", marginBottom: 20 }}>
            ← m-ops.pro
          </Link>
          <h1 style={{ fontSize: "clamp(28px,5vw,40px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 14, color: "#f0f0ee" }}>
            What we&apos;re building<br />and where we&apos;re going
          </h1>
          <p style={{ fontSize: 15, color: "#505050", maxWidth: "52ch", lineHeight: 1.7 }}>
            m-ops started as uptime monitoring. The real goal is a{" "}
            <strong style={{ color: "#f0f0ee" }}>production command centre for solo devs and small teams</strong>{" "}
            — one place for everything happening inside your running app.
          </p>
        </div>

        {/* Phases */}
        {PHASES.map((phase) => {
          const c = phaseColors[phase.phase]
          return (
            <section key={phase.label} style={{ marginBottom: 48 }}>
              {/* Phase header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 4 }}
                  className={c.label}>
                  {phase.label}
                </span>
                <div style={{ flex: 1, height: 1, background: "#1e1e1c" }} />
                <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: "#2a2a28", letterSpacing: "0.06em" }}>{phase.quarter}</span>
              </div>

              {/* Items */}
              <div style={{ borderLeft: "1px solid #1e1e1c", marginLeft: 6, paddingLeft: 24 }}>
                {phase.items.map((item, i) => (
                  <div key={i} style={{ position: "relative", padding: "14px 0", borderBottom: i < phase.items.length - 1 ? "1px solid #141412" : "none" }}>
                    {/* Rail dot */}
                    <div style={{ position: "absolute", left: -30, top: 21, width: 8, height: 8, borderRadius: "50%" }}
                      className={c.dot} />

                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", color: "#f0f0ee", lineHeight: 1.4 }}>{item.title}</span>
                      <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 3, whiteSpace: "nowrap", flexShrink: 0, marginTop: 2 }}
                        className={c.tag}>
                        {item.tag}
                      </span>
                    </div>
                    <p style={{ fontSize: 12.5, color: "#505050", lineHeight: 1.6, maxWidth: "55ch" }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        {/* CTA */}
        <div style={{ marginTop: 56, padding: "28px", background: "#111110", border: "1px solid #1e1e1c", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <p style={{ fontSize: 13, color: "#505050", maxWidth: "42ch", lineHeight: 1.6 }}>
            <strong style={{ color: "#f0f0ee" }}>Something missing?</strong> If there&apos;s a feature that would make m-ops worth paying for — tell us.
          </p>
          <a href="mailto:hello@m-ops.pro" style={{ fontSize: 13, fontWeight: 600, color: "#4a8af4", textDecoration: "none", whiteSpace: "nowrap" }}>
            hello@m-ops.pro →
          </a>
        </div>

        <p style={{ marginTop: 48, fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: "#2a2a28", letterSpacing: "0.06em" }}>
          Last updated · August 2026 · m-ops.pro
        </p>
      </div>
    </div>
  )
}
