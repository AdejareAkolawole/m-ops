"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { VercelSyncedProject, ManualProject, HostingProvider, ProviderProject } from "@/lib/types"
import {
  getVercelAccount, getVercelProjects, saveVercelProjects,
  updateVercelProject, clearVercelAccount,
  getVercelSelectedIds, saveVercelSelectedIds, clearVercelSelectedIds,
  getChecks, getAllChecks, saveProviderProjects,
  saveGitHubAccount,
} from "@/lib/store"
import type { ManualProject } from "@/lib/types"

function dbToManual(p: any): ManualProject {
  const meta = p.metadata ? JSON.parse(p.metadata) : {}
  return {
    id: p.id, name: p.name, url: p.url,
    hubSecret: meta.hubSecret ?? "",
    healthEndpoint: meta.healthEndpoint ?? "/api/hub/health",
    adminUrl: meta.adminUrl,
    adminApiUrl: meta.adminApiUrl,
    adminApiToken: meta.adminApiToken,
    description: meta.description,
    addedAt: p.createdAt ?? new Date().toISOString(),
    lastChecked: meta.lastChecked,
    lastStatus: meta.lastStatus,
  }
}

function manualMeta(p: ManualProject) {
  return JSON.stringify({
    hubSecret: p.hubSecret, healthEndpoint: p.healthEndpoint,
    adminUrl: p.adminUrl, adminApiUrl: p.adminApiUrl,
    adminApiToken: p.adminApiToken, description: p.description,
  })
}
import { ConnectVercel } from "@/components/ConnectVercel"
import { ConnectProvider } from "@/components/ConnectProvider"
import { LiveBar, pushLiveEvent } from "@/components/LiveBar"
import { IncidentToasts, ToastEvent } from "@/components/IncidentToast"
import { VercelProjectCard } from "@/components/VercelProjectCard"
import { VercelProjectDetail } from "@/components/VercelProjectDetail"
import { VercelProjectPicker } from "@/components/VercelProjectPicker"
import { ManualProjectCard } from "@/components/ManualProjectCard"
import { Sidebar } from "@/components/Sidebar"
import { ManualProjectDetail } from "@/components/ManualProjectDetail"
import { AddProjectModal } from "@/components/AddProjectModal"
import { MonitoringDashboard } from "@/components/MonitoringDashboard"
import { getGitHubAccount } from "@/lib/store"
import { Spinner } from "@/components/AuthLoader"
import {
  DashboardCircleIcon,
  ArrowReloadHorizontalIcon,
  CancelCircleIcon,
  AddSquareIcon,
  PlugSocketIcon,
  RocketIcon,
  AlertCircleIcon,
  GlobalIcon,
  Shield01Icon,
} from "hugeicons-react"

const ADMIN_EMAIL = "adejare.akolawole@gmail.com"
import { cn } from "@/lib/utils"

interface UptimeResult {
  ok: boolean
  statusCode?: number
  responseMs?: number
  error?: string
  checking?: boolean
}

type SelectedProject =
  | { type: "vercel"; project: VercelSyncedProject }
  | { type: "manual"; project: ManualProject }

