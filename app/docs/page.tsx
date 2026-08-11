"use client"
import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft01Icon,
  RocketIcon,
  GithubIcon,
  Notification01Icon,
  BarChartIcon,
  AiBrain01Icon,
  Link01Icon,
  KeyboardIcon,
  Code01Icon,
  ArrowRight01Icon,
  SearchIcon,
} from "hugeicons-react"

const SECTIONS = [
  {
    id: "quickstart",
    icon: RocketIcon,
    color: "#f59e0b",
    bg: "#1a1000",
    border: "#3a2500",
    title: "Quick start",
    desc: "Get monitoring in under 2 minutes",
    content: [
      {
        title: "1. Add your first project",
        body: `From the dashboard, click **Add Project** in the top right. Paste any URL — your app, API, or landing page. m-ops will immediately start pinging it every 5 minutes on the Free plan, every 30 seconds on Pro.

You can also connect a provider (Vercel, Netlify, Railway) with one API token and import all your projects at once.`,
      },
      {
        title: "2. Connect GitHub",
        body: `Go to **Settings → Integrations** and click **Connect GitHub**. Once connected, m-ops pulls in your repositories and begins scanning for code issues, open PRs, and deployment health.

The GitHub integration powers AI debugging — it gives the AI context about your actual codebase.`,
      },
      {
        title: "3. Set up alerts",
        body: `Go to **Settings → Alerts**. Email alerts are on by default. To add Slack, click **Add to Slack** and authorize m-ops in your workspace — you'll choose which channel to post to.

Pro and Team plans also support **PagerDuty** for on-call escalation.`,
      },
    ],
  },
  {
    id: "projects",
    icon: Link01Icon,
    color: "#60a5fa",
    bg: "#0a1220",
    border: "#1a2a40",
    title: "Projects",
    desc: "Manual URLs, Vercel, and more",
    content: [
      {
        title: "Manual projects",
        body: `Any HTTP/HTTPS URL can be a manual project. m-ops checks the URL at your plan's interval (5min free, 30sec pro) and records the status code, response time, and DNS/SSL health.

**Health endpoint** — if your app exposes `/api/health`, set it in the project settings to get structured health data instead of a raw status code.`,
      },
      {
        title: "Vercel projects",
        body: `Paste your Vercel API token in **Settings → Integrations** and m-ops imports all your projects automatically. Each Vercel project gets its own monitoring card with deployment status, domain health, and environment variable visibility.

Use the **Vercel Project Picker** to choose which projects to show on your dashboard.`,
      },
      {
        title: "Other providers",
        body: `Connect Netlify, Railway, Render, and more from **Add Project → Connect Provider**. Each integration pulls deployment status and exposes the project URL for uptime monitoring automatically.`,
      },
    ],
  },
  {
    id: "github",
    icon: GithubIcon,
    color: "#e8e8e8",
    bg: "#141414",
    border: "#2a2a2a",
    title: "GitHub integration",
    desc: "Code insights, AI fixes, PR tracking",
    content: [
      {
        title: "Code insights",
        body: `After connecting GitHub, open any project → **Code** tab. m-ops runs static analysis on your repository and surfaces issues by severity: **critical**, **high**, **medium**, and **low**.

Each issue shows the file, line, and a plain-English description of what's wrong.`,
      },
      {
        title: "AI debugging",
        body: `On Pro and Team plans, click **AI Fix** next to any issue and the AI will:
1. Read the affected code in context
2. Explain the root cause
3. Suggest a concrete fix with code

The AI uses your actual repo contents — not generic patterns — so fixes are specific to your codebase.`,
      },
      {
        title: "Pull requests",
        body: `The **PRs** tab shows all open pull requests, their CI status, review state, and whether they're blocking a deployment. Click any PR to open it directly on GitHub.`,
      },
    ],
  },
  {
    id: "alerts",
    icon: Notification01Icon,
    color: "#f87171",
    bg: "#1a0a0a",
    border: "#3a1a1a",
    title: "Alerts",
    desc: "Email, Slack, and PagerDuty",
    content: [
      {
        title: "Email alerts",
        body: `Email alerts are enabled by default for all plans. You'll get an email when any monitored project goes **down** and another when it **recovers**.

To toggle email alerts, go to **Settings → Notifications** and switch off "Notify by email".`,
      },
      {
        title: "Slack alerts",
        body: `Pro and Team plans can connect Slack via OAuth. Go to **Settings → Alerts → Add to Slack**. Choose your workspace and channel — m-ops posts a message the moment a project changes state.

The Slack message includes the project name, status, response time, and a direct link to the project on your dashboard.`,
      },
      {
        title: "PagerDuty",
        body: `For on-call escalation, paste your PagerDuty routing key in **Settings → Alerts → PagerDuty**. m-ops will trigger an incident when a project goes down and automatically resolve it when it recovers.`,
      },
    ],
  },
  {
    id: "sla",
    icon: BarChartIcon,
    color: "#34d399",
    bg: "#051a10",
    border: "#0a3020",
    title: "SLA reports",
    desc: "Uptime percentages and incident history",
    content: [
      {
        title: "Reading the SLA tab",
        body: `Open any project → **SLA Report**. You'll see uptime percentages for the last **24 hours**, **7 days**, **30 days**, and **90 days**, calculated from your live check history.

Below the numbers is a full incident list — every downtime event with its start time, end time, and duration.`,
      },
      {
        title: "How uptime is calculated",
        body: `Uptime % = (checks that returned a 2xx status) ÷ (total checks) × 100.

A check is counted as **down** if the status code is 4xx, 5xx, or if the request timed out. DNS and SSL errors also count as down.`,
      },
    ],
  },
  {
    id: "ai",
    icon: AiBrain01Icon,
    color: "#a78bfa",
    bg: "#1a0f2e",
    border: "#2d1a5e",
    title: "AI features",
    desc: "Debugging, fix suggestions, analysis",
    content: [
      {
        title: "AI is context-aware",
        body: `m-ops AI reads your actual code from GitHub before suggesting fixes. It doesn't give generic advice — it sees the exact file, function, and surrounding context where the issue lives.`,
      },
      {
        title: "What AI can do",
        body: `- Explain code issues in plain English
- Suggest concrete, copy-pasteable fixes
- Analyze why a deployment failed based on logs
- Summarise what changed in a PR and flag risk areas
- Answer questions about your repo in the chat panel`,
      },
      {
        title: "Plans with AI",
        body: `AI features are available on **Pro** ($2/mo) and **Team** ($5/mo) plans. The Free plan shows issue detection but locks AI fix suggestions and the AI chat panel.`,
      },
    ],
  },
  {
    id: "api",
    icon: Code01Icon,
    color: "#fbbf24",
    bg: "#1a1200",
    border: "#3a2a00",
    title: "API & webhooks",
    desc: "Integrate m-ops with your own tools",
    content: [
      {
        title: "Hub health endpoint",
        body: `If your project is built on the m-ops hub, expose \`/api/hub/health\` and set it in your project's **Health endpoint** field. m-ops will parse the structured response and show individual service statuses on your dashboard.`,
      },
      {
        title: "Webhooks (coming soon)",
        body: `Outbound webhooks that fire on status change events are planned for a future release. You'll be able to POST to any URL with a JSON payload describing the event.`,
      },
    ],
  },
]

