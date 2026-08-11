"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  Alert01Icon,
  Activity01Icon,
  CloudServerIcon,
  DatabaseIcon,
  Globe02Icon,
  AiBrain01Icon,
  GithubIcon,
  Clock01Icon,
} from "hugeicons-react"

const SERVICES = [
  {
    id: "api",
    Icon: CloudServerIcon,
    label: "API",
    desc: "Core monitoring and project APIs",
    color: "#4ade80",
    bg: "#051a10",
    border: "#0a3020",
  },
  {
    id: "checks",
    Icon: Activity01Icon,
    label: "Uptime checks",
    desc: "Scheduled pings and status monitoring",
    color: "#60a5fa",
    bg: "#0a1220",
    border: "#1a2a40",
  },
  {
    id: "db",
    Icon: DatabaseIcon,
    label: "Database",
    desc: "Primary data store (Turso)",
    color: "#a78bfa",
    bg: "#1a0f2e",
    border: "#2d1a5e",
  },
  {
    id: "cdn",
    Icon: Globe02Icon,
    label: "Edge / CDN",
    desc: "Dashboard delivery and static assets",
    color: "#fbbf24",
    bg: "#1a1200",
    border: "#3a2a00",
  },
  {
    id: "ai",
    Icon: AiBrain01Icon,
    label: "AI engine",
    desc: "Code analysis and fix suggestions",
    color: "#34d399",
    bg: "#051a10",
    border: "#0a3020",
  },
  {
    id: "github",
    Icon: GithubIcon,
    label: "GitHub integration",
    desc: "Repository sync and webhook ingestion",
    color: "#e8e8e8",
    bg: "#141414",
    border: "#2a2a2a",
  },
  {
    id: "alerts",
    Icon: Alert01Icon,
    label: "Alert delivery",
    desc: "Email, Slack, and PagerDuty notifications",
    color: "#f87171",
    bg: "#1a0a0a",
    border: "#3a1a1a",
  },
]

const INCIDENTS: { date: string; title: string; status: "resolved" | "monitoring" | "investigating"; body: string }[] = [
  {
    date: "2026-08-10",
    title: "Elevated API response times",
    status: "resolved",
    body: "Between 14:30 and 15:10 UTC, some users experienced slow dashboard loads due to a spike in check queue depth. The queue was flushed and response times returned to normal. No data was lost.",
  },
]

function StatusBadge({ status }: { status: "operational" | "degraded" | "outage" | "resolved" | "monitoring" | "investigating" }) {
  const map = {
    operational: { color: "#4ade80", bg: "#051a10", border: "#0a3020", label: "Operational" },
    degraded:    { color: "#fbbf24", bg: "#1a1200", border: "#3a2a00", label: "Degraded" },
    outage:      { color: "#f87171", bg: "#1a0a0a", border: "#3a1a1a", label: "Outage" },
    resolved:    { color: "#4ade80", bg: "#051a10", border: "#0a3020", label: "Resolved" },
    monitoring:  { color: "#fbbf24", bg: "#1a1200", border: "#3a2a00", label: "Monitoring" },
    investigating:{ color: "#f87171", bg: "#1a0a0a", border: "#3a1a1a", label: "Investigating" },
  }
  const s = map[status]
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: "2px 8px" }}>{s.label}</span>
  )
}

