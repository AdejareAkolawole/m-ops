"use client"
import { useState, useEffect, useCallback } from "react"
import { ManualProject, CheckResult, HubHealthResponse } from "@/lib/types"
import { pushCheck, getChecks } from "@/lib/store"
import {
  ArrowLeft01Icon, ArrowReloadHorizontalIcon, LinkSquare02Icon,
  Loading03Icon, CheckmarkCircle02Icon, AlertCircleIcon,
  DatabaseIcon, Activity01Icon, ChartLineData01Icon,
  GlobalIcon, Settings01Icon,
  SecurityCheckIcon, Time01Icon, LaptopIcon, Delete02Icon, RocketIcon,
} from "hugeicons-react"
import { cn } from "@/lib/utils"
import { CmsPanel } from "@/components/CmsPanel"
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard"
import { saveProjectAdminConfig } from "@/lib/store"

type Tab = "overview" | "performance" | "incidents" | "settings" | "cms" | "sla"

const TIME_WINDOWS = [
  { label: "1h",  ms: 60 * 60 * 1000 },
  { label: "6h",  ms: 6 * 60 * 60 * 1000 },
  { label: "24h", ms: 24 * 60 * 60 * 1000 },
  { label: "7d",  ms: 7 * 24 * 60 * 60 * 1000 },
]

interface Props {
  project: ManualProject
  onBack: () => void
  onDeleted: () => void
  onUpdated: (p: ManualProject) => void
}

