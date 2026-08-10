"use client"
import { useState, useEffect, useCallback } from "react"
import { VercelSyncedProject, CheckResult, HubHealthResponse } from "@/lib/types"
import {
  ArrowLeft01Icon, ArrowReloadHorizontalIcon, LinkSquare02Icon,
  Loading03Icon, CheckmarkCircle02Icon, AlertCircleIcon,
  DatabaseIcon, RocketIcon, Key02Icon, AddSquareIcon,
  Activity01Icon, ChartLineData01Icon,
  GlobalIcon, Alert01Icon, Settings01Icon,
  SecurityCheckIcon, Time01Icon, LaptopIcon, // v2
} from "hugeicons-react"
import { getVercelAccount, getChecks, pushCheck, getProjectAdminConfig, saveProjectAdminConfig } from "@/lib/store"
import { cn } from "@/lib/utils"
import { CmsPanel } from "@/components/CmsPanel"
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard"
import { InsightsTab } from "@/components/InsightsTab"
import { DebugTab } from "@/components/DebugTab"

type Tab = "overview" | "performance" | "incidents" | "admin" | "insights" | "debug"

const TIME_WINDOWS = [
  { label: "1h",  ms: 60 * 60 * 1000 },
  { label: "6h",  ms: 6 * 60 * 60 * 1000 },
  { label: "24h", ms: 24 * 60 * 60 * 1000 },
  { label: "7d",  ms: 7 * 24 * 60 * 60 * 1000 },
]

export function VercelProjectDetail({ project: init, onBack, activeTab, onTabChange }: {
  project: VercelSyncedProject; onBack: () => void
  activeTab?: string; onTabChange?: (t: string) => void
}) {
  const [project] = useState(init)
  const [internalTab, setInternalTab] = useState<Tab>("overview")
  const tab = (activeTab as Tab | undefined) ?? internalTab
  const setTab = (t: Tab) => { onTabChange?.(t); setInternalTab(t) }
  const [checking, setChecking] = useState(false)
  const [check, setCheck] = useState<CheckResult | null>(null)
  const [history, setHistory] = useState<CheckResult[]>([])
  const [countdown, setCountdown] = useState(60)

  const account = getVercelAccount()
  const url = project.productionUrl ?? (project.latestDeployment ? `https://${project.latestDeployment.url}` : null)

  useEffect(() => {
    const saved = getChecks(project.id)
    if (saved.length > 0) { setHistory(saved); setCheck(saved[0]) }
  }, [project.id])

  const runCheck = useCallback(async () => {
    if (!url) return
    setChecking(true)
    setCountdown(60)
    try {
      const res = await fetch("/api/monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      if (res.ok) {
        const result: CheckResult = await res.json()
        pushCheck(project.id, result)
        setCheck(result)
        setHistory(getChecks(project.id))
      }
    } finally { setChecking(false) }
  }, [url, project.id])

  useEffect(() => { runCheck() }, [runCheck])

  useEffect(() => {
    const refresh = setInterval(runCheck, 60_000)
    const tick = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    return () => { clearInterval(refresh); clearInterval(tick) }
  }, [runCheck])

  const isUp = check?.status === "online"
  const isDown = check?.status === "offline"
  const isDegraded = check?.status === "degraded"

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, background: "#0a0a0a" }}>
      {/* ── Top bar ── */}
      <div style={{ background: "#0a0a0a", borderBottom: "1px solid #181818", padding: "0 28px", height: "52px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, overflow: "hidden" }}>
          <span style={{ color: "#444", fontSize: "13px", flexShrink: 0 }}>{project.name}</span>
          <span style={{ color: "#252525", fontSize: "13px", flexShrink: 0 }}>/</span>
          <span style={{ color: "#fff", fontSize: "13px", fontWeight: 600, textTransform: "capitalize", flexShrink: 0 }}>{tab}</span>
          <StatusPill status={check?.status} checking={checking} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <span style={{ fontSize: "11px", color: "#2e2e2e" }}>{countdown}s</span>
          <button onClick={runCheck} disabled={checking}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "7px", fontSize: "12px", fontWeight: 600, background: "#141414", border: "1px solid #1e1e1e", color: "#fff", cursor: "pointer", opacity: checking ? 0.5 : 1 }}
          >
            <ArrowReloadHorizontalIcon size={11} className={cn(checking && "animate-spin")} />
            Check now
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {tab === "overview"    && <OverviewTab project={project} check={check} history={history} checking={checking} />}
        {tab === "performance" && <PerformanceTab history={history} />}
        {tab === "incidents"   && <IncidentsTab history={history} />}
        {tab === "admin"       && <AdminTab project={project} account={account} url={url} />}
        {tab === "insights"    && <InsightsTab projectId={project.id} projectName={project.name} onTabChange={onTabChange} />}
        {tab === "debug"       && <DebugTab project={project} lastCheck={check} />}
      </div>
    </div>
  )
}

// ── Status pill ───────────────────────────────────────────────────────────────

const ACCENT = "#60a5fa"   // brand violet — logo, nav, buttons
const C_OK    = "#4ade80"   // nominal/good
const C_WARN  = "#fb923c"   // degraded/warning
const C_CRIT  = "#f87171"   // offline/critical