export default function Home() {
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  const [showConnect, setShowConnect] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [vercelProjects, setVercelProjects] = useState<VercelSyncedProject[]>([])
  const [manualProjects, setManualProjects] = useState<ManualProject[]>([])
  const [selected, setSelected] = useState<SelectedProject | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [syncing, setSyncing] = useState(false)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)
  const [vercelConnected, setVercelConnected] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [allVercelProjects, setAllVercelProjects] = useState<VercelSyncedProject[]>([])
  const [selectedVercelIds, setSelectedVercelIds] = useState<string[]>([])
  const [showManagePicker, setShowManagePicker] = useState(false)
  const [uptime, setUptime] = useState<Record<string, UptimeResult>>({})
  const uptimeRef = useRef<Record<string, UptimeResult>>({})
  const [connectingProvider, setConnectingProvider] = useState<HostingProvider | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [toasts, setToasts] = useState<ToastEvent[]>([])
  const prevStatusRef = useRef<Record<string, boolean | undefined>>({})

  useEffect(() => {
    const account = getVercelAccount()
    setVercelConnected(!!account)
    const all = getVercelProjects()
    setAllVercelProjects(all)
    const selectedIds = getVercelSelectedIds()
    if (selectedIds !== null && selectedIds.length > 0) {
      setSelectedVercelIds(selectedIds)
      setVercelProjects(all.filter((p) => selectedIds.includes(p.id)))
    } else if (selectedIds !== null && selectedIds.length === 0) {
      // Empty selection saved — show all projects (treat as "show all")
      setSelectedVercelIds(all.map((p) => p.id))
      setVercelProjects(all)
    } else if (all.length > 0) {
      // Never chosen yet — show picker
      setShowPicker(true)
      setAllVercelProjects(all)
    }
    // Load manual projects from DB
    fetch("/api/projects")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setManualProjects(data.map(dbToManual)) })
      .catch(() => {})

    // Handle GitHub OAuth return — token arrives in URL params
    const params = new URLSearchParams(window.location.search)
    const ghToken = params.get("gh_token")
    const ghLogin = params.get("gh_login")
    if (ghToken && ghLogin) {
      saveGitHubAccount({ token: ghToken, login: ghLogin, connectedAt: new Date().toISOString() })
      // Clean the URL
      window.history.replaceState({}, "", window.location.pathname)
      // Select the first project and open Code Insights
      const pending = localStorage.getItem("gh_oauth_pending")
      localStorage.removeItem("gh_oauth_pending")
      if (pending === "insights") {
        const vercelAll = getVercelProjects()
        const selectedIds2 = getVercelSelectedIds()
        const shown = selectedIds2?.length ? vercelAll.filter(p => selectedIds2.includes(p.id)) : vercelAll
        if (shown.length > 0) {
          setSelected({ type: "vercel", project: shown[0] })
          setActiveTab("insights")
        } else {
          if (manualProjects.length > 0) {
            setSelected({ type: "manual", project: manualProjects[0] })
            setActiveTab("insights")
          }
        }
      }
    }

    setMounted(true)
  }, [])

  const account = mounted ? getVercelAccount() : null

  // Run uptime check for a single URL
  const checkUptime = useCallback(async (id: string, url: string, projectName?: string) => {
    setUptime((prev) => ({ ...prev, [id]: { ...prev[id], checking: true, ok: prev[id]?.ok ?? false } }))
    try {
      const res = await fetch("/api/uptime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      if (res.ok) {
        const data = await res.json()
        const result: UptimeResult = { ok: data.ok, statusCode: data.statusCode, responseMs: data.responseMs, checking: false }
        uptimeRef.current[id] = result
        setUptime((prev) => ({ ...prev, [id]: result }))

        const name = projectName ?? id
        const prevOk = prevStatusRef.current[id]

        // Push live bar event for every successful check
        if (data.ok) {
          pushLiveEvent({ type: "check", projectName: name, message: "responding", ms: data.responseMs })
        }

        // Status change toasts
        if (prevOk === true && !data.ok) {
          // went down
          setToasts(ts => [...ts, {
            id: `${id}-${Date.now()}`, type: "down", projectName: name,
            projectId: id, message: "Service is unreachable", startedAt: Date.now(),
            onDiagnose: () => {
              const vp = vercelProjects.find(p => p.id === id)
              const mp = manualProjects.find(p => p.id === id)
              if (vp) { setSelected({ type: "vercel", project: vp }); setActiveTab("debug") }
              else if (mp) { setSelected({ type: "manual", project: mp }); setActiveTab("debug") }
            },
          }])
          pushLiveEvent({ type: "down", projectName: name, message: "went UNREACHABLE" })
        } else if (prevOk === false && data.ok) {
          // recovered
          setToasts(ts => [...ts, { id: `${id}-${Date.now()}`, type: "recover", projectName: name, message: "Back online — recovered", startedAt: Date.now() }])
          pushLiveEvent({ type: "recover", projectName: name, message: "recovered ✓", ms: data.responseMs })
        }

        prevStatusRef.current[id] = data.ok
      }
    } catch {
      setUptime((prev) => ({ ...prev, [id]: { ok: false, checking: false } }))
    }
  }, [])

  // Auto-ping all projects on mount + every 60s
  useEffect(() => {
    if (!mounted) return

    function pingAll() {
      const vProjects = getVercelProjects()
      for (const p of vProjects) {
        const url = p.productionUrl ?? (p.latestDeployment ? `https://${p.latestDeployment.url}` : null)
        if (url) checkUptime(p.id, url, p.name)
      }
      for (const p of manualProjects) {
        checkUptime(p.id, p.url, p.name)
      }
    }

    pingAll()
    const interval = setInterval(pingAll, 60_000)
    return () => clearInterval(interval)
  }, [mounted, checkUptime, manualProjects])

  function handleVercelConnected(ps: VercelSyncedProject[]) {
    setAllVercelProjects(ps)
    setVercelConnected(true)
    setShowConnect(false)
    // Always show picker after connecting so user selects what they want
    setShowPicker(true)
  }

  function handlePickerConfirm(ids: string[]) {
    saveVercelSelectedIds(ids)
    setSelectedVercelIds(ids)
    setVercelProjects(allVercelProjects.filter((p) => ids.includes(p.id)))
    setShowPicker(false)
    setShowManagePicker(false)
  }

  function handleDisconnectVercel() {
    if (!confirm("Disconnect Vercel? Your synced project data will be removed from this browser.")) return
    clearVercelAccount()
    clearVercelSelectedIds()
    setVercelProjects([])
    setAllVercelProjects([])
    setSelectedVercelIds([])
    setVercelConnected(false)
    setSelected(null)
  }

  const syncVercel = useCallback(async () => {
    if (!account) return
    setSyncing(true)
    try {
      const res = await fetch("/api/vercel/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: account.token, teamId: account.teamId }),
      })
      if (res.ok) {
        const data = await res.json()
        const existing = getVercelProjects()
        const merged = data.map((p: VercelSyncedProject) => {
          const prev = existing.find((e) => e.id === p.id)
          return prev ? { ...p, deployments: prev.deployments, domains: prev.domains, envKeys: prev.envKeys, hasDbUrl: prev.hasDbUrl, dbKey: prev.dbKey } : p
        })
        saveVercelProjects(merged)
        const toShow = selectedVercelIds.length > 0
          ? merged.filter((p: VercelSyncedProject) => selectedVercelIds.includes(p.id))
          : merged
        setVercelProjects(toShow)
      }
    } finally { setSyncing(false) }
  }, [account, selectedVercelIds])

  async function refreshVercelProject(p: VercelSyncedProject) {
    if (!account) return
    setRefreshingId(p.id)
    try {
      const res = await fetch("/api/vercel/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: account.token, teamId: account.teamId, projectId: p.id }),
      })
      if (res.ok) {
        const data = await res.json()
        const patch = {
          deployments: data.deployments,
          domains: data.domains,
          hasDbUrl: data.hasDbUrl,
          dbKey: data.dbKey,
          envKeys: data.envKeys,
          latestDeployment: data.deployments?.[0] ?? p.latestDeployment,
        }
        updateVercelProject(p.id, patch)
        const all = getVercelProjects()
        setVercelProjects(selectedVercelIds.length > 0 ? all.filter(p => selectedVercelIds.includes(p.id)) : all)
        if (selected?.type === "vercel" && selected.project.id === p.id) {
          setSelected({ type: "vercel", project: { ...selected.project, ...patch } })
        }
      }
    } finally { setRefreshingId(null) }
  }

  if (!mounted) return null

  const live = vercelProjects.filter((p) => p.latestDeployment?.state === "READY").length
  const errored = vercelProjects.filter((p) => p.latestDeployment?.state === "ERROR").length
  const totalProjects = vercelProjects.length + manualProjects.length
  const manualDown = manualProjects.filter((p) => uptime[p.id]?.ok === false).length

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: "#0a0a0a" }}>
      {/* Sidebar — only when a project is selected */}
      {selected && (
        <Sidebar
          vercelProjects={vercelProjects}
          manualProjects={manualProjects}
          selected={selected}
          onSelect={(s) => { setSelected(s); setActiveTab("overview") }}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          vercelConnected={vercelConnected}
          syncing={syncing}
          onSync={syncVercel}
          onConnectVercel={() => setShowConnect(true)}
          onDisconnectVercel={handleDisconnectVercel}
          onAddProject={() => setShowAddProject(true)}
          onManageVercel={() => setShowManagePicker(true)}
          uptime={uptime}
          history={getAllChecks()}
        />
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto flex flex-col" style={{ minWidth: 0 }}>
        {selected ? (
          <div className="h-full">
            {selected.type === "vercel" ? (
              <VercelProjectDetail
                project={selected.project}
                onBack={() => setSelected(null)}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            ) : (
              <ManualProjectDetail
                project={selected.project}
                onBack={() => setSelected(null)}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onDeleted={async () => {
                  if (selected?.type === "manual") {
                    await fetch(`/api/projects/${selected.project.id}`, { method: "DELETE" })
                    setManualProjects(prev => prev.filter(p => p.id !== selected.project.id))
                  }
                  setSelected(null)
                }}
                onUpdated={async (p) => {
                  await fetch(`/api/projects/${p.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: p.name, url: p.url, metadata: manualMeta(p) }),
                  })
                  setManualProjects(prev => prev.map(mp => mp.id === p.id ? p : mp))
                  setSelected({ type: "manual", project: p })
                }}
              />
            )}
          </div>
        ) : (
          <>
            {/* ── Top nav (dashboard only) ── */}
            <nav style={{ height: "52px", borderBottom: "1px solid #181818", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", flexShrink: 0, background: "#090909" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ color: "#fff", fontSize: "15px", fontWeight: 800, letterSpacing: "-0.05em" }}>m-ops</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {!vercelConnected && (
                  <button onClick={() => setShowConnect(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "7px", fontSize: "12px", fontWeight: 500, background: "#141414", border: "1px solid #1e1e1e", color: "#888", cursor: "pointer" }}>
                    <PlugSocketIcon size={12} /> Connect Vercel
                  </button>
                )}
                {session?.user && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "4px", paddingLeft: "12px", borderLeft: "1px solid #1e1e1e" }}>
                    <a href="/settings" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
                      {session.user.image ? (
                        <img src={session.user.image} alt="" style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#fff" }}>
                          {(session.user.name || session.user.email || "U")[0].toUpperCase()}
                        </div>
                      )}
                      <span style={{ fontSize: "12px", color: "#555", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {session.user.name || session.user.email}
                      </span>
                    </a>
                    {session.user.email === ADMIN_EMAIL && (
                      <a href="/admin" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11.5px", color: "#7c3aed", textDecoration: "none", padding: "2px 4px" }}>
                        <Shield01Icon size={11} /> Admin
                      </a>
                    )}
                    <button
                      onClick={async () => { setSigningOut(true); await signOut({ callbackUrl: "/" }) }}
                      disabled={signingOut}
                      style={{ fontSize: "11.5px", color: "#333", background: "none", border: "none", cursor: signingOut ? "not-allowed" : "pointer", padding: "2px 4px", display: "flex", alignItems: "center", gap: "5px", opacity: signingOut ? 0.5 : 1 }}
                    >
                      {signingOut && <Spinner size={11} color="#555" />}
                      {signingOut ? "Signing out..." : "Sign out"}
                    </button>
                  </div>
                )}
              </div>
            </nav>

            {/* ── Dashboard content ── */}
            <div className="flex-1 overflow-y-auto">
              {totalProjects === 0 && !vercelConnected ? (
                <div style={{ padding: "80px 28px", textAlign: "center" }}>
                  <EmptyState
                    onAddProject={() => setShowAddProject(true)}
                    onConnectVercel={() => setShowConnect(true)}
                  />
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "14px 28px 0", gap: "8px" }}>
                    <button onClick={() => setShowAddProject(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", fontSize: "12.5px", fontWeight: 600, background: "#181818", color: "#e8e8e8", cursor: "pointer", border: "1px solid #242424" }}>
                      <AddSquareIcon size={13} /> Add Project
                    </button>
                  </div>
                  <MonitoringDashboard
                    vercelProjects={vercelProjects}
                    manualProjects={manualProjects}
                    allChecks={getAllChecks()}
                    uptime={uptime}
                    onSelect={(s) => { setSelected(s); setActiveTab("overview") }}
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>

      <IncidentToasts toasts={toasts} onDismiss={id => setToasts(ts => ts.filter(t => t.id !== id))} />



      {showConnect && <ConnectVercel onClose={() => setShowConnect(false)} onConnected={handleVercelConnected} />}
      {showPicker && <VercelProjectPicker projects={allVercelProjects} onConfirm={handlePickerConfirm} mode="pick" />}
      {showManagePicker && (
        <VercelProjectPicker
          projects={allVercelProjects} initialSelected={selectedVercelIds}
          onConfirm={handlePickerConfirm} onClose={() => setShowManagePicker(false)} mode="manage"
        />
      )}
      {showAddProject && (
        <AddProjectModal
          onClose={() => setShowAddProject(false)}
          onAdded={async (p) => {
            const res = await fetch("/api/projects", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: p.name, url: p.url, type: "manual", metadata: manualMeta(p) }),
            })
            if (res.ok) {
              const saved = await res.json()
              const mp = dbToManual(saved)
              setManualProjects(prev => [mp, ...prev])
              checkUptime(mp.id, mp.url)
            }
            setShowAddProject(false)
          }}
          onConnectVercel={() => { setShowAddProject(false); setShowConnect(true) }}
          onConnectProvider={(p) => { setShowAddProject(false); setConnectingProvider(p) }}
        />
      )}
      {connectingProvider && (
        <ConnectProvider
          provider={connectingProvider}
          onClose={() => setConnectingProvider(null)}
          onConnected={(projects: ProviderProject[]) => {
            saveProviderProjects(connectingProvider, projects)
            setConnectingProvider(null)
            for (const p of projects) {
              if (p.url) checkUptime(p.id, p.url)
            }
          }}
        />
      )}
    </div>
  )
}

function EmptyState({ onAddProject, onConnectVercel }: { onAddProject: () => void; onConnectVercel: () => void }) {
  return (
    <div className="max-w-xl mx-auto py-16 text-center">
      <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-5">
        <DashboardCircleIcon size={28} className="text-zinc-400" />
      </div>
      <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Welcome to m-ops</h1>
      <p className="text-sm text-zinc-500 mb-10 max-w-sm mx-auto">
        Monitor all your projects from one place — deployments, databases, domains, uptime, and more.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-10">
        <button onClick={onAddProject}
          className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm transition-all text-left">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center mb-3">
            <AddSquareIcon size={16} className="text-white dark:text-zinc-900" />
          </div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">Add a project manually</p>
          <p className="text-xs text-zinc-500">Any URL — paste it in and start monitoring uptime, DNS, SSL, and response time.</p>
        </button>

        <button onClick={onConnectVercel}
          className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm transition-all text-left">
          <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center mb-3">
            <svg width="16" height="16" viewBox="0 0 76 65" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">Connect Vercel</p>
          <p className="text-xs text-zinc-500">Paste one API token and all your Vercel projects import automatically — deployments, domains, env vars, DB health.</p>
        </button>
      </div>
    </div>
  )
}
