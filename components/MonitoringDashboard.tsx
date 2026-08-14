"use client"
import { useMemo, useEffect, useState } from "react"
import { VercelSyncedProject, ManualProject, CheckResult } from "@/lib/types"
import {
  Activity01Icon, RocketIcon, UserIcon,
  ArrowUp01Icon, ArrowDown01Icon, ArrowRight01Icon, GlobalIcon,
} from "hugeicons-react"

type SelectedProject =
  | { type: "vercel"; project: VercelSyncedProject }
  | { type: "manual"; project: ManualProject }

interface Props {
  vercelProjects: VercelSyncedProject[]
  manualProjects: ManualProject[]
  allChecks: Record<string, CheckResult[]>
  uptime: Record<string, { ok: boolean; responseMs?: number }>
  onSelect?: (s: SelectedProject) => void
}

// Brand accent
const ACCENT = "#60a5fa"  // brand blue
const C_OK   = "#4ade80"  // nominal/good
const C_WARN = "#fb923c"  // warning
const C_CRIT = "#f87171"  // critical

function useLiveTick(intervalMs = 1000) {
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
}

function liveUptimeSeconds(checks: CheckResult[]): string | null {
  if (checks.length === 0) return null
  // Count consecutive "online" checks from the most recent, multiply by ~60s per check
  let streak = 0
  for (const c of checks) {
    if (c.status === "online") streak++
    else break
  }
  if (streak === 0) return null
  const secs = streak * 60 + Math.floor((Date.now() % 60000) / 1000)
  if (secs < 3600) return `${secs.toLocaleString()}s uptime`
  const hrs = Math.floor(secs / 3600)
  const mins = Math.floor((secs % 3600) / 60)
  return `${hrs}h ${mins}m uptime`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return "just now"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

export function MonitoringDashboard({ vercelProjects, manualProjects, allChecks, uptime, onSelect }: Props) {
  useLiveTick(1000) // re-render every second for live counters

  const allProjects = useMemo(() => [
    ...vercelProjects.map(p => ({ id: p.id, name: p.name, type: "vercel" as const, raw: p })),
    ...manualProjects.map(p => ({ id: p.id, name: p.name, type: "manual" as const, raw: p })),
  ], [vercelProjects, manualProjects])

  const stats = useMemo(() => {
    let online = 0, offline = 0, totalRespMs = 0, respCount = 0
    for (const proj of allProjects) {
      const u = uptime[proj.id]
      if (u) {
        if (u.ok) online++; else offline++
        if (u.responseMs) { totalRespMs += u.responseMs; respCount++ }
      }
    }
    return { online, offline, total: allProjects.length, avgResp: respCount > 0 ? Math.round(totalRespMs / respCount) : null }
  }, [allProjects, uptime])

  const avgUptime = useMemo(() => {
    let total = 0, count = 0
    for (const p of allProjects) {
      const h = allChecks[p.id] || []
      if (h.length) { total += h.filter(c => c.status === "online").length / h.length * 100; count++ }
    }
    return count > 0 ? Math.round(total / count) : null
  }, [allProjects, allChecks])

  const activity = useMemo(() => {
    const items: { key: string; type: "deploy"|"down"|"recover"|"signup"|"payment"; projectName: string; message: string; timestamp: string }[] = []
    for (const p of vercelProjects) {
      for (const d of (p.deployments || []).slice(0, 3)) {
        const msg = d.meta?.githubCommitMessage?.split("\n")[0] || d.state
        items.push({ key: `deploy-${d.uid}`, type: "deploy", projectName: p.name, message: `${d.state === "READY" ? "Deployed" : d.state === "ERROR" ? "Deploy failed" : "Deploying"}: ${msg}`, timestamp: new Date(d.createdAt).toISOString() })
      }
    }
    for (const proj of allProjects) {
      const checks = allChecks[proj.id] || []
      let wasDown = false
      for (let i = 0; i < Math.min(checks.length, 50); i++) {
        const c = checks[i]
        if (c.status === "offline" || c.status === "degraded") {
          if (!wasDown) items.push({ key: `down-${proj.id}-${c.timestamp}`, type: "down", projectName: proj.name, message: c.status === "degraded" ? "Degraded performance detected" : `Went offline${c.error ? ": " + c.error : ""}`, timestamp: c.timestamp })
          wasDown = true
        } else {
          if (wasDown) items.push({ key: `recover-${proj.id}-${c.timestamp}`, type: "recover", projectName: proj.name, message: "Recovered — back online", timestamp: c.timestamp })
          wasDown = false
        }
      }
    }
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10)
  }, [vercelProjects, allProjects, allChecks])

  if (allProjects.length === 0) return null

  return (
    <div className="animate-fade-in-up monitor-pad" style={{ padding: "32px 28px", maxWidth: "1000px" }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: "32px" }}>
        <p style={{ color: ACCENT, fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>
          WORKSPACE
        </p>
        <h1 style={{ color: "#fff", fontSize: "32px", fontWeight: 700, letterSpacing: "-0.025em", marginBottom: "8px", lineHeight: 1.1 }}>
          Projects
        </h1>
        <p style={{ color: "#505050", fontSize: "13.5px", lineHeight: 1.6 }}>
          Choose a service to inspect its health, alerts, and production activity.
        </p>
      </div>

      {/* ── Stat row ── */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "#141414", border: "1px solid #1e1e1e", borderRadius: "12px", overflow: "hidden", marginBottom: "28px" }}>
        {[
          {
            label: "Active projects",
            value: stats.online.toString(),
            sub: `${stats.total} total services`,
            valueColor: ACCENT,
          },
          {
            label: "Avg response",
            value: stats.avgResp != null ? `${stats.avgResp}ms` : "—",
            sub: stats.avgResp == null ? "checking…" : stats.avgResp > 2000 ? "slow" : stats.avgResp > 800 ? "moderate" : "fast",
            valueColor: stats.avgResp != null && stats.avgResp > 2000 ? "#ff4444" : "#fff",
          },
          {
            label: "Avg uptime",
            value: avgUptime != null ? `${avgUptime}%` : "—",
            sub: "across all projects",
            valueColor: avgUptime != null && avgUptime >= 99 ? C_OK : avgUptime != null && avgUptime >= 95 ? C_WARN : C_CRIT,
          },
        ].map((s, i) => (
          <div key={i} style={{ padding: "20px 22px", borderRight: i < 2 ? "1px solid #1e1e1e" : "none", borderBottom: "1px solid transparent" }}>
            <p style={{ color: "#484848", fontSize: "12px", marginBottom: "10px" }}>{s.label}</p>
            <p className="animate-count-in" style={{ color: s.valueColor, fontSize: "32px", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</p>
            <p style={{ color: "#303030", fontSize: "12px", marginTop: "8px" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Project list ── */}
      <div style={{ border: "1px solid #1a1a1a", borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
        {allProjects.map((proj, i) => {
          const u = uptime[proj.id]
          const checks = allChecks[proj.id] || []
          const last = checks[0]
          const isChecking = !u || (u as any).checking === true
          const isOnline = !isChecking && u?.ok === true
          const isOffline = !isChecking && u?.ok === false

          return (
            <button
              key={proj.id}
              onClick={() => {
                if (!onSelect) return
                if (proj.type === "vercel") onSelect({ type: "vercel", project: proj.raw as VercelSyncedProject })
                else onSelect({ type: "manual", project: proj.raw as ManualProject })
              }}
              className="animate-fade-in-up"
              style={{
                width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: "16px",
                padding: "18px 22px", background: "#0c0c0c", cursor: "pointer", transition: "background 0.15s ease",
                borderBottom: i < allProjects.length - 1 ? "1px solid #141414" : "none",
                animationDelay: `${i * 60}ms`, opacity: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#111" }}
              onMouseLeave={e => { e.currentTarget.style.background = "#0c0c0c" }}
            >
              {/* Project icon */}
              <div style={{ width: "38px", height: "38px", borderRadius: "9px", background: "#141414", border: "1px solid #1e1e1e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <GlobalIcon size={15} style={{ color: "#3a3a3a" }} />
              </div>

              {/* Name + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ color: "#fff", fontSize: "14px", fontWeight: 600, letterSpacing: "-0.01em" }}>{proj.name}</span>

                  {/* Status badge */}
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                    padding: "2px 9px", borderRadius: "99px",
                    color: isOnline ? C_OK : isOffline ? C_CRIT : "#383838",
                    background: isOnline ? `${C_OK}10` : isOffline ? `${C_CRIT}10` : "#0f0f0f",
                    border: `1px solid ${isOnline ? `${C_OK}25` : isOffline ? `${C_CRIT}25` : "#1a1a1a"}`,
                  }}>
                    <span className={isOnline ? "status-dot-nominal" : isOffline ? "status-dot-offline" : ""} style={{ width: "4px", height: "4px", borderRadius: "50%", background: isOnline ? C_OK : isOffline ? C_CRIT : "#282828", flexShrink: 0 }} />
                    {isChecking ? "CHECKING…" : isOnline ? "NOMINAL" : "UNREACHABLE"}
                  </span>

                  {/* Type tag */}
                  <span style={{ fontSize: "10px", color: "#2a2a2a", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {proj.type === "vercel" ? "VERCEL" : "CUSTOM"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <p style={{ color: "#383838", fontSize: "11.5px" }}>
                    {last ? `Last checked ${timeAgo(last.timestamp)}` : "No checks yet"}
                    {u?.responseMs ? ` · ${u.responseMs}ms` : ""}
                  </p>
                  {/* Live uptime counter — counts up every second */}
                  {isOnline && liveUptimeSeconds(checks) && (
                    <span style={{ color: "#1e3322", fontSize: "11px", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                      · {liveUptimeSeconds(checks)}
                    </span>
                  )}
                  {/* Live incident timer when down */}
                  {isOffline && last && (
                    <span style={{ color: "#3a1818", fontSize: "11px", fontVariantNumeric: "tabular-nums", display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: C_CRIT, animation: "status-pulse 1s ease-in-out infinite" }} />
                      {Math.floor((Date.now() - new Date(last.timestamp).getTime()) / 1000)}s unreachable
                    </span>
                  )}
                </div>
              </div>

              {/* Uptime bars */}
              <div style={{ display: "flex", gap: "2px", alignItems: "center", flexShrink: 0 }}>
                {(checks.length > 0 ? checks : Array(20).fill(null)).slice(0, 20).reverse().map((c, j) => (
                  <span key={j} style={{
                    width: "4px", height: "16px", borderRadius: "2px",
                    background: c ? (c.status === "online" ? C_OK : c.status === "degraded" ? C_WARN : C_CRIT) : "#1a1a1a",
                    opacity: checks.length > 0 ? (0.3 + (j / 20) * 0.7) : 1,
                  }} />
                ))}
              </div>

              <ArrowRight01Icon size={14} style={{ color: "#1e1e1e", flexShrink: 0 }} />
            </button>
          )
        })}
      </div>

      {/* ── Activity feed ── */}
      {activity.length > 0 && (
        <div style={{ background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "13px 20px", borderBottom: "1px solid #141414" }}>
            <p style={{ color: "#303030", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>LAST ACTIVITY</p>
          </div>
          {activity.map((item, i) => (
            <div key={item.key} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "11px 20px", borderBottom: i < activity.length - 1 ? "1px solid #0f0f0f" : "none" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0, background: item.type === "down" ? `${C_CRIT}15` : item.type === "recover" ? `${C_OK}15` : "#141414", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {item.type === "deploy" && <RocketIcon size={9} style={{ color: "#555" }} />}
                {item.type === "down" && <ArrowDown01Icon size={9} style={{ color: C_CRIT }} />}
                {item.type === "recover" && <ArrowUp01Icon size={9} style={{ color: ACCENT }} />}
                {item.type === "signup" && <UserIcon size={9} style={{ color: "#6699ff" }} />}
                {item.type === "payment" && <Activity01Icon size={9} style={{ color: ACCENT }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "#aaa", fontSize: "12.5px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.message}</p>
                <p style={{ color: "#303030", fontSize: "11px", marginTop: "2px" }}>{item.projectName} · {timeAgo(item.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