export function ManualProjectDetail({ project, onBack, onDeleted, onUpdated, activeTab, onTabChange }: Props & { activeTab?: string; onTabChange?: (t: string) => void }) {
  const [internalTab, setInternalTab] = useState<Tab>("overview")
  const tab = (activeTab as Tab | undefined) ?? internalTab
  const setTab = (t: Tab) => { onTabChange?.(t); setInternalTab(t) }
  const [checking, setChecking] = useState(false)
  const [check, setCheck] = useState<CheckResult | null>(null)
  const [history, setHistory] = useState<CheckResult[]>([])
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    const saved = getChecks(project.id)
    if (saved.length > 0) { setHistory(saved); setCheck(saved[0]) }
  }, [project.id])

  const runCheck = useCallback(async () => {
    setChecking(true)
    setCountdown(60)
    try {
      const res = await fetch("/api/monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: project.url,
          hubSecret: project.hubSecret,
          healthEndpoint: project.healthEndpoint,
        }),
      })
      if (res.ok) {
        const result: CheckResult = await res.json()
        pushCheck(project.id, result)
        setCheck(result)
        setHistory(getChecks(project.id))
      }
    } finally { setChecking(false) }
  }, [project])

  useEffect(() => { runCheck() }, [runCheck])

  useEffect(() => {
    const refresh = setInterval(runCheck, 60_000)
    const tick = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    return () => { clearInterval(refresh); clearInterval(tick) }
  }, [runCheck])

  return (
    <div className="flex flex-col h-full min-h-0 bg-zinc-50 dark:bg-zinc-950">
      {/* ── Top bar ── */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold text-zinc-900 dark:text-white truncate">{project.name}</h1>
              <StatusPill status={check?.status} checking={checking} />
            </div>
            <a href={project.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 mt-0.5 transition-colors">
              <LinkSquare02Icon size={10} />
              {project.url.replace(/^https?:\/\//, "")}
            </a>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
              refreshes in {countdown}s
            </span>
            <button onClick={runCheck} disabled={checking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-80 disabled:opacity-40 transition-all">
              <ArrowReloadHorizontalIcon size={11} className={cn(checking && "animate-spin")} />
              Check now
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "overview"    && <OverviewTab check={check} history={history} checking={checking} url={project.url} project={project} />}
        {tab === "performance" && <PerformanceTab history={history} />}
        {tab === "incidents"   && <IncidentsTab history={history} />}
        {tab === "settings"    && <SettingsTab project={project} onUpdated={onUpdated} onDeleted={onDeleted} />}
        {tab === "sla"         && <SlaTab history={history} projectName={project.name} />}
        {tab === "cms" && (
          <div className="p-6 max-w-3xl">
            <CmsPanel
              projectUrl={project.url}
              hubSecret={project.hubSecret}
              projectName={project.name}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status, checking }: { status?: string; checking: boolean }) {
  if (checking) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
      <Loading03Icon size={10} className="animate-spin" /> Checking
    </span>
  )
  if (status === "online") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 dark:bg-white/10/30 text-white dark:text-white">
      <span className="w-1.5 h-1.5 rounded-full bg-white/10" /> Online
    </span>
  )
  if (status === "offline") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Offline
    </span>
  )
  if (status === "degraded") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Degraded
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" /> Pending
    </span>
  )
}

function OverviewTab({ check, history, checking, url, project }: { check: CheckResult | null; history: CheckResult[]; checking: boolean; url: string; project: ManualProject }) {
  const uptimePct = history.length > 0
    ? Math.round(history.filter(h => h.status === "online").length / history.length * 100) : null

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricTile label="Response time"
          value={check?.responseMs != null ? `${check.responseMs}ms` : "—"}
          icon={<Time01Icon size={14} />}
          accent={check?.responseMs == null ? "neutral" : check.responseMs > 2000 ? "red" : check.responseMs > 800 ? "amber" : "green"} />
        <MetricTile label="DNS"
          value={check?.dns?.ok === true ? "Resolving" : check?.dns?.ok === false ? "Failed" : "—"}
          sub={check?.dns?.resolvedIp}
          icon={<GlobalIcon size={14} />}
          accent={check?.dns?.ok === true ? "green" : check?.dns?.ok === false ? "red" : "neutral"} />
        <MetricTile label="SSL"
          value={check?.ssl?.ok === true ? "Valid" : check?.ssl?.ok === false ? "No SSL" : "—"}
          sub={check?.ssl?.daysLeft != null ? `${check.ssl.daysLeft} days left` : undefined}
          icon={<SecurityCheckIcon size={14} />}
          accent={check?.ssl?.ok === true ? "green" : check?.ssl?.ok === false ? "amber" : "neutral"} />
        <MetricTile label="Uptime"
          value={uptimePct != null ? `${uptimePct}%` : "—"}
          sub={`${history.length} checks`}
          icon={<Activity01Icon size={14} />}
          accent={uptimePct == null ? "neutral" : uptimePct >= 99 ? "green" : uptimePct >= 95 ? "amber" : "red"} />
      </div>

      {history.length > 1 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Uptime track</p>
              <p className="text-xs text-zinc-400 mt-0.5">Last {Math.min(history.length, 45)} checks</p>
            </div>
            {uptimePct != null && (
              <span className={cn("text-2xl font-bold",
                uptimePct === 100 ? "text-white" : uptimePct >= 95 ? "text-amber-500" : "text-red-500"
              )}>{uptimePct}%</span>
            )}
          </div>
          <UptimeBars history={history} />
          <div className="flex justify-between mt-2">
            <p className="text-[10px] text-zinc-400">Oldest</p>
            <p className="text-[10px] text-zinc-400">Now</p>
          </div>
        </div>
      )}

      {check?.http?.error && <ErrorBanner icon={<AlertCircleIcon size={14} />} title="Connection error" message={check.http.error} color="red" />}
      {check?.dns?.error  && <ErrorBanner icon={<GlobalIcon size={14} />} title="DNS issue" message={check.dns.error} color="amber" />}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <QuickLink href={url} icon={<LinkSquare02Icon size={14} />} label="Open site" sub="Production" />
        <QuickLink href={project.adminUrl || `${url}/admin`} icon={<Settings01Icon size={14} />} label="Admin panel" sub={project.adminUrl ? "Custom admin" : "Your app's CMS"} />
        <QuickLink href={`${url}/api/hub-health`} icon={<RocketIcon size={14} />} label="Health endpoint" sub="Raw response" />
      </div>

      {project.adminApiUrl && (() => {
        saveProjectAdminConfig(project.id, { adminUrl: project.adminUrl, adminApiUrl: project.adminApiUrl, adminApiToken: project.adminApiToken })
        return <AnalyticsDashboard projectId={project.id} />
      })()}

      {check?.health ? (
        <AppHealthSection health={check.health} />
      ) : check && (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center">
          <LaptopIcon size={24} className="text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">No app health data</p>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Add <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px]">/api/hub-health</code> to your project and configure the health endpoint in Settings.
          </p>
        </div>
      )}
    </div>
  )
}

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
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Performance</h2>
          <p className="text-xs text-zinc-400 mt-0.5">{filtered.length} checks in window</p>
        </div>
        <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
          {TIME_WINDOWS.map(w => (
            <button key={w.label} onClick={() => setWindow(w.label)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                window === w.label ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}>
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
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Response time</p>
              <p className="text-xs text-zinc-400 mt-0.5">milliseconds over time</p>
            </div>
            {avg != null && <span className={cn("text-lg font-bold", avg > 2000 ? "text-red-500" : avg > 800 ? "text-amber-500" : "text-white")}>{avg}ms avg</span>}
          </div>
          <ResponseChart data={chrono} />
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-10 text-center">
          <p className="text-sm text-zinc-400">Not enough data yet in this window.</p>
        </div>
      )}
      {filtered.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Uptime track</p>
          <UptimeBars history={filtered} count={Math.min(filtered.length, 60)} />
          <div className="flex justify-between mt-2">
            <p className="text-[10px] text-zinc-400">Oldest</p>
            <p className="text-[10px] text-zinc-400">Now</p>
          </div>
        </div>
      )}
    </div>
  )
}

