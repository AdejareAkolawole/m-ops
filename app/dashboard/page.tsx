"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { VercelSyncedProject, ManualProject, HostingProvider, ProviderProject } from "@/lib/types"
import {
  getVercelAccount, getVercelProjects, saveVercelProjects,
  updateVercelProject, clearVercelAccount,
  getVercelSelectedIds, saveVercelSelectedIds, clearVercelSelectedIds,
  getChecks, getAllChecks, saveProviderProjects,
  saveGitHubAccount, savePlanCache, initStore,
} from "@/lib/store"
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
import { VercelProjectCard } from "@/components/VercelProjectCard"
import { VercelProjectDetail } from "@/components/VercelProjectDetail"
import { VercelProjectPicker } from "@/components/VercelProjectPicker"
import { ManualProjectCard } from "@/components/ManualProjectCard"
import { Sidebar } from "@/components/Sidebar"
import { ManualProjectDetail } from "@/components/ManualProjectDetail"
import { AddProjectModal } from "@/components/AddProjectModal"
import { MonitoringDashboard } from "@/components/MonitoringDashboard"
import { Onboarding } from "@/components/Onboarding"
import { HelpButton } from "@/components/HelpButton"
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [allVercelProjects, setAllVercelProjects] = useState<VercelSyncedProject[]>([])
  const [selectedVercelIds, setSelectedVercelIds] = useState<string[]>([])
  const [showManagePicker, setShowManagePicker] = useState(false)
  const [uptime, setUptime] = useState<Record<string, UptimeResult>>({})
  const uptimeRef = useRef<Record<string, UptimeResult>>({})
  const [connectingProvider, setConnectingProvider] = useState<HostingProvider | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const prevStatusRef = useRef<Record<string, boolean | undefined>>({})

  useEffect(() => {
    if (session?.user?.id) initStore(session.user.id)
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
          fetch("/api/alerts/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectName: name, projectUrl: url, status: "down", error: data.error }) }).catch(() => {})
          pushLiveEvent({ type: "down", projectName: name, message: "went UNREACHABLE" })
        } else if (prevOk === false && data.ok) {
          fetch("/api/alerts/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectName: name, projectUrl: url, status: "up", responseMs: data.responseMs }) }).catch(() => {})
          pushLiveEvent({ type: "recover", projectName: name, message: "recovered ✓", ms: data.responseMs })
        }

        prevStatusRef.current[id] = data.ok
      }
    } catch {
      setUptime((prev) => ({ ...prev, [id]: { ok: false, checking: false } }))
    }
  }, [])

  // Auto-ping all projects — interval is plan-based (30s Pro/Team, 300s Free)
  const [checkIntervalMs, setCheckIntervalMs] = useState(60_000)
  const [userPlan, setUserPlan] = useState<string>("free")
  const [planCfg, setPlanCfg] = useState<{ maxProjects: number; checkIntervalSec: number; historyDays: number; ai: boolean; slackAlerts: boolean } | null>(null)
  useEffect(() => {
    fetch("/api/user/plan-config").then(r => r.json()).then(d => {
      if (d.config?.checkIntervalSec) setCheckIntervalMs(d.config.checkIntervalSec * 1000)
      if (d.plan && d.config?.historyDays) savePlanCache(d.plan, d.config.historyDays)
      if (d.plan) setUserPlan(d.plan)
      if (d.config) setPlanCfg(d.config)
    }).catch(() => {})
  }, [])

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
    const interval = setInterval(pingAll, checkIntervalMs)
    return () => clearInterval(interval)
  }, [mounted, checkUptime, manualProjects, checkIntervalMs])

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
          onSelect={(s) => { setSelected(s); setActiveTab("overview"); setMobileSidebarOpen(false) }}
          activeTab={activeTab}
          onTabChange={(t) => { setActiveTab(t); setMobileSidebarOpen(false) }}
          vercelConnected={vercelConnected}
          syncing={syncing}
          onSync={syncVercel}
          onConnectVercel={() => setShowConnect(true)}
          onDisconnectVercel={handleDisconnectVercel}
          onAddProject={() => setShowAddProject(true)}
          onManageVercel={() => setShowManagePicker(true)}
          uptime={uptime}
          history={getAllChecks()}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto flex flex-col" style={{ minWidth: 0 }}>
        {selected ? (
          <div className="h-full" style={{ position: "relative" }}>
            {/* Mobile hamburger — only shows on small screens */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              style={{ position: "absolute", top: "10px", left: "12px", zIndex: 30, background: "#141414", border: "1px solid #222", borderRadius: "8px", padding: "6px 8px", cursor: "pointer", color: "#888", display: "none" }}
              className="mob-hamburger"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <style>{`@media (max-width: 768px) { .mob-hamburger { display: flex !important; align-items: center; } }`}</style>
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
            <nav style={{ height: "52px", borderBottom: "1px solid #181818", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 0 20px", flexShrink: 0, background: "#090909" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ color: "#fff", fontSize: "15px", fontWeight: 800, letterSpacing: "-0.05em" }}>m-ops</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {!vercelConnected && (
                  <button onClick={() => setShowConnect(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", borderRadius: "7px", fontSize: "12px", fontWeight: 500, background: "#141414", border: "1px solid #1e1e1e", color: "#888", cursor: "pointer" }}>
                    <PlugSocketIcon size={12} /><span className="mob-hide">Connect Vercel</span>
                  </button>
                )}
                {session?.user && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "4px", paddingLeft: "10px", borderLeft: "1px solid #1e1e1e" }}>
                    <a href="/settings" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", padding: "5px 8px", borderRadius: "8px", border: "1px solid #1e1e1e", background: "#0f0f0f" }}>
                      {session.user.image ? (
                        <img src={session.user.image} alt="" style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#fff" }}>
                          {(session.user.name || session.user.email || "U")[0].toUpperCase()}
                        </div>
                      )}
                      <span className="mob-nav-name" style={{ fontSize: "13px", fontWeight: 500, color: "#bbb", maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {session.user.name || session.user.email}
                      </span>
                    </a>
                    {session.user.email === ADMIN_EMAIL && (
                      <a href="/admin" style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12.5px", fontWeight: 600, color: "#a78bfa", textDecoration: "none", padding: "6px 10px", borderRadius: "8px", border: "1px solid #2d1f6e", background: "#130e2e" }}>
                        <Shield01Icon size={13} /><span className="mob-nav-admin-text">Admin</span>
                      </a>
                    )}
                    <button
                      onClick={async () => { setSigningOut(true); await signOut({ callbackUrl: "/" }) }}
                      disabled={signingOut}
                      style={{ fontSize: "13px", fontWeight: 500, color: "#555", background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: "8px", cursor: signingOut ? "not-allowed" : "pointer", padding: "6px 10px", display: "flex", alignItems: "center", gap: "5px", opacity: signingOut ? 0.5 : 1 }}
                    >
                      {signingOut && <Spinner size={12} color="#555" />}
                      <span className="mob-hide">{signingOut ? "Signing out…" : "Sign out"}</span>
                      {!signingOut && <span style={{ fontSize: "13px", color: "#444" }}>↪</span>}
                    </button>
                  </div>
                )}
              </div>
            </nav>

            {/* ── Dashboard content ── */}
            <div className="flex-1 overflow-y-auto">
              {totalProjects === 0 && !vercelConnected ? (
                <div style={{ padding: "60px 20px", textAlign: "center" }}>
                  <EmptyState
                    onAddProject={() => setShowAddProject(true)}
                    onConnectVercel={() => setShowConnect(true)}
                  />
                </div>
              ) : (
                <>
                  {/* ── Plan banner ── */}
                  {planCfg && (
                    <div className="plan-banner" style={{ margin: "14px 16px 0", padding: "12px 16px", background: "#0d0d0d", border: "1px solid #1c1c1c", borderRadius: 12, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                          padding: "2px 8px", borderRadius: 6, textTransform: "uppercase" as const,
                          background: userPlan === "team" ? "#0d2a1a" : userPlan === "pro" ? "#1e1b4b" : "#1a1a1a",
                          color: userPlan === "team" ? "#4ade80" : userPlan === "pro" ? "#a5b4fc" : "#666",
                          border: `1px solid ${userPlan === "team" ? "#1a4a2a" : userPlan === "pro" ? "#2a1a5e" : "#222"}`,
                        }}>{userPlan}</span>
                        <span style={{ fontSize: 12, color: "#444" }}>plan</span>
                      </div>
                      <div className="plan-banner-divider" style={{ width: 1, height: 16, background: "#1e1e1e" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, color: "#555" }}>Projects</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>
                          {manualProjects.length} / {planCfg.maxProjects === Infinity ? "∞" : planCfg.maxProjects}
                        </span>
                      </div>
                      <div className="plan-banner-divider" style={{ width: 1, height: 16, background: "#1e1e1e" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, color: "#555" }}>Checks every</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>
                          {planCfg.checkIntervalSec >= 60 ? `${planCfg.checkIntervalSec / 60}m` : `${planCfg.checkIntervalSec}s`}
                        </span>
                      </div>
                      <div className="plan-banner-divider" style={{ width: 1, height: 16, background: "#1e1e1e" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, color: "#555" }}>History</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>{planCfg.historyDays}d</span>
                      </div>
                      <div className="plan-banner-divider" style={{ width: 1, height: 16, background: "#1e1e1e" }} />
                      <div style={{ display: "flex", gap: 6 }}>
                        {planCfg.ai && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "#0d1a0d", color: "#4ade80", border: "1px solid #1a3a1a" }}>AI</span>}
                        {planCfg.slackAlerts && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "#0d1220", color: "#818cf8", border: "1px solid #1a2040" }}>Slack</span>}
                        {!planCfg.ai && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "#1a1a1a", color: "#333", border: "1px solid #222" }}>No AI</span>}
                      </div>
                      {userPlan === "free" && (
                        <a href="/settings?tab=billing" style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 600, color: "#a5b4fc", textDecoration: "none", padding: "4px 10px", border: "1px solid #2a1a5e", borderRadius: 7, background: "#1e1b4b", whiteSpace: "nowrap" as const }}>
                          Upgrade →
                        </a>
                      )}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "12px 16px 0", gap: "8px" }}>
                    <HelpButton onAddProject={() => setShowAddProject(true)} plan={userPlan} inline />
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
            if (!res.ok) {
              const err = await res.json()
              if (err.error === "plan_limit") {
                setShowAddProject(false)
                setShowUpgradeModal(true)
              }
              return
            }
            const saved = await res.json()
            const mp = dbToManual(saved)
            setManualProjects(prev => [mp, ...prev])
            checkUptime(mp.id, mp.url)
            setShowAddProject(false)
          }}
          onConnectVercel={() => { setShowAddProject(false); setShowConnect(true) }}
          onConnectProvider={(p) => { setShowAddProject(false); setConnectingProvider(p) }}
        />
      )}
      {showUpgradeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, width: "100%", maxWidth: 420, padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1e1b4b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RocketIcon size={16} color="#a5b4fc" />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#e8e8e8", margin: 0 }}>Project limit reached</p>
                <p style={{ fontSize: 12, color: "#444", margin: 0 }}>Free plan is limited to 3 projects</p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#555", lineHeight: 1.65, marginBottom: 24 }}>
              Upgrade to <strong style={{ color: "#a5b4fc" }}>Pro</strong> for unlimited projects, 30-second monitoring intervals, AI debugging, and Code Insights — all for $2/month.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <a href="/settings?tab=billing" style={{ flex: 1, display: "block", textAlign: "center", background: "#e8e8e8", color: "#000", fontWeight: 700, fontSize: 13, padding: "10px 0", borderRadius: 10, textDecoration: "none" }}>
                Upgrade to Pro →
              </a>
              <button onClick={() => setShowUpgradeModal(false)} style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, background: "#1a1a1a", color: "#555", border: "1px solid #222", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <Onboarding
        onAddProject={() => setShowAddProject(true)}
        onGoToAlerts={() => { window.location.href = "/settings?tab=alerts" }}
      />
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