function StatusPill({ status, checking }: { status?: string; checking: boolean }) {
  if (checking) return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "99px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", background: "#111", color: "#383838", border: "1px solid #1e1e1e" }}>
      <Loading03Icon size={9} className="animate-spin" style={{ color: "#444" }} /> PROBING
    </span>
  )
  if (status === "online") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "99px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", background: `${C_OK}15`, color: C_OK, border: `1px solid ${C_OK}30` }}>
      <span className="status-dot-nominal" style={{ width: "5px", height: "5px", borderRadius: "50%", background: C_OK, flexShrink: 0 }} /> NOMINAL
    </span>
  )
  if (status === "offline") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "99px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", background: `${C_CRIT}15`, color: C_CRIT, border: `1px solid ${C_CRIT}30` }}>
      <span className="status-dot-offline" style={{ width: "5px", height: "5px", borderRadius: "50%", background: C_CRIT, flexShrink: 0 }} /> UNREACHABLE
    </span>
  )
  if (status === "degraded") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "99px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", background: `${C_WARN}15`, color: C_WARN, border: `1px solid ${C_WARN}30` }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: C_WARN, flexShrink: 0 }} /> DEGRADED
    </span>
  )
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "99px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", background: "#111", color: "#303030", border: "1px solid #1a1a1a" }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#222", flexShrink: 0 }} /> AWAITING
    </span>
  )
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ project, check, history, checking }: { project: VercelSyncedProject; check: CheckResult | null; history: CheckResult[]; checking: boolean }) {
  const uptimePct = history.length > 0
    ? Math.round(history.filter(h => h.status === "online").length / history.length * 100) : null
  // Read from localStorage each render so config saved in Admin tab shows up immediately
  const adminCfg = getProjectAdminConfig(project.id)

  const lastCheckedAgo = check
    ? (() => {
        const ms = Date.now() - new Date(check.timestamp).getTime()
        if (ms < 60_000) return "just now"
        if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`
        return `${Math.floor(ms / 3_600_000)}h ago`
      })()
    : null

  return (
    <div className="animate-fade-in-up" style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: "20px", maxWidth: "960px" }}>

      {/* Section header — Lumen-style */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
        <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em" }}>Overview</h2>
        {lastCheckedAgo && (
          <span style={{ color: "#2a2a2a", fontSize: "12px" }}>· Updated {lastCheckedAgo}</span>
        )}
      </div>

      {/* Quick metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricTile
          label="Response time"
          value={check?.responseMs != null ? `${check.responseMs}ms` : "—"}
          icon={<Time01Icon size={14} />}
          accent={check?.responseMs == null ? "neutral" : check.responseMs > 2000 ? "red" : check.responseMs > 800 ? "amber" : "green"}
        />
        <MetricTile
          label="DNS"
          value={check?.dns?.ok === true ? "Resolving" : check?.dns?.ok === false ? "Failed" : "—"}
          sub={check?.dns?.resolvedIp}
          icon={<GlobalIcon size={14} />}
          accent={check?.dns?.ok === true ? "green" : check?.dns?.ok === false ? "red" : "neutral"}
        />
        <MetricTile
          label="SSL"
          value={check?.ssl?.ok === true ? "Valid" : check?.ssl?.ok === false ? "No SSL" : "—"}
          sub={check?.ssl?.daysLeft != null ? `${check.ssl.daysLeft} days left` : undefined}
          icon={<SecurityCheckIcon size={14} />}
          accent={check?.ssl?.ok === true ? "green" : check?.ssl?.ok === false ? "amber" : "neutral"}
        />
        <MetricTile
          label="Uptime"
          value={uptimePct != null ? `${uptimePct}%` : "—"}
          sub={`${history.length} checks`}
          icon={<Activity01Icon size={14} />}
          accent={uptimePct == null ? "neutral" : uptimePct >= 99 ? "green" : uptimePct >= 95 ? "amber" : "red"}
        />
      </div>

      {/* Uptime track */}
      {history.length > 1 && (
        <div style={{ background: "#0d0d0d", borderRadius: "14px", padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <p style={{ color: "#2a2a2a", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Uptime track</p>
              <p style={{ color: "#383838", fontSize: "12px" }}>Last {Math.min(history.length, 45)} checks</p>
            </div>
            {uptimePct != null && (
              <div style={{ textAlign: "right" }}>
                <p className="animate-count-in" style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, color: uptimePct >= 99 ? C_OK : uptimePct >= 95 ? C_WARN : C_CRIT }}>
                  {uptimePct}%
                </p>
                <p style={{ color: "#252525", fontSize: "11px", marginTop: "4px" }}>
                  {uptimePct >= 99 ? "excellent" : uptimePct >= 95 ? "degraded" : "critical"}
                </p>
              </div>
            )}
          </div>
          <UptimeBars history={history} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
            <p style={{ color: "#1e1e1e", fontSize: "10px" }}>Oldest</p>
            <p style={{ color: "#1e1e1e", fontSize: "10px" }}>Now</p>
          </div>
        </div>
      )}

      {/* Errors with solutions */}
      {check?.http?.error && (
        <ErrorBanner icon={<AlertCircleIcon size={14} />} title="Connection error" message={check.http.error}
          solution="Check that the URL is correct and the server is running. Verify firewall rules allow inbound HTTP/HTTPS traffic."
          color="red" />
      )}
      {check?.dns?.error && (
        <ErrorBanner icon={<GlobalIcon size={14} />} title="DNS resolution failed" message={check.dns.error}
          solution="Verify your DNS records are correctly configured. A record or CNAME should point to your server. Propagation can take up to 48 hours."
          color="amber" />
      )}
      {check?.ssl?.ok === false && (
        <ErrorBanner icon={<SecurityCheckIcon size={14} />} title="SSL certificate issue" message="No valid SSL certificate detected"
          solution="Install a TLS certificate using Let's Encrypt (free) or your hosting provider's SSL option. HTTPS is required for secure connections."
          color="amber" />
      )}

      {/* App health */}
      {check?.health ? (
        <AppHealthSection health={check.health} />
      ) : check && (
        <div style={{ border: "1px dashed #1c1c1c", borderRadius: "12px", padding: "36px", textAlign: "center" }}>
          <LaptopIcon size={22} style={{ color: "#282828", margin: "0 auto 12px" }} />
          <p style={{ color: "#444", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>No app health data</p>
          <p style={{ color: "#2a2a2a", fontSize: "12px", maxWidth: "360px", margin: "0 auto", lineHeight: 1.6 }}>
            Add <code style={{ background: "#161616", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", color: ACCENT }}>/api/hub-health</code> to your project and set the health endpoint in Admin to see DB status, users, and revenue.
          </p>
        </div>
      )}

      {/* Analytics dashboard */}
      {adminCfg.adminApiUrl && (
        <AnalyticsDashboard projectId={project.id} />
      )}
    </div>
  )
}

// ── Performance tab ───────────────────────────────────────────────────────────

function PerformanceTab({ history }: { history: CheckResult[] }) {
  const [window, setWindow] = useState("24h")
  const windowMs = TIME_WINDOWS.find(w => w.label === window)?.ms ?? Infinity
  const now = Date.now()
  const filtered = history.filter(h => now - new Date(h.timestamp).getTime() <= windowMs)
  const chrono = filtered.slice().reverse()

  const times = filtered.filter(h => h.responseMs != null).map(h => h.responseMs!)
  const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null
  const sorted = [...times].sort((a, b) => a - b)
  const p95 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1] : null
  const p99 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.99)] ?? sorted[sorted.length - 1] : null
  const uptimePct = filtered.length > 0 ? Math.round(filtered.filter(h => h.status === "online").length / filtered.length * 100) : null

  return (
    <div className="animate-fade-in-up" style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: "20px", maxWidth: "960px" }}>

      {/* Header + time filter — Lumen-style */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em" }}>Performance</h2>
          <p style={{ color: "#2a2a2a", fontSize: "12px", marginTop: "3px" }}>{filtered.length} checks in window</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "2px", background: "#111", borderRadius: "10px", padding: "3px" }}>
          {TIME_WINDOWS.map(w => (
            <button key={w.label} onClick={() => setWindow(w.label)} style={{
              padding: "5px 12px", borderRadius: "7px", fontSize: "11px", fontWeight: 600,
              background: window === w.label ? "#1e1e1e" : "transparent",
              color: window === w.label ? "#e8e8e8" : "#333",
              border: "none", cursor: "pointer", transition: "all 0.1s",
            }}>
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricTile label="Uptime" value={uptimePct != null ? `${uptimePct}%` : "—"} icon={<Activity01Icon size={14} />}
          accent={uptimePct == null ? "neutral" : uptimePct >= 99 ? "green" : uptimePct >= 95 ? "amber" : "red"} />
        <MetricTile label="Avg response" value={avg != null ? `${avg}ms` : "—"} icon={<Time01Icon size={14} />}
          accent={avg == null ? "neutral" : avg > 2000 ? "red" : avg > 800 ? "amber" : "green"} />
        <MetricTile label="P95" value={p95 != null ? `${p95}ms` : "—"} icon={<ChartLineData01Icon size={14} />} accent="neutral" />
        <MetricTile label="P99" value={p99 != null ? `${p99}ms` : "—"} icon={<ChartLineData01Icon size={14} />} accent="neutral" />
      </div>

      {chrono.length >= 2 ? (
        <div style={{ background: "#0d0d0d", borderRadius: "14px", padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px" }}>
            <div>
              <p style={{ color: "#2a2a2a", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>Response time</p>
              <p style={{ color: "#383838", fontSize: "12px" }}>milliseconds over time</p>
            </div>
            {avg != null && (
              <p className="animate-count-in" style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.025em", color: avg > 2000 ? C_CRIT : avg > 800 ? C_WARN : C_OK }}>
                {avg}ms
              </p>
            )}
          </div>
          <ResponseChart data={chrono} />
        </div>
      ) : (
        <div style={{ background: "#0d0d0d", borderRadius: "14px", padding: "48px", textAlign: "center" }}>
          <p style={{ color: "#2a2a2a", fontSize: "13px" }}>Not enough data yet in this window.</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ background: "#0d0d0d", borderRadius: "14px", padding: "22px 24px" }}>
          <p style={{ color: "#2a2a2a", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "16px" }}>Uptime track</p>
          <UptimeBars history={filtered} count={Math.min(filtered.length, 60)} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
            <p style={{ color: "#1e1e1e", fontSize: "10px" }}>Oldest</p>
            <p style={{ color: "#1e1e1e", fontSize: "10px" }}>Now</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Incidents tab ─────────────────────────────────────────────────────────────

function IncidentsTab({ history }: { history: CheckResult[] }) {
  const incidents = deriveIncidents(history)
  const active = incidents.filter(i => !i.resolved)
  const resolved = incidents.filter(i => i.resolved)

  return (
    <div className="animate-fade-in-up" style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: "20px", maxWidth: "800px" }}>
      <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em" }}>Incidents</h2>

      {active.length > 0 && (
        <div style={{ background: "#120000", border: "1px solid #2a0000", borderRadius: "14px", padding: "18px 20px" }}>
          <p style={{ color: "#ff5555", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
            ⚠ Active incident
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {active.map((inc, i) => <IncidentRow key={i} inc={inc} />)}
          </div>
        </div>
      )}

      {incidents.length === 0 ? (
        <div style={{ background: "#0d0d0d", borderRadius: "14px", padding: "64px", textAlign: "center" }}>
          <CheckmarkCircle02Icon size={28} style={{ color: ACCENT, margin: "0 auto 12px" }} />
          <p style={{ color: "#e8e8e8", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>All systems nominal</p>
          <p style={{ color: "#2a2a2a", fontSize: "12px" }}>No incidents detected in your check history.</p>
        </div>
      ) : resolved.length > 0 && (
        <div>
          <p style={{ color: "#2a2a2a", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Past incidents</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {resolved.map((inc, i) => <IncidentRow key={i} inc={inc} />)}
          </div>
        </div>
      )}
    </div>
  )
}

const ERROR_TYPE_LABEL: Record<string, string> = {
  http: "HTTP Error", dns: "DNS Failure", ssl: "SSL Error", timeout: "Timeout", unknown: "Unreachable",
}

function IncidentRow({ inc }: { inc: Incident }) {
  const dotColor = inc.resolved ? "#282828" : "#ff4444"
  const causeLabel = inc.cause || "Service unreachable"
  const typeTag = inc.errorType ? ERROR_TYPE_LABEL[inc.errorType] : null

  return (
    <div style={{
      background: "#0d0d0d", borderRadius: "12px", padding: "16px 18px",
      display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "14px",
      border: inc.resolved ? "1px solid #141414" : "1px solid #2a0000",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1, minWidth: 0 }}>
        <span className={inc.resolved ? "" : "status-dot-offline"} style={{
          width: "7px", height: "7px", borderRadius: "50%", marginTop: "6px", flexShrink: 0,
          background: dotColor,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Cause — the actual reason, front and centre */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px", flexWrap: "wrap" }}>
            <p style={{ color: inc.resolved ? "#606060" : "#e8e8e8", fontSize: "13.5px", fontWeight: 600 }}>
              {causeLabel}
              {inc.httpStatus && (
                <span style={{ color: inc.resolved ? "#383838" : C_CRIT, fontVariantNumeric: "tabular-nums", marginLeft: "6px" }}>
                  ({inc.httpStatus})
                </span>
              )}
            </p>
            {!inc.resolved && (
              <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", padding: "2px 7px", borderRadius: "99px", background: "#2a000010", color: "#ff5555", border: "1px solid #2a0000" }}>
                ONGOING
              </span>
            )}
            {typeTag && (
              <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em", padding: "2px 7px", borderRadius: "99px", background: "#161616", color: "#383838" }}>
                {typeTag}
              </span>
            )}
          </div>

          {/* Timestamps */}
          <p style={{ color: "#303030", fontSize: "11px" }}>
            Started {new Date(inc.startedAt).toLocaleString()}
          </p>
          {inc.resolved && inc.resolvedAt && (
            <p style={{ color: "#282828", fontSize: "11px", marginTop: "2px" }}>
              Resolved {timeAgo(inc.resolvedAt)}
              {inc.duration != null && <span style={{ color: "#1e1e1e", marginLeft: "6px" }}>· lasted {formatDuration(inc.duration)}</span>}
            </p>
          )}
        </div>
      </div>

      {/* Duration pill — only for active incidents */}
      {!inc.resolved && inc.duration == null && (
        <span style={{ fontSize: "11px", fontWeight: 600, background: "#1a0000", color: "#ff4444", padding: "3px 10px", borderRadius: "99px", flexShrink: 0, border: "1px solid #2a0000" }}>
          ongoing
        </span>
      )}
      {inc.resolved && inc.duration != null && (
        <span style={{ fontSize: "11px", fontWeight: 600, background: "#161616", color: "#303030", padding: "3px 10px", borderRadius: "99px", flexShrink: 0 }}>
          {formatDuration(inc.duration)}
        </span>
      )}
    </div>
  )
}

// ── Admin tab ─────────────────────────────────────────────────────────────────

function AdminTab({ project, account, url }: {
  project: VercelSyncedProject
  account: ReturnType<typeof getVercelAccount>
  url: string | null
}) {
  const [section, setSection] = useState<"deploy" | "env" | "domains" | "cms" | "config">("deploy")
  const [adminCfg, setAdminCfg] = useState(() => getProjectAdminConfig(project.id))
  const [adminUrlInput, setAdminUrlInput] = useState(adminCfg.adminUrl ?? "")
  const [adminApiUrlInput, setAdminApiUrlInput] = useState(adminCfg.adminApiUrl ?? "")
  const [adminApiTokenInput, setAdminApiTokenInput] = useState(adminCfg.adminApiToken ?? "")
  const [cfgSaved, setCfgSaved] = useState(false)

  function saveAdminCfg() {
    const cfg = { adminUrl: adminUrlInput.trim() || undefined, adminApiUrl: adminApiUrlInput.trim() || undefined, adminApiToken: adminApiTokenInput.trim() || undefined }
    saveProjectAdminConfig(project.id, cfg)
    setAdminCfg(cfg)
    setCfgSaved(true)
    setTimeout(() => setCfgSaved(false), 2000)
  }

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Admin</h2>
        <p className="text-xs text-zinc-400 mt-0.5">Manage deployments, env vars, and settings without Claude</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2.5 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-white/10 dark:hover:border-white/10 transition-colors group">
            <LinkSquare02Icon size={14} className="text-zinc-400 group-hover:text-white transition-colors" />
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-white">Open site</p>
              <p className="text-[10px] text-zinc-400">Production</p>
            </div>
          </a>
        )}
        {(adminCfg.adminUrl || url) && (
          <a href={adminCfg.adminUrl || `${url}/admin`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2.5 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-white/10 dark:hover:border-white/10 transition-colors group">
            <Settings01Icon size={14} className="text-zinc-400 group-hover:text-white transition-colors" />
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-white">Admin panel</p>
              <p className="text-[10px] text-zinc-400">{adminCfg.adminUrl ? "Custom link" : "Your app's CMS"}</p>
            </div>
          </a>
        )}
        {account && (
          <a href={`https://vercel.com/${project.name}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2.5 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-white/10 dark:hover:border-white/10 transition-colors group">
            <RocketIcon size={14} className="text-zinc-400 group-hover:text-white transition-colors" />
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-white">Vercel</p>
              <p className="text-[10px] text-zinc-400">Dashboard</p>
            </div>
          </a>
        )}
      </div>

      {/* Section switcher — always visible */}
      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 w-fit flex-wrap">
        {(["deploy", "env", "domains", "cms", "config"] as const).map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
              section === s ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}>
            {s === "deploy" ? "Deploy" : s === "env" ? "Env vars" : s === "domains" ? "Domains" : s === "cms" ? "✦ CMS" : "Admin config"}
          </button>
        ))}
      </div>

      {/* Vercel-gated sections */}
      {(section === "deploy" || section === "env" || section === "domains" || section === "cms") && (
        !account ? (
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center">
            <p className="text-sm text-zinc-400">Connect Vercel to unlock deploy and env actions.</p>
          </div>
        ) : (
          <>
            {section === "deploy" && <DeploySection account={account} project={project} />}
            {section === "env"    && <EnvSection account={account} project={project} />}
            {section === "domains" && <DomainsSection project={project} />}
            {section === "cms" && url && (
              <CmsPanel projectUrl={url} hubSecret={""} projectName={project.name} storageKey={project.id} />
            )}
            {section === "cms" && !url && (
              <p className="text-sm text-zinc-400">No production URL found for this project.</p>
            )}
          </>
        )
      )}

      {/* Admin config — always available, no Vercel required */}
      {section === "config" && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-0.5">Admin panel config</p>
                <p className="text-xs text-zinc-400">Link your existing admin panel so the hub can open it and pull analytics data.</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Admin URL</label>
                  <input
                    value={adminUrlInput}
                    onChange={e => setAdminUrlInput(e.target.value)}
                    placeholder="https://yourapp.com/admin"
                    className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">This replaces the default /admin link in the quick links above.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Analytics API endpoint</label>
                  <input
                    value={adminApiUrlInput}
                    onChange={e => setAdminApiUrlInput(e.target.value)}
                    placeholder="https://yourapp.com/api/hub-stats"
                    className="w-full text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">GET endpoint returning JSON — revenue, users, orders, traffic, etc. shown in Overview.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">API token <span className="text-zinc-300">(optional)</span></label>
                  <input
                    type="password"
                    value={adminApiTokenInput}
                    onChange={e => setAdminApiTokenInput(e.target.value)}
                    placeholder="Bearer token for the endpoint"
                    className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
              </div>
              <button
                onClick={saveAdminCfg}
                className={cn("px-4 py-2 rounded-lg text-xs font-semibold transition-all",
                  cfgSaved ? "bg-white/10 text-white" : "bg-white/10 hover:bg-white/10 text-white"
                )}>
                {cfgSaved ? "Saved ✓" : "Save config"}
              </button>
            </div>
          )}
    </div>
  )
}