function IncidentsTab({ history }: { history: CheckResult[] }) {
  const incidents = deriveIncidents(history)
  const active = incidents.filter(i => !i.resolved)
  const resolved = incidents.filter(i => i.resolved)
  return (
    <div className="p-6 space-y-5 max-w-3xl">
      {active.length > 0 && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-4">
          <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-3">⚠ Active incident</p>
          {active.map((inc, i) => <IncidentRow key={i} inc={inc} />)}
        </div>
      )}
      {incidents.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center">
          <CheckmarkCircle02Icon size={32} className="text-white mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">All good</p>
          <p className="text-xs text-zinc-400 mt-1">No incidents detected in your check history.</p>
        </div>
      ) : resolved.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Past incidents</p>
          <div className="space-y-2">{resolved.map((inc, i) => <IncidentRow key={i} inc={inc} />)}</div>
        </div>
      )}
    </div>
  )
}

function IncidentRow({ inc }: { inc: Incident }) {
  return (
    <div className={cn("bg-white dark:bg-zinc-900 rounded-xl border p-4 flex items-start justify-between gap-4",
      inc.resolved ? "border-zinc-200 dark:border-zinc-800" : "border-red-200 dark:border-red-900/40"
    )}>
      <div className="flex items-start gap-3">
        <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", inc.resolved ? "bg-zinc-400" : "bg-red-500 animate-pulse")} />
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white capitalize">
            {inc.status} {!inc.resolved && <span className="text-red-500 text-xs ml-1">Ongoing</span>}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">{new Date(inc.startedAt).toLocaleString()}</p>
          {inc.resolved && inc.resolvedAt && <p className="text-xs text-zinc-400">Resolved {timeAgo(inc.resolvedAt)}</p>}
        </div>
      </div>
      {inc.duration != null && (
        <span className="text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2.5 py-1 rounded-full shrink-0">
          {formatDuration(inc.duration)}
        </span>
      )}
    </div>
  )
}