export default function DocsPage() {
  const [active, setActive] = useState("quickstart")
  const [search, setSearch] = useState("")

  const filtered = search
    ? SECTIONS.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.content.some(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.body.toLowerCase().includes(search.toLowerCase()))
      )
    : SECTIONS

  const activeSection = SECTIONS.find(s => s.id === active) ?? SECTIONS[0]

  function renderBody(body: string) {
    return body.split("\n").map((line, i) => {
      if (!line.trim()) return <br key={i} />
      const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((p, j) => {
        if (p.startsWith("**") && p.endsWith("**")) return <strong key={j} style={{ color: "#d4d4d4" }}>{p.slice(2, -2)}</strong>
        if (p.startsWith("`") && p.endsWith("`")) return <code key={j} style={{ background: "#1a1a1a", border: "1px solid #222", borderRadius: 4, padding: "1px 6px", fontSize: 12, color: "#a78bfa", fontFamily: "monospace" }}>{p.slice(1, -1)}</code>
        if (line.startsWith("- ")) return null
        return p
      })
      if (line.startsWith("- ")) return <li key={i} style={{ color: "#666", fontSize: 13.5, lineHeight: 1.7, marginLeft: 4 }}>{line.slice(2)}</li>
      if (/^\d+\./.test(line)) return <li key={i} style={{ color: "#666", fontSize: 13.5, lineHeight: 1.7, marginLeft: 4, listStyle: "decimal" }}>{line.replace(/^\d+\.\s/, "")}</li>
      return <p key={i} style={{ color: "#666", fontSize: 13.5, lineHeight: 1.75, margin: "0 0 6px" }}>{parts}</p>
    })
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #141414", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, background: "#0a0a0a", zIndex: 10 }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 6, color: "#444", textDecoration: "none", fontSize: 13 }}>
          <ArrowLeft01Icon size={14} color="#444" /> Dashboard
        </Link>
        <div style={{ width: 1, height: 16, background: "#1e1e1e" }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#e8e8e8" }}>m-ops docs</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "6px 12px" }}>
          <SearchIcon size={13} color="#333" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search docs…"
            style={{ background: "none", border: "none", outline: "none", color: "#888", fontSize: 12.5, width: 160 }}
          />
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, maxWidth: 1100, margin: "0 auto", width: "100%", padding: "0 24px" }}>
        {/* Sidebar */}
        <div style={{ width: 220, flexShrink: 0, paddingTop: 32, paddingRight: 24 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#2a2a2a", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Contents</p>
          {(search ? filtered : SECTIONS).map(s => {
            const SIcon = s.Icon
            const isActive = s.id === active && !search
            return (
              <button key={s.id} onClick={() => { setActive(s.id); setSearch("") }} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9,
                background: isActive ? "#141414" : "transparent", border: isActive ? "1px solid #1e1e1e" : "1px solid transparent",
                cursor: "pointer", textAlign: "left", marginBottom: 2,
              }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: s.bg, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <SIcon size={12} color={s.color} />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: isActive ? "#e8e8e8" : "#444", margin: 0 }}>{s.title}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, paddingTop: 32, paddingLeft: 32, borderLeft: "1px solid #111" }}>
          {search ? (
            filtered.length === 0 ? (
              <p style={{ color: "#444", fontSize: 14 }}>No results for "{search}"</p>
            ) : filtered.map(section => {
              const SIcon = section.Icon
              return (
                <div key={section.id} style={{ marginBottom: 40 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: section.bg, border: `1px solid ${section.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <SIcon size={15} color={section.color} />
                    </div>
                    <h2 style={{ fontSize: 16, fontWeight: 800, color: "#e8e8e8", margin: 0 }}>{section.title}</h2>
                  </div>
                  {section.content.map((c, i) => (
                    <div key={i} style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: 13.5, fontWeight: 700, color: "#c4c4c4", marginBottom: 8 }}>{c.title}</h3>
                      <div>{renderBody(c.body)}</div>
                    </div>
                  ))}
                </div>
              )
            })
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: activeSection.bg, border: `1px solid ${activeSection.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <activeSection.Icon size={20} color={activeSection.color} />
                </div>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", margin: 0 }}>{activeSection.title}</h1>
                  <p style={{ fontSize: 13, color: "#444", margin: 0 }}>{activeSection.desc}</p>
                </div>
              </div>
              <div style={{ width: 40, height: 2, background: activeSection.color, borderRadius: 2, marginBottom: 32, opacity: 0.6 }} />
              {activeSection.content.map((c, i) => (
                <div key={i} style={{ marginBottom: 32, paddingBottom: 32, borderBottom: i < activeSection.content.length - 1 ? "1px solid #111" : "none" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#c4c4c4", marginBottom: 10 }}>{c.title}</h3>
                  <div>{renderBody(c.body)}</div>
                </div>
              ))}
              {/* Next section */}
              {SECTIONS.indexOf(activeSection) < SECTIONS.length - 1 && (() => {
                const next = SECTIONS[SECTIONS.indexOf(activeSection) + 1]
                const NIcon = next.Icon
                return (
                  <button onClick={() => setActive(next.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, background: "#111", border: "1px solid #1a1a1a", cursor: "pointer", width: "100%", textAlign: "left", marginTop: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: next.bg, border: `1px solid ${next.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <NIcon size={15} color={next.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 11, color: "#333", margin: 0 }}>Up next</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#888", margin: 0 }}>{next.title}</p>
                    </div>
                    <ArrowRight01Icon size={16} color="#333" />
                  </button>
                )
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