function DeploySection({ account, project }: { account: NonNullable<ReturnType<typeof getVercelAccount>>; project: VercelSyncedProject }) {
  const past = (project.deployments ?? []).filter(d => d.state === "READY" && d.uid !== project.latestDeployment?.uid)
  return (
    <div className="space-y-4">
      {/* Current deployment */}
      {project.latestDeployment && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Current deployment</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                {(project.latestDeployment.meta as Record<string,string>)?.githubCommitMessage?.slice(0, 60) ?? project.latestDeployment.url}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">{timeAgo(project.latestDeployment.createdAt)}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 dark:bg-white/5 text-white dark:text-white">LIVE</span>
          </div>
          <RedeployButton account={account} project={project} />
        </div>
      )}

      {/* Rollback */}
      {past.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Rollback</p>
          <p className="text-xs text-zinc-400 mb-4">Promote a previous deployment back to production.</p>
          <RollbackSelector account={account} project={project} />
        </div>
      )}
    </div>
  )
}

function EnvSection({ account, project }: { account: NonNullable<ReturnType<typeof getVercelAccount>>; project: VercelSyncedProject }) {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Add environment variable</p>
        <p className="text-xs text-zinc-400 mb-4">Changes take effect on the next deployment.</p>
        <AddEnvVarForm account={account} project={project} />
      </div>

      {project.envKeys && project.envKeys.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Existing variables</p>
          <p className="text-[11px] text-zinc-400 mb-4">Key names only — values are never exposed here.</p>
          <div className="space-y-0.5">
            {project.envKeys.filter((e, i, arr) => arr.findIndex(x => x.key === e.key) === i).map((e) => (
              <div key={e.key} className="flex items-center justify-between py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <div className="flex items-center gap-2">
                  <Key02Icon size={10} className="text-zinc-400" />
                  <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">{e.key}</span>
                </div>
                <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  {e.target.join(", ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DomainsSection({ project }: { project: VercelSyncedProject }) {
  if (!project.domains || project.domains.length === 0) return (
    <div className="rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center">
      <p className="text-sm text-zinc-400">No domain data — sync your Vercel account to load domains.</p>
    </div>
  )
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-2">
      {project.domains.map(d => (
        <div key={d.name} className="flex items-center justify-between py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
          <div className="flex items-center gap-2">
            <GlobalIcon size={12} className={d.configured ? "text-white" : "text-amber-400"} />
            <span className="text-sm font-mono text-zinc-700 dark:text-zinc-300">{d.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {d.configured && <span className="text-[10px] text-white bg-white/10 dark:bg-white/10/20 px-2 py-0.5 rounded-full">Configured</span>}
            {d.verified && <span className="text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">Verified</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── App Health ────────────────────────────────────────────────────────────────

function AppHealthSection({ health }: { health: HubHealthResponse }) {
  return (
    <div className="space-y-4">
      {health.db && (
        <div className={cn(
          "rounded-2xl border p-4 flex items-center justify-between",
          health.db.ok
            ? "bg-white/10 dark:bg-white/10/20 border-white/20 dark:border-white/20/40"
            : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40"
        )}>
          <div className="flex items-center gap-3">
            <DatabaseIcon size={16} className={health.db.ok ? "text-white" : "text-red-400"} />
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Database</p>
              {health.db.latencyMs != null && <p className="text-xs text-zinc-400">{health.db.latencyMs}ms query latency</p>}
              {health.db.error && <p className="text-xs text-red-500">{health.db.error}</p>}
            </div>
          </div>
          <span className={cn("text-xs font-bold px-3 py-1 rounded-full",
            health.db.ok
              ? "bg-white/10 text-white"
              : "bg-red-500 text-white"
          )}>
            {health.db.ok ? "Connected" : "Disconnected"}
          </span>
        </div>
      )}

      {health.stats && Object.keys(health.stats).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">App stats</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(health.stats).filter(([, v]) => v != null).map(([k, v]) => (
              <div key={k} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide">{k.replace(/_/g, " ")}</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{String(v)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {health.payments && (
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 rounded-2xl border border-white/10 dark:border-white/10/40 p-5">
          <p className="text-xs font-semibold text-white dark:text-white uppercase tracking-wide mb-2">Payments today</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">{health.payments.todayCount ?? 0}</p>
          {health.payments.todayAmount != null && (
            <p className="text-lg font-semibold text-white mt-0.5">
              {health.payments.currency} {health.payments.todayAmount?.toLocaleString()}
            </p>
          )}
        </div>
      )}

      {health.recentSignups && health.recentSignups.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Recent signups</p>
          <div className="space-y-2">
            {health.recentSignups.slice(0, 5).map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{u.name ?? u.email}</p>
                  {u.name && <p className="text-xs text-zinc-400">{u.email}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {u.plan && <span className="text-[10px] bg-white/10 dark:bg-white/5 text-white dark:text-white px-2 py-0.5 rounded-full font-medium">{u.plan}</span>}
                  <span className="text-[11px] text-zinc-400">{timeAgo(u.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

type Accent = "green" | "red" | "amber" | "neutral"

function MetricTile({ label, value, sub, icon, accent }: { label: string; value: string; sub?: string; icon: React.ReactNode; accent: Accent }) {
  const valueColor = accent === "red" ? C_CRIT : accent === "amber" ? C_WARN : accent === "green" ? C_OK : "#e8e8e8"
  const iconBg = accent === "red" ? `${C_CRIT}12` : accent === "amber" ? `${C_WARN}12` : accent === "green" ? `${C_OK}12` : "#161616"
  const iconColor = accent === "red" ? C_CRIT : accent === "amber" ? C_WARN : accent === "green" ? C_OK : "#404040"
  return (
    <div style={{ background: "#0d0d0d", borderRadius: "14px", padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "16px" }}>
        <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        <p style={{ color: "#2e2e2e", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>{label}</p>
      </div>
      <p className="animate-count-in" style={{ color: valueColor, fontSize: "30px", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
      {sub && <p style={{ color: "#2a2a2a", fontSize: "11px", marginTop: "6px", fontVariantNumeric: "tabular-nums" }}>{sub}</p>}
    </div>
  )
}

function UptimeBars({ history, count = 45 }: { history: CheckResult[]; count?: number }) {
  const bars = Array.from({ length: count }, (_, i) => {
    const entry = history[count - 1 - i]
    if (!entry) return "empty"
    return entry.status === "online" ? "up" : entry.status === "degraded" ? "degraded" : "down"
  })
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "40px" }}>
      {bars.map((status, i) => (
        <div key={i} title={status} style={{
          flex: 1, borderRadius: "3px",
          height: status === "up" ? "100%" : status === "down" ? "100%" : status === "degraded" ? "75%" : "33%",
          background: status === "up" ? C_OK : status === "down" ? C_CRIT : status === "degraded" ? C_WARN : "#1a1a1a",
          opacity: status === "up" ? 0.6 + (i / count) * 0.4 : 1,
        }} />
      ))}
    </div>
  )
}

function ResponseChart({ data }: { data: CheckResult[] }) {
  const values = data.map(d => d.responseMs ?? 0)
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const W = 600, H = 100
  const points = values.map((v, i) => [(i / (values.length - 1)) * W, H - (v / max) * H] as [number, number])
  const pathD = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")
  const areaD = `${pathD} L ${W} ${H} L 0 ${H} Z`
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24" preserveAspectRatio="none">
        <defs>
          <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.2" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#vGrad)" />
        <path d={pathD} fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
        <span>0ms</span><span>{max}ms peak</span>
      </div>
    </div>
  )
}

function ErrorBanner({ icon, title, message, solution, color }: { icon: React.ReactNode; title: string; message: string; solution?: string; color: "red" | "amber" }) {
  const borderColor = color === "red" ? "#3a0000" : "#3a2800"
  const bgColor = color === "red" ? "#120000" : "#120a00"
  const textColor = color === "red" ? "#ff6666" : "#f5a623"
  const dimColor = color === "red" ? "#7a2222" : "#7a5822"
  return (
    <div style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: "10px", padding: "14px 16px", display: "flex", gap: "12px" }}>
      <span style={{ color: textColor, flexShrink: 0, marginTop: "1px" }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: textColor, fontSize: "13px", fontWeight: 600, marginBottom: "3px" }}>{title}</p>
        <p style={{ color: dimColor, fontSize: "12px" }}>{message}</p>
        {solution && (
          <p style={{ color: "#444", fontSize: "11.5px", marginTop: "6px", paddingTop: "6px", borderTop: `1px solid ${borderColor}` }}>
            <span style={{ color: "#555", fontWeight: 600 }}>Fix: </span>{solution}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Action sub-components ──────────────────────────────────────────────────────

function RedeployButton({ account, project }: { account: NonNullable<ReturnType<typeof getVercelAccount>>; project: VercelSyncedProject }) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")
  async function handle() {
    if (!project.latestDeployment) return
    setLoading(true)
    try {
      const res = await fetch("/api/vercel/redeploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: account.token, teamId: account.teamId, deploymentUrl: project.latestDeployment.url }),
      })
      const data = await res.json()
      setMsg(data.id ? "Redeploy triggered! Live in ~1 min." : data.error ?? "Failed")
      setTimeout(() => setMsg(""), 6000)
    } finally { setLoading(false) }
  }
  return (
    <div className="space-y-2">
      {msg && <p className={cn("text-xs", msg.startsWith("Failed") || msg.includes("error") ? "text-red-500" : "text-white")}>{msg}</p>}
      <button onClick={handle} disabled={loading || !project.latestDeployment}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/10 text-white disabled:opacity-40 transition-colors">
        {loading ? <Loading03Icon size={12} className="animate-spin" /> : <RocketIcon size={12} />}
        {loading ? "Triggering..." : "Redeploy now"}
      </button>
    </div>
  )
}

function RollbackSelector({ account, project }: { account: NonNullable<ReturnType<typeof getVercelAccount>>; project: VercelSyncedProject }) {
  const [selected, setSelected] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")
  const past = (project.deployments ?? []).filter(d => d.state === "READY" && d.uid !== project.latestDeployment?.uid)

  async function handle() {
    if (!selected) return
    setLoading(true)
    try {
      const res = await fetch("/api/vercel/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: account.token, teamId: account.teamId, projectId: project.id, deploymentId: selected }),
      })
      const data = await res.json()
      setMsg(data.ok ? "Rolled back! That deployment is now live." : data.error ?? "Failed")
      setTimeout(() => setMsg(""), 6000)
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-3">
      {msg && <p className={cn("text-xs", msg.startsWith("Rolled") ? "text-white" : "text-red-500")}>{msg}</p>}
      <select value={selected} onChange={e => setSelected(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-white/30">
        <option value="">Select a previous deployment...</option>
        {past.map(d => (
          <option key={d.uid} value={d.uid}>
            {timeAgo(d.createdAt)} — {(d.meta as Record<string, string>)?.githubCommitMessage?.slice(0, 50) ?? d.url}
          </option>
        ))}
      </select>
      <button onClick={handle} disabled={!selected || loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-80 disabled:opacity-40 transition-opacity">
        {loading ? <Loading03Icon size={12} className="animate-spin" /> : <ArrowReloadHorizontalIcon size={12} />}
        Roll back to this version
      </button>
    </div>
  )
}

function AddEnvVarForm({ account, project }: { account: NonNullable<ReturnType<typeof getVercelAccount>>; project: VercelSyncedProject }) {
  const [key, setKey] = useState("")
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")
  const [error, setError] = useState("")

  async function handle() {
    if (!key || !value) return
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/vercel/env", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: account.token, teamId: account.teamId, projectId: project.id, key: key.trim(), value: value.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed"); return }
      setMsg(`${key} added! Redeploy to apply.`)
      setKey(""); setValue("")
      setTimeout(() => setMsg(""), 5000)
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-2.5">
      {msg && <p className="text-xs text-white">{msg}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input value={key} onChange={e => setKey(e.target.value.toUpperCase().replace(/\s/g, "_"))}
        placeholder="VARIABLE_NAME" className={cn(inputCls, "font-mono")} />
      <input value={value} onChange={e => setValue(e.target.value)}
        placeholder="value" type="password" className={inputCls} />
      <button onClick={handle} disabled={!key || !value || loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/10 text-white disabled:opacity-40 transition-colors">
        {loading ? <Loading03Icon size={12} className="animate-spin" /> : <AddSquareIcon size={12} />}
        Add variable
      </button>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

interface Incident {
  status: string
  startedAt: string
  resolvedAt?: string
  resolved: boolean
  duration?: number
  // Root cause details
  cause?: string          // human-readable reason
  httpStatus?: number     // e.g. 503
  errorType?: "http" | "dns" | "ssl" | "timeout" | "unknown"
}

function deriveIncidentCause(check: CheckResult): Pick<Incident, "cause" | "httpStatus" | "errorType"> {
  if (check.http && !check.http.ok) {
    if (check.http.statusCode) {
      const code = check.http.statusCode
      const label =
        code === 404 ? "Not Found" :
        code === 500 ? "Internal Server Error" :
        code === 502 ? "Bad Gateway" :
        code === 503 ? "Service Unavailable" :
        code === 504 ? "Gateway Timeout" :
        code === 429 ? "Too Many Requests" :
        `HTTP ${code}`
      return { cause: label, httpStatus: code, errorType: "http" }
    }
    if (check.http.error) return { cause: check.http.error, errorType: "timeout" }
  }
  if (check.dns && !check.dns.ok) {
    return { cause: check.dns.error || "DNS resolution failed", errorType: "dns" }
  }
  if (check.ssl && !check.ssl.ok) {
    return { cause: check.ssl.error || "SSL certificate error", errorType: "ssl" }
  }
  if (check.error) {
    const e = check.error.toLowerCase()
    if (e.includes("timeout") || e.includes("timed out")) return { cause: "Connection timed out", errorType: "timeout" }
    if (e.includes("econnrefused")) return { cause: "Connection refused", errorType: "unknown" }
    if (e.includes("enotfound") || e.includes("dns")) return { cause: "DNS lookup failed", errorType: "dns" }
    return { cause: check.error, errorType: "unknown" }
  }
  return { cause: "Service unreachable", errorType: "unknown" }
}

function deriveIncidents(history: CheckResult[]): Incident[] {
  const chron = history.slice().reverse()
  const incidents: Incident[] = []
  let current: Incident | null = null
  for (const check of chron) {
    if (check.status !== "online") {
      if (!current) {
        current = {
          status: check.status,
          startedAt: check.timestamp,
          resolved: false,
          ...deriveIncidentCause(check),
        }
      }
    } else {
      if (current) {
        current.resolved = true
        current.resolvedAt = check.timestamp
        current.duration = new Date(check.timestamp).getTime() - new Date(current.startedAt).getTime()
        incidents.push(current)
        current = null
      }
    }
  }
  if (current) incidents.push(current)
  return incidents.reverse()
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
}

function timeAgo(input: number | string): string {
  const diff = Date.now() - (typeof input === "number" ? input : new Date(input).getTime())
  if (diff < 60_000) return "just now"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

const inputCls = "w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/30"

// ── Admin data panel ──────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦", USD: "$", GBP: "£", EUR: "€", GHS: "₵", KES: "KSh", ZAR: "R",
}

function getCurrencySymbol(flat: Record<string, unknown>): string {
  const code = typeof flat.currency === "string" ? flat.currency.toUpperCase() : ""
  return CURRENCY_SYMBOLS[code] ?? code ?? "$"
}


const KNOWN_METRIC_KEYS: Record<string, { label: string; money?: boolean; suffix?: string; skip?: boolean }> = {
  // revenue
  totalRevenue:    { label: "Total revenue", money: true },
  domainRevenue:   { label: "Domain revenue", money: true },
  domainProfit:    { label: "Domain profit", money: true },
  renewalRevenue:  { label: "Renewal revenue", money: true },
  backupRevenue:   { label: "Backup revenue", money: true },
  aiPassRevenue:   { label: "AI pass revenue", money: true },
  mrr:             { label: "MRR", money: true },
  arr:             { label: "ARR", money: true },
  revenue:         { label: "Revenue", money: true },
  // users
  total:           { label: "Total users" },
  totalUsers:      { label: "Total users" },
  users:           { label: "Users" },
  new30d:          { label: "New (30d)" },
  new7d:           { label: "New (7d)" },
  signups:         { label: "Signups" },
  // sites/content
  published:       { label: "Published sites" },
  draft:           { label: "Draft sites" },
  active:          { label: "Active subscriptions" },
  // traffic
  allTime:         { label: "All-time views" },
  last30d:         { label: "Views (30d)" },
  traffic:         { label: "Traffic" },
  pageViews:       { label: "Page views" },
  sessions:        { label: "Sessions" },
  // other
  orders:          { label: "Orders" },
  totalOrders:     { label: "Total orders" },
  churn:           { label: "Churn", suffix: "%" },
  conversion:      { label: "Conversion", suffix: "%" },
  // skip these — shown elsewhere or not useful as tiles
  currency:        { label: "", skip: true },
  generatedAt:     { label: "", skip: true },
}

function AdminDataPanel({ projectId }: { projectId: string }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)

  const load = useCallback(async () => {
    const cfg = getProjectAdminConfig(projectId)
    if (!cfg.adminApiUrl) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiUrl: cfg.adminApiUrl, apiToken: cfg.adminApiToken }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || `HTTP ${json.status}`)
      setData(json.data as Record<string, unknown>)
      setFetchedAt(Date.now())
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { load() }, [load])

  // Flatten one level so nested objects like { stats: { revenue: 100 } } still show values
  const flat: Record<string, unknown> = {}
  if (data) {
    for (const [k, v] of Object.entries(data)) {
      if (v !== null && typeof v === "object" && !Array.isArray(v)) {
        for (const [nk, nv] of Object.entries(v as Record<string, unknown>)) {
          flat[nk] = nv
        }
      } else {
        flat[k] = v
      }
    }
  }
  const currencySymbol = getCurrencySymbol(flat)
  const knownEntries = Object.entries(flat).filter(([k]) => k in KNOWN_METRIC_KEYS && !KNOWN_METRIC_KEYS[k].skip)
  const otherEntries = Object.entries(flat).filter(([k]) => !(k in KNOWN_METRIC_KEYS) && flat[k] !== null && typeof flat[k] !== "object" && !Array.isArray(flat[k]))

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Admin analytics</p>
          {fetchedAt && <p className="text-[10px] text-zinc-400 mt-0.5">Updated {timeAgo(fetchedAt)}</p>}
        </div>
        <button onClick={load} disabled={loading}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
          <ArrowReloadHorizontalIcon size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center py-6">
          <Loading03Icon size={20} className="animate-spin text-white" />
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {knownEntries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {knownEntries.map(([k, v]) => {
            const meta = KNOWN_METRIC_KEYS[k]
            const sym = meta.money ? currencySymbol : ""
            const display = typeof v === "number"
              ? `${sym}${v.toLocaleString()}${meta.suffix ?? ""}`
              : String(v)
            return (
              <div key={k} className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 px-4 py-3">
                <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide mb-1">{meta.label}</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{display}</p>
              </div>
            )
          })}
        </div>
      )}

      {otherEntries.length > 0 && (
        <div className="rounded-xl border border-zinc-100 dark:border-zinc-700 overflow-hidden">
          <table className="w-full text-xs">
            <tbody>
              {otherEntries.map(([k, v], i) => (
                <tr key={k} className={i % 2 === 0 ? "bg-zinc-50 dark:bg-zinc-800/50" : ""}>
                  <td className="px-3 py-2 font-medium text-zinc-500">{k}</td>
                  <td className="px-3 py-2 text-zinc-900 dark:text-white font-mono">{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && data && knownEntries.length === 0 && otherEntries.length === 0 && (
        <details className="text-xs">
          <summary className="text-zinc-400 cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300 select-none">
            No recognised keys — click to see raw response
          </summary>
          <pre className="mt-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 overflow-x-auto text-[10px] leading-relaxed">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}