function SettingsTab({ project, onUpdated, onDeleted }: { project: ManualProject; onUpdated: (p: ManualProject) => void; onDeleted: () => void }) {
  const [name, setName] = useState(project.name)
  const [url, setUrl] = useState(project.url)
  const [desc, setDesc] = useState(project.description ?? "")
  const [secret, setSecret] = useState(project.hubSecret)
  const [endpoint, setEndpoint] = useState(project.healthEndpoint)
  const [adminUrl, setAdminUrl] = useState(project.adminUrl ?? "")
  const [adminApiUrl, setAdminApiUrl] = useState(project.adminApiUrl ?? "")
  const [adminApiToken, setAdminApiToken] = useState(project.adminApiToken ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleSave() {
    setSaving(true)
    const updated: ManualProject = {
      ...project,
      name: name.trim(), url: url.trim(),
      description: desc.trim() || undefined,
      hubSecret: secret.trim(), healthEndpoint: endpoint.trim(),
      adminUrl: adminUrl.trim() || undefined,
      adminApiUrl: adminApiUrl.trim() || undefined,
      adminApiToken: adminApiToken.trim() || undefined,
    }
    onUpdated(updated)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 space-y-6 max-w-lg">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Project details</p>
        <FieldRow label="Name"><input value={name} onChange={e => setName(e.target.value)} className={inputCls} /></FieldRow>
        <FieldRow label="URL"><input value={url} onChange={e => setUrl(e.target.value)} className={inputCls} /></FieldRow>
        <FieldRow label="Description"><input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional" className={inputCls} /></FieldRow>
        <FieldRow label="Hub secret"><input value={secret} onChange={e => setSecret(e.target.value)} className={cn(inputCls, "font-mono text-xs")} /></FieldRow>
        <FieldRow label="Health endpoint"><input value={endpoint} onChange={e => setEndpoint(e.target.value)} className={cn(inputCls, "font-mono text-xs")} /></FieldRow>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Admin panel</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Link to your existing admin panel and optionally connect its API for analytics.</p>
        </div>
        <FieldRow label="Admin URL">
          <input value={adminUrl} onChange={e => setAdminUrl(e.target.value)} placeholder={`${url}/admin`} className={inputCls} />
        </FieldRow>
        <FieldRow label="Admin API endpoint">
          <input value={adminApiUrl} onChange={e => setAdminApiUrl(e.target.value)} placeholder={`${url}/api/analytics`} className={cn(inputCls, "font-mono text-xs")} />
        </FieldRow>
        <FieldRow label="API token">
          <input type="password" value={adminApiToken} onChange={e => setAdminApiToken(e.target.value)} placeholder="Bearer token (optional)" className={cn(inputCls, "font-mono text-xs")} />
        </FieldRow>
        <p className="text-[10px] text-zinc-400">The API endpoint should return JSON with fields like <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">revenue</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">users</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">orders</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">traffic</code> — anything you want to show on the dashboard.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/10 text-white disabled:opacity-40 transition-colors">
          {saving && <Loading03Icon size={12} className="animate-spin" />}
          {saved ? "Saved!" : "Save changes"}
        </button>
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-red-200 dark:border-red-900/40 p-5">
        <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">Danger zone</p>
        <p className="text-xs text-zinc-400 mb-4">Permanently remove this project and all its check history.</p>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
            <Delete02Icon size={12} /> Delete project
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => onDeleted() }
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors">
              <Delete02Icon size={12} /> Yes, delete
            </button>
            <button onClick={() => setConfirmDelete(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AppHealthSection({ health }: { health: HubHealthResponse }) {
  return (
    <div className="space-y-4">
      {health.db && (
        <div className={cn("rounded-2xl border p-4 flex items-center justify-between",
          health.db.ok ? "bg-white/10 dark:bg-white/10/20 border-white/20 dark:border-white/20/40"
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
          <span className={cn("text-xs font-bold px-3 py-1 rounded-full text-white", health.db.ok ? "bg-white/10" : "bg-red-500")}>
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
            <p className="text-lg font-semibold text-white mt-0.5">{health.payments.currency} {health.payments.todayAmount?.toLocaleString()}</p>
          )}
        </div>
      )}
      {health.recentSignups && health.recentSignups.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Recent signups</p>
          <div className="space-y-0.5">
            {health.recentSignups.slice(0, 5).map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{u.name ?? u.email}</p>
                  {u.name && <p className="text-xs text-zinc-400">{u.email}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {u.plan && <span className="text-[10px] bg-white/10 dark:bg-white/10/30 text-white px-2 py-0.5 rounded-full font-medium">{u.plan}</span>}
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
  const accentCls: Record<Accent, string> = {
    green: "text-white", red: "text-red-500", amber: "text-amber-500", neutral: "text-zinc-900 dark:text-white",
  }
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center gap-1.5 text-zinc-400 mb-2">
        {icon}
        <p className="text-[10px] uppercase tracking-wider font-semibold">{label}</p>
      </div>
      <p className={cn("text-2xl font-bold truncate", accentCls[accent])}>{value}</p>
      {sub && <p className="text-[10px] text-zinc-400 mt-0.5 font-mono truncate">{sub}</p>}
    </div>
  )
}

function QuickLink({ href, icon, label, sub }: { href: string; icon: React.ReactNode; label: string; sub: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2.5 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-white/10 dark:hover:border-white/10 transition-colors group">
      <span className="text-zinc-400 group-hover:text-white transition-colors">{icon}</span>
      <div>
        <p className="text-xs font-semibold text-zinc-900 dark:text-white">{label}</p>
        <p className="text-[10px] text-zinc-400">{sub}</p>
      </div>
    </a>
  )
}

function UptimeBars({ history, count = 45 }: { history: CheckResult[]; count?: number }) {
  const bars = Array.from({ length: count }, (_, i) => {
    const entry = history[count - 1 - i]
    if (!entry) return "empty"
    return entry.status === "online" ? "up" : entry.status === "degraded" ? "degraded" : "down"
  })
  return (
    <div className="flex items-end gap-0.5 h-10">
      {bars.map((status, i) => (
        <div key={i} title={status}
          className={cn("flex-1 rounded-sm",
            status === "up" ? "h-full bg-white/10" :
            status === "down" ? "h-full bg-red-500" :
            status === "degraded" ? "h-3/4 bg-amber-400" :
            "h-1/3 bg-zinc-200 dark:bg-zinc-700"
          )} />
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
          <linearGradient id="mGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#mGrad)" />
        <path d={pathD} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
        <span>0ms</span><span>{max}ms peak</span>
      </div>
    </div>
  )
}

function ErrorBanner({ icon, title, message, color }: { icon: React.ReactNode; title: string; message: string; color: "red" | "amber" }) {
  const cls = color === "red"
    ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400"
    : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-600 dark:text-amber-400"
  return (
    <div className={cn("rounded-xl border px-4 py-3 flex gap-3", cls)}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs font-semibold">{title}</p>
        <p className="text-xs mt-0.5 opacity-80">{message}</p>
      </div>
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5 block">{label}</label>
      {children}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

interface Incident { status: string; startedAt: string; resolvedAt?: string; resolved: boolean; duration?: number }

function deriveIncidents(history: CheckResult[]): Incident[] {
  const chron = history.slice().reverse()
  const incidents: Incident[] = []
  let current: Incident | null = null
  for (const check of chron) {
    if (check.status !== "online") {
      if (!current) current = { status: check.status, startedAt: check.timestamp, resolved: false }
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

function timeAgo(input: string): string {
  const diff = Date.now() - new Date(input).getTime()
  if (diff < 60_000) return "just now"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

const inputCls = "w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/30"

// ── Admin data panel ──────────────────────────────────────────────────────────

function AdminDataPanel({ apiUrl, apiToken }: { apiUrl: string; apiToken?: string }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/admin-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiUrl, apiToken }),
      })
      const json = await res.json()
      if (json.ok && json.data) {
        setData(json.data as Record<string, unknown>)
        setLastFetched(new Date().toISOString())
      } else {
        setError(json.data?.error || json.error || `Status ${json.status}`)
      }
    } catch (e) { setError(String(e)) }
    finally { setLoading(false) }
  }, [apiUrl, apiToken])

  useEffect(() => { fetch_() }, [fetch_])

  if (error) return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3">
      <AlertCircleIcon size={14} className="text-amber-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Admin API unreachable</p>
        <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-0.5">{error}</p>
        <button onClick={fetch_} className="text-[11px] underline text-amber-600 dark:text-amber-400 mt-1">Retry</button>
      </div>
    </div>
  )

  if (loading && !data) return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex items-center gap-2 text-zinc-400 text-xs">
      <Loading03Icon size={14} className="animate-spin" /> Fetching admin data...
    </div>
  )

  if (!data) return null

  // Known top-level keys we display as metric tiles
  const knownMetrics: { key: string; label: string; prefix?: string; suffix?: string }[] = [
    { key: "revenue", label: "Revenue", prefix: "$" },
    { key: "totalRevenue", label: "Revenue", prefix: "$" },
    { key: "users", label: "Users" },
    { key: "totalUsers", label: "Total Users" },
    { key: "orders", label: "Orders" },
    { key: "totalOrders", label: "Orders" },
    { key: "traffic", label: "Traffic" },
    { key: "pageViews", label: "Page Views" },
    { key: "sessions", label: "Sessions" },
    { key: "signups", label: "Signups" },
    { key: "mrr", label: "MRR", prefix: "$" },
    { key: "arr", label: "ARR", prefix: "$" },
    { key: "churn", label: "Churn", suffix: "%" },
    { key: "conversion", label: "Conversion", suffix: "%" },
  ]

  const tiles = knownMetrics
    .filter(m => data[m.key] != null && typeof data[m.key] !== "object")
    .map(m => ({ ...m, value: data[m.key] as string | number }))

  // Remaining keys shown as raw JSON rows
  const shownKeys = new Set(tiles.map(t => t.key))
  const remaining = Object.entries(data).filter(([k]) => !shownKeys.has(k))

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Admin Analytics</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">{lastFetched ? `Updated ${timeAgo(lastFetched)}` : "Live from your admin API"}</p>
        </div>
        <button onClick={fetch_} disabled={loading}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 disabled:opacity-40">
          <ArrowReloadHorizontalIcon size={13} className={cn(loading && "animate-spin")} />
        </button>
      </div>

      {tiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {tiles.map(t => (
            <div key={t.key} className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">{t.label}</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white">
                {t.prefix}{typeof t.value === "number" ? t.value.toLocaleString() : t.value}{t.suffix}
              </p>
            </div>
          ))}
        </div>
      )}

      {remaining.length > 0 && (
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
          {remaining.map(([k, v]) => (
            <div key={k} className="flex items-start justify-between px-3 py-2 gap-4">
              <span className="text-xs font-mono text-zinc-500">{k}</span>
              <span className="text-xs text-zinc-700 dark:text-zinc-300 text-right break-all max-w-[60%]">
                {typeof v === "object" ? JSON.stringify(v) : String(v)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SlaTab({ history, projectName }: { history: CheckResult[]; projectName: string }) {
  const windows = [
    { label: "Last 24h",  ms: 24 * 3600_000 },
    { label: "Last 7d",   ms: 7 * 86400_000 },
    { label: "Last 30d",  ms: 30 * 86400_000 },
    { label: "Last 90d",  ms: 90 * 86400_000 },
  ]

  function calcSla(ms: number) {
    const cutoff = Date.now() - ms
    const slice = history.filter(h => new Date(h.timestamp).getTime() > cutoff)
    if (slice.length === 0) return null
    const up = slice.filter(h => h.status === "online").length
    return { pct: (up / slice.length) * 100, checks: slice.length, up, down: slice.length - up }
  }

  const incidents = history.reduce<{ start: string; end?: string; durationMs?: number }[]>((acc, h, i) => {
    if (h.status !== "online") {
      if (i === 0 || history[i - 1]?.status === "online") acc.push({ start: h.timestamp })
      else if (acc.length > 0 && !acc[acc.length - 1].end) {
        // still in incident — do nothing
      }
    } else if (acc.length > 0 && !acc[acc.length - 1].end) {
      const last = acc[acc.length - 1]
      last.end = h.timestamp
      last.durationMs = new Date(h.timestamp).getTime() - new Date(last.start).getTime()
    }
    return acc
  }, []).slice(0, 10)

  function fmt(ms: number) {
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`
    return `${(ms / 3600000).toFixed(1)}h`
  }

  function pctColor(pct: number) {
    if (pct >= 99.9) return "#4ade80"
    if (pct >= 99) return "#86efac"
    if (pct >= 95) return "#fbbf24"
    return "#f87171"
  }

  if (history.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-zinc-500 text-sm">No check history yet — run a check to start collecting SLA data.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div>
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Uptime SLA</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {windows.map(w => {
            const r = calcSla(w.ms)
            return (
              <div key={w.label} className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-4 text-center">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">{w.label}</p>
                {r ? (
                  <>
                    <p className="text-2xl font-bold" style={{ color: pctColor(r.pct) }}>{r.pct.toFixed(2)}%</p>
                    <p className="text-[10px] text-zinc-500 mt-1">{r.up} up / {r.down} down</p>
                  </>
                ) : (
                  <p className="text-xl font-bold text-zinc-400">—</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Recent incidents</h2>
        {incidents.length === 0 ? (
          <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-4 text-center">
            <p className="text-sm text-zinc-500">No incidents recorded — 100% uptime 🎉</p>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
            {incidents.map((inc, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{new Date(inc.start).toLocaleString()}</p>
                  {inc.end && <p className="text-[11px] text-zinc-400">Recovered: {new Date(inc.end).toLocaleString()}</p>}
                </div>
                <span className="text-xs font-mono text-red-500 shrink-0">
                  {inc.durationMs ? fmt(inc.durationMs) : "ongoing"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-[11px] text-zinc-400">
        Based on {history.length} checks for <strong>{projectName}</strong>. Data stored locally — up to {Math.round(history.length)} records.
      </div>
    </div>
  )
}
