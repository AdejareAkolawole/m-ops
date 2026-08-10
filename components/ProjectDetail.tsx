"use client"
import { useState, useEffect, useRef } from "react"
import { ProjectConfig, CheckResult, HubHealthResponse } from "@/lib/types"
import { StatusDot } from "./StatusDot"
import { Badge } from "./ui/badge"
import {
  ArrowLeft, RefreshCw, ExternalLink, Globe, ShieldCheck, Wifi,
  Database, AlertTriangle, CheckCircle, XCircle, Clock, Activity,
  Settings, Terminal, Users, DollarSign, Eye, Server, Rocket, Copy, Check
} from "lucide-react"
import { pushCheck, getChecks, saveProject } from "@/lib/store"
import { cn } from "@/lib/utils"

type Tab = "overview" | "services" | "logs" | "settings"

export function ProjectDetail({ project: init, onBack }: { project: ProjectConfig; onBack: () => void }) {
  const [project, setProject] = useState(init)
  const [checks, setChecks] = useState<CheckResult[]>(() => getChecks(init.id))
  const [tab, setTab] = useState<Tab>("overview")
  const [checking, setChecking] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const latest = checks[0]
  const health = latest?.health

  async function runCheck() {
    setChecking(true)
    try {
      const res = await fetch("/api/monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: project.url, hubSecret: project.hubSecret, healthEndpoint: project.healthEndpoint }),
      })
      const check: CheckResult = await res.json()
      pushCheck(project.id, check)
      setChecks((prev) => [check, ...prev].slice(0, 100))
    } finally { setChecking(false) }
  }

  useEffect(() => { if (checks.length === 0) runCheck() }, [])

  useEffect(() => {
    if (autoRefresh) intervalRef.current = setInterval(runCheck, 30000)
    else if (intervalRef.current) clearInterval(intervalRef.current)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh])

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Activity size={13} /> },
    { id: "services", label: "Services", icon: <Server size={13} /> },
    { id: "logs", label: "Logs", icon: <Terminal size={13} /> },
    { id: "settings", label: "Settings", icon: <Settings size={13} /> },
  ]

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
            <ArrowLeft size={16} />
          </button>
          <StatusDot status={latest?.status ?? "unknown"} />
          <div>
            <h1 className="font-semibold text-zinc-900 dark:text-white text-sm">{project.name}</h1>
            <a href={project.url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1">
              <ExternalLink size={10} />{project.url.replace(/^https?:\/\//, "")}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer select-none">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="rounded" />
            Auto-refresh
          </label>
          <button onClick={runCheck} disabled={checking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-80 disabled:opacity-50">
            <RefreshCw size={12} className={cn(checking && "animate-spin")} />
            Check Now
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors",
              tab === t.id
                ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === "overview" && <OverviewTab latest={latest} health={health} project={project} />}
        {tab === "services" && <ServicesTab health={health} />}
        {tab === "logs" && <LogsTab checks={checks} />}
        {tab === "settings" && <SettingsTab project={project} onUpdate={(p) => { setProject(p); saveProject(p) }} />}
      </div>
    </div>
  )
}

function OverviewTab({ latest, health, project }: { latest?: CheckResult; health?: HubHealthResponse; project: ProjectConfig }) {
  const noHealth = !health

  return (
    <div className="space-y-6">
      {/* Infra checks */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Infrastructure</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Status", value: latest?.status ?? "unknown", capitalize: true },
            { label: "Response", value: latest?.responseMs ? `${latest.responseMs}ms` : "—" },
            { label: "Last checked", value: latest ? new Date(latest.timestamp).toLocaleTimeString() : "Never" },
            { label: "DNS", value: latest?.dns?.ok ? latest.dns.resolvedIp ?? "Resolved" : latest?.dns?.error ?? "—", ok: latest?.dns?.ok },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
              <p className="text-[11px] text-zinc-500 mb-1">{s.label}</p>
              <p className={cn("text-sm font-semibold truncate", s.capitalize && "capitalize",
                s.ok === false ? "text-red-500" : "text-zinc-900 dark:text-white")}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {noHealth && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 p-4 flex gap-3">
          <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-400 mb-1">Health endpoint not connected</p>
            <p className="text-xs text-amber-700 dark:text-amber-500">
              Add the health endpoint to your project to see DB status, live stats, traffic, payments and more. Check the Settings tab for setup instructions.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      {health?.stats && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Stats</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(health.stats).map(([key, val]) => val !== undefined && (
              <StatCard key={key} label={humanise(key)} value={fmt(val as number)} icon={iconFor(key)} />
            ))}
          </div>
        </div>
      )}

      {/* Traffic */}
      {health?.traffic && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Traffic</h3>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Today" value={fmt(health.traffic.today ?? 0)} icon={<Eye size={14} />} />
            <StatCard label="Yesterday" value={fmt(health.traffic.yesterday ?? 0)} icon={<Eye size={14} />} />
            {health.growth?.usersWeek !== undefined && (
              <StatCard label="New users (7d)" value={fmt(health.growth.usersWeek)} icon={<Users size={14} />} />
            )}
          </div>
        </div>
      )}

      {/* Payments */}
      {health?.payments && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Revenue</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Payments today" value={String(health.payments.todayCount ?? 0)} icon={<DollarSign size={14} />} />
            <StatCard label="Revenue today" value={`${health.payments.currency ?? "₦"}${fmt(health.payments.todayAmount ?? 0)}`} icon={<DollarSign size={14} />} />
          </div>
        </div>
      )}

      {/* Deploy */}
      {health?.deploy && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Last Deployment</h3>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-start gap-3">
            <Rocket size={15} className={cn("mt-0.5", health.deploy.state === "READY" ? "text-emerald-500" : "text-amber-500")} />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Badge variant={health.deploy.state === "READY" ? "success" : "warning"}>{health.deploy.state}</Badge>
                {health.deploy.createdAt && (
                  <span className="text-xs text-zinc-400">{new Date(health.deploy.createdAt).toLocaleString()}</span>
                )}
              </div>
              {health.deploy.message && <p className="text-xs text-zinc-600 dark:text-zinc-400">{health.deploy.message}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Recent signups */}
      {health?.recentSignups && health.recentSignups.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Recent Signups</h3>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
            {health.recentSignups.slice(0, 6).map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">{u.name ?? u.email}</p>
                  {u.name && <p className="text-zinc-400">{u.email}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {u.plan && <Badge variant="outline">{u.plan}</Badge>}
                  <span className="text-zinc-400">{timeAgo(u.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent payments */}
      {health?.recentPayments && health.recentPayments.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Recent Payments</h3>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
            {health.recentPayments.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                <p className="text-zinc-700 dark:text-zinc-300 truncate max-w-[60%]">{p.description ?? p.id}</p>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900 dark:text-white">{p.currency ?? "₦"}{fmt(p.amount)}</span>
                  <Badge variant={p.status === "SUCCEEDED" ? "success" : "warning"}>{p.status ?? "—"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ServicesTab({ health }: { health?: HubHealthResponse }) {
  const infraChecks = [
    { label: "DNS", ok: health?.raw ? true : undefined, detail: "Resolved" },
    { label: "SSL", ok: health?.raw ? true : undefined, detail: "Certificate valid" },
    { label: "Database", ok: health?.db?.ok, detail: health?.db?.ok ? `${health.db?.latencyMs ?? 0}ms` : health?.db?.error },
  ]

  const services = health?.services ? Object.entries(health.services) : []

  if (!health) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Server size={32} className="text-zinc-300 dark:text-zinc-700 mb-3" />
        <p className="text-sm text-zinc-500">No service data yet.</p>
        <p className="text-xs text-zinc-400 mt-1">Run a check with your health endpoint connected to see service health.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Core Infrastructure</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {infraChecks.map((c) => (
            <ServiceCard key={c.label} name={c.label} up={c.ok} detail={c.detail} />
          ))}
        </div>
      </div>

      {services.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">External Services</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map(([key, svc]) => (
              <ServiceCard
                key={key}
                name={svc.name ?? key}
                up={svc.up}
                latency={svc.latencyMs}
                configured={svc.configured}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ServiceCard({ name, up, detail, latency, configured }: { name: string; up?: boolean; detail?: string; latency?: number; configured?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-start gap-3">
      <div className={cn("p-2 rounded-lg mt-0.5",
        up === true ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
          : up === false ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500")}>
        <Server size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">{name}</span>
          {up === true && <CheckCircle size={12} className="text-emerald-500 shrink-0" />}
          {up === false && <XCircle size={12} className="text-red-500 shrink-0" />}
        </div>
        <p className="text-xs text-zinc-500 truncate">
          {detail ?? (latency !== undefined ? `${latency}ms` : configured === false ? "Not configured" : up ? "Online" : "Offline")}
        </p>
      </div>
    </div>
  )
}

function LogsTab({ checks }: { checks: CheckResult[] }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2 text-[11px] font-semibold text-zinc-500 border-b border-zinc-200 dark:border-zinc-700 grid grid-cols-5">
          <span>Time</span><span>Status</span><span>Response</span><span>DNS</span><span>HTTP / DB</span>
        </div>
        {checks.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-zinc-400">No checks yet — click Check Now.</div>
        )}
        {checks.map((c, i) => (
          <div key={i} className="px-4 py-2.5 grid grid-cols-5 text-xs text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
            <span className="font-mono">{new Date(c.timestamp).toLocaleTimeString()}</span>
            <span className={cn("font-medium capitalize",
              c.status === "online" ? "text-emerald-600" : c.status === "offline" ? "text-red-500" : "text-amber-500"
            )}>{c.status}</span>
            <span>{c.responseMs ? `${c.responseMs}ms` : "—"}</span>
            <span>{c.dns?.ok ? "✓" : c.dns?.error ? "✗" : "—"}</span>
            <span className="flex items-center gap-1.5">
              {c.http?.statusCode ?? "—"}
              {c.health?.db?.ok === false && <span className="text-red-400">DB↓</span>}
              {c.health?.db?.ok === true && <span className="text-emerald-500">DB↑</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SettingsTab({ project, onUpdate }: { project: ProjectConfig; onUpdate: (p: ProjectConfig) => void }) {
  const [hubSecret, setHubSecret] = useState(project.hubSecret)
  const [healthEndpoint, setHealthEndpoint] = useState(project.healthEndpoint)
  const [copied, setCopied] = useState<string | null>(null)

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  function save() {
    onUpdate({ ...project, hubSecret, healthEndpoint })
  }

  const envLine = `HUB_SECRET=${hubSecret}`
  const routeCode = `// ${healthEndpoint}.ts (Next.js App Router)
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  if (req.headers.get("x-hub-secret") !== process.env.HUB_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Add your real DB/stats queries here
  return NextResponse.json({
    status: "ok",
    db: { ok: true },
    stats: { users: 0 },
    fetchedAt: new Date().toISOString(),
  })
}`

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">Connection</h3>
        <p className="text-xs text-zinc-500 mb-4">Configure how the hub connects to this project.</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">Hub Secret</label>
            <div className="flex gap-2">
              <input value={hubSecret} onChange={(e) => setHubSecret(e.target.value)}
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400" />
              <button onClick={() => copy(hubSecret, "secret")}
                className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                {copied === "secret" ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">Health Endpoint</label>
            <input value={healthEndpoint} onChange={(e) => setHealthEndpoint(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400" />
          </div>
          <button onClick={save}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-80">
            Save Changes
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">Setup Instructions</h3>
        <p className="text-xs text-zinc-500 mb-4">Add these to your project to enable rich data in the hub.</p>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">1 — Environment variable (Vercel → Settings → Env Vars)</p>
            <div className="relative rounded-xl bg-zinc-950 text-emerald-400 font-mono text-xs p-4">
              <pre>{envLine}</pre>
              <button onClick={() => copy(envLine, "env")} className="absolute top-3 right-3 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400">
                {copied === "env" ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">2 — Health route in your project</p>
            <div className="relative rounded-xl bg-zinc-950 text-zinc-300 font-mono text-[11px] p-4 overflow-x-auto">
              <pre>{routeCode}</pre>
              <button onClick={() => copy(routeCode, "route")} className="absolute top-3 right-3 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400">
                {copied === "route" ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Project Info</h3>
        {[
          { label: "Name", value: project.name },
          { label: "URL", value: project.url },
          { label: "ID", value: project.id },
          { label: "Added", value: new Date(project.addedAt).toLocaleDateString() },
        ].map((r) => (
          <div key={r.label} className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 text-xs">
            <span className="text-zinc-500">{r.label}</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-300 break-all text-right max-w-[60%]">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center gap-1.5 mb-2 text-zinc-400">{icon}<span className="text-[11px]">{label}</span></div>
      <p className="text-xl font-bold text-zinc-900 dark:text-white">{value}</p>
    </div>
  )
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k"
  return n.toString()
}

function humanise(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim()
}

function iconFor(key: string) {
  if (key.includes("user") || key.includes("User")) return <Users size={14} />
  if (key.includes("pay") || key.includes("revenue")) return <DollarSign size={14} />
  if (key.includes("view") || key.includes("traffic")) return <Eye size={14} />
  return <Activity size={14} />
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return "just now"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}