export default function StatusPage() {
  const [now, setNow] = useState("")

  useEffect(() => {
    setNow(new Date().toUTCString())
    const t = setInterval(() => setNow(new Date().toUTCString()), 10000)
    return () => clearInterval(t)
  }, [])

  const allOperational = true

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #141414", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, background: "#0a0a0a", zIndex: 10 }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 6, color: "#444", textDecoration: "none", fontSize: 13 }}>
          <ArrowLeft01Icon size={14} color="#444" /> Dashboard
        </Link>
        <div style={{ width: 1, height: 16, background: "#1e1e1e" }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#e8e8e8" }}>m-ops status</span>
        <div style={{ flex: 1 }} />
        {now && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#333", fontSize: 11 }}>
            <Clock01Icon size={12} color="#333" />
            {now}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 740, margin: "0 auto", padding: "48px 24px" }}>
        {/* Hero status */}
        <div style={{
          borderRadius: 18, padding: "28px 28px",
          background: allOperational ? "#051a10" : "#1a0a0a",
          border: `1px solid ${allOperational ? "#0a3020" : "#3a1a1a"}`,
          display: "flex", alignItems: "center", gap: 16, marginBottom: 32,
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: allOperational ? "#0a3020" : "#3a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {allOperational
              ? <CheckmarkCircle01Icon size={26} color="#4ade80" />
              : <Alert01Icon size={26} color="#f87171" />
            }
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: allOperational ? "#4ade80" : "#f87171", letterSpacing: "-0.03em", margin: 0 }}>
              {allOperational ? "All systems operational" : "Some systems affected"}
            </h1>
            <p style={{ fontSize: 13, color: allOperational ? "#1a5030" : "#5a2020", margin: 0 }}>
              {allOperational ? "Everything is running smoothly." : "We're investigating — see incidents below."}
            </p>
          </div>
        </div>

        {/* Services */}
        <p style={{ fontSize: 10, fontWeight: 700, color: "#2a2a2a", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Services</p>
        <div style={{ background: "#0f0f0f", border: "1px solid #141414", borderRadius: 16, overflow: "hidden", marginBottom: 40 }}>
          {SERVICES.map((svc, i) => {
            const SIcon = svc.Icon
            return (
              <div key={svc.id} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
                borderBottom: i < SERVICES.length - 1 ? "1px solid #111" : "none",
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: svc.bg, border: `1px solid ${svc.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <SIcon size={16} color={svc.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: "#d4d4d4", margin: 0 }}>{svc.label}</p>
                  <p style={{ fontSize: 11.5, color: "#333", margin: 0 }}>{svc.desc}</p>
                </div>
                <StatusBadge status="operational" />
              </div>
            )
          })}
        </div>

        {/* Uptime bars — last 90 days (simulated all-green) */}
        <p style={{ fontSize: 10, fontWeight: 700, color: "#2a2a2a", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>90-day uptime</p>
        <div style={{ background: "#0f0f0f", border: "1px solid #141414", borderRadius: 16, padding: "20px 20px", marginBottom: 40 }}>
          {SERVICES.slice(0, 4).map(svc => (
            <div key={svc.id} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#555" }}>{svc.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>99.98%</span>
              </div>
              <div style={{ display: "flex", gap: 2 }}>
                {Array.from({ length: 90 }).map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 20, borderRadius: 3, background: i === 79 ? "#1a3a00" : "#0a3020", opacity: i === 79 ? 0.6 : 1 }} title={i === 79 ? "Minor degradation" : "Operational"} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 10, color: "#2a2a2a" }}>90 days ago</span>
                <span style={{ fontSize: 10, color: "#2a2a2a" }}>Today</span>
              </div>
            </div>
          ))}
        </div>

        {/* Incidents */}
        <p style={{ fontSize: 10, fontWeight: 700, color: "#2a2a2a", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Recent incidents</p>
        {INCIDENTS.length === 0 ? (
          <div style={{ background: "#0f0f0f", border: "1px solid #141414", borderRadius: 16, padding: "24px 20px", textAlign: "center" }}>
            <CheckmarkCircle01Icon size={24} color="#1a3a1a" style={{ marginBottom: 8 }} />
            <p style={{ color: "#2a2a2a", fontSize: 13, margin: 0 }}>No incidents in the last 90 days</p>
          </div>
        ) : (
          <div style={{ background: "#0f0f0f", border: "1px solid #141414", borderRadius: 16, overflow: "hidden" }}>
            {INCIDENTS.map((inc, i) => (
              <div key={i} style={{ padding: "18px 20px", borderBottom: i < INCIDENTS.length - 1 ? "1px solid #111" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "#d4d4d4", margin: 0 }}>{inc.title}</p>
                  <StatusBadge status={inc.status} />
                </div>
                <p style={{ fontSize: 12, color: "#333", margin: "0 0 6px" }}>{inc.date}</p>
                <p style={{ fontSize: 13, color: "#555", lineHeight: 1.65, margin: 0 }}>{inc.body}</p>
              </div>
            ))}
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 12, color: "#1e1e1e", marginTop: 48 }}>
          m-ops platform status · updates every 10 seconds
        </p>
      </div>
    </div>
  )
}
