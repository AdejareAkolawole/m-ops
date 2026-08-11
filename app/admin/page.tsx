"use client"
import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft01Icon, UserIcon, DashboardCircleIcon, Delete02Icon,
  Shield01Icon, UserMultipleIcon, PencilEdit02Icon, FloppyDiskIcon,
  Cancel01Icon, CheckmarkCircle02Icon, AlertCircleIcon, AddSquareIcon,
  LockPasswordIcon, UserAdd01Icon, ArrowDown01Icon, Time01Icon,
} from "hugeicons-react"

const ADMIN_EMAIL = "adejare.akolawole@gmail.com"

interface UserRow {
  id: string; name: string | null; email: string; image: string | null
  plan: string
  emailVerified: string | null; createdAt: string; updatedAt: string
  accounts: { provider: string }[]
  sessions: { id: string; expires: string }[]
  _count: { sessions: number; accounts: number; projects: number }
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    free:  { bg: "#1a1a1a",   color: "#555",   border: "#222" },
    pro:   { bg: "#1e1b4b",   color: "#a5b4fc", border: "#312e81" },
    team:  { bg: "#0d2818",   color: "#4ade80", border: "#14532d" },
  }
  const c = colors[plan] ?? colors.free
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", padding: "2px 8px", borderRadius: 99, background: c.bg, color: c.color, border: `1px solid ${c.border}`, textTransform: "uppercase" }}>
      {plan}
    </span>
  )
}
interface SessionRow {
  id: string; sessionToken: string; userId: string; expires: string
  user: { id: string; name: string | null; email: string; image: string | null }
}
interface Stats { totalUsers: number; totalSessions: number; totalAccounts: number; recentUsers: number }

type Tab = "overview" | "users" | "sessions"

// ── tiny helpers ─────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000
  if (d < 60) return "just now"
  if (d < 3600) return `${Math.floor(d / 60)}m ago`
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`
  return `${Math.floor(d / 86400)}d ago`
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function Toast({ type, msg, onClose }: { type: "ok" | "err"; msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderRadius: 10, fontSize: 13, background: type === "ok" ? "#0d1f14" : "#1f0d0d", border: `1px solid ${type === "ok" ? "#1a4028" : "#401a1a"}`, color: type === "ok" ? "#4ade80" : "#f87171" }}>
      {type === "ok" ? <CheckmarkCircle02Icon size={14} /> : <AlertCircleIcon size={14} />}
      {msg}
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", marginLeft: 4, padding: 0 }}><Cancel01Icon size={12} /></button>
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, width: "100%", maxWidth: 440, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#e8e8e8" }}>{title}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#444" }}><Cancel01Icon size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: "100%", background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#e8e8e8", outline: "none", boxSizing: "border-box", marginBottom: 12 }
const labelStyle: React.CSSProperties = { display: "block", fontSize: 11.5, fontWeight: 500, color: "#555", marginBottom: 5 }
const btnPrimary: React.CSSProperties = { padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "#e8e8e8", color: "#000", border: "none", cursor: "pointer" }
const btnGhost: React.CSSProperties = { padding: "9px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, background: "#1a1a1a", color: "#888", border: "1px solid #242424", cursor: "pointer" }

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("overview")
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null)

  // data
  const [users, setUsers] = useState<UserRow[]>([])
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [stats, setStats] = useState<Stats | null>(null)

  // loading
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [loadingStats, setLoadingStats] = useState(false)

  // ui state
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPlan, setEditPlan] = useState("free")
  const [editLoading, setEditLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [resetId, setResetId] = useState<string | null>(null)
  const [resetPw, setResetPw] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteName, setInviteName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [invitePw, setInvitePw] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [revokingSession, setRevokingSession] = useState<string | null>(null)

  const isAdmin = session?.user?.email === ADMIN_EMAIL

  const ok = (msg: string) => setToast({ type: "ok", msg })
  const err = (msg: string) => setToast({ type: "err", msg })

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return }
    if (status === "authenticated" && !isAdmin) { router.push("/dashboard"); return }
  }, [status, isAdmin, router])

  useEffect(() => {
    if (!isAdmin) return
    setLoadingStats(true)
    fetch("/api/admin/stats").then(r => r.json()).then(setStats).finally(() => setLoadingStats(false))
  }, [isAdmin])

  const loadUsers = useCallback(() => {
    if (!isAdmin) return
    setLoadingUsers(true)
    fetch("/api/admin/users").then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : [])).finally(() => setLoadingUsers(false))
  }, [isAdmin])

  const loadSessions = useCallback(() => {
    if (!isAdmin) return
    setLoadingSessions(true)
    fetch("/api/admin/sessions").then(r => r.json()).then(d => setSessions(Array.isArray(d) ? d : [])).finally(() => setLoadingSessions(false))
  }, [isAdmin])

  useEffect(() => { if (tab === "users") loadUsers() }, [tab, loadUsers])
  useEffect(() => { if (tab === "sessions") loadSessions() }, [tab, loadSessions])

  async function saveEdit(id: string) {
    setEditLoading(true)
    try {
      const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: editName, email: editEmail, plan: editPlan }) })
      const data = await res.json()
      if (!res.ok) return err(data.error || "Failed to update")
      setUsers(u => u.map(x => x.id === id ? { ...x, name: data.name, email: data.email, plan: data.plan } : x))
      setEditingId(null); ok("User updated")
    } finally { setEditLoading(false) }
  }

  async function resetPassword(id: string) {
    if (!resetPw || resetPw.length < 8) return err("Password must be at least 8 characters")
    setResetLoading(true)
    try {
      const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, password: resetPw }) })
      const data = await res.json()
      if (!res.ok) return err(data.error || "Failed to reset password")
      setResetId(null); setResetPw(""); ok("Password reset successfully")
    } finally { setResetLoading(false) }
  }

  async function deleteUser(id: string, email: string) {
    if (!confirm(`Permanently delete ${email}? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      const res = await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
      if (!res.ok) return err("Failed to delete user")
      setUsers(u => u.filter(x => x.id !== id))
      setStats(s => s ? { ...s, totalUsers: s.totalUsers - 1 } : s)
      ok("User deleted")
    } finally { setDeletingId(null) }
  }

  async function revokeUserSessions(userId: string, email: string) {
    if (!confirm(`Revoke all sessions for ${email}?`)) return
    const res = await fetch("/api/admin/sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) })
    if (!res.ok) return err("Failed to revoke sessions")
    setUsers(u => u.map(x => x.id === userId ? { ...x, sessions: [], _count: { ...x._count, sessions: 0 } } : x))
    setSessions(s => s.filter(x => x.userId !== userId))
    ok("Sessions revoked")
  }

  async function revokeSession(id: string) {
    setRevokingSession(id)
    try {
      const res = await fetch("/api/admin/sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
      if (!res.ok) return err("Failed to revoke session")
      setSessions(s => s.filter(x => x.id !== id))
      ok("Session revoked")
    } finally { setRevokingSession(null) }
  }

  async function inviteUser() {
    if (!inviteEmail || !invitePw) return err("Email and password required")
    setInviteLoading(true)
    try {
      const res = await fetch("/api/admin/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: inviteName, email: inviteEmail, password: invitePw }) })
      const data = await res.json()
      if (!res.ok) return err(data.error || "Failed to create user")
      setShowInvite(false); setInviteName(""); setInviteEmail(""); setInvitePw("")
      ok(`User ${data.email} created`)
      setStats(s => s ? { ...s, totalUsers: s.totalUsers + 1, recentUsers: s.recentUsers + 1 } : s)
      if (tab === "users") loadUsers()
    } finally { setInviteLoading(false) }
  }

  function exportCSV() {
    const rows = [["ID", "Name", "Email", "Providers", "Joined", "Sessions"]]
    users.forEach(u => rows.push([u.id, u.name || "", u.email, u.accounts.map(a => a.provider).join("|"), fmtDate(u.createdAt), String(u._count.sessions)]))
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n")
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = "m-ops-users.csv"; a.click()
  }

  const filtered = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()) || (u.name || "").toLowerCase().includes(search.toLowerCase()))
  const activeSessions = sessions.filter(s => new Date(s.expires) > new Date())
  const githubUsers = users.filter(u => u.accounts.some(a => a.provider === "github")).length
  const pwUsers = users.filter(u => !u.accounts.some(a => a.provider === "github")).length

  const NavTab = ({ id, icon, label, count }: { id: Tab; icon: React.ReactNode; label: string; count?: number }) => (
    <button onClick={() => setTab(id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, fontSize: 12.5, fontWeight: tab === id ? 600 : 400, color: tab === id ? "#e8e8e8" : "#444", background: tab === id ? "#1a1a1a" : "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left", marginBottom: 2 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>{icon}{label}</span>
      {count !== undefined && <span style={{ fontSize: 11, background: "#1e1e1e", color: "#555", padding: "1px 6px", borderRadius: 4 }}>{count}</span>}
    </button>
  )

  const StatCard = ({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: string }) => (
    <div style={{ background: "#111", border: "1px solid #1c1c1c", borderRadius: 12, padding: "20px 22px" }}>
      <p style={{ fontSize: 11, color: "#444", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: accent ?? "#fff", letterSpacing: "-0.04em", marginBottom: 4 }}>{value}</p>
      {sub && <p style={{ fontSize: 11.5, color: "#333" }}>{sub}</p>}
    </div>
  )

  if (status === "loading" || !isAdmin) return (
    <div style={{ minHeight: "100vh", background: "#090909", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 20, height: 20, border: "2px solid #222", borderTopColor: "#555", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#090909", color: "#e8e8e8" }}>
      {/* Nav */}
      <nav style={{ height: 52, borderBottom: "1px solid #181818", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", background: "#090909", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 6, color: "#444", fontSize: 12, textDecoration: "none" }}>
            <ArrowLeft01Icon size={14} /> Dashboard
          </Link>
          <span style={{ color: "#222" }}>·</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Shield01Icon size={13} color="#7c3aed" />
            <span style={{ color: "#fff", fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.02em" }}>Admin</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {session?.user?.image
            ? <img src={session.user.image} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />
            : <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>{(session?.user?.email || "A")[0].toUpperCase()}</div>}
          <span style={{ fontSize: 12, color: "#444" }}>{session?.user?.email}</span>
        </div>
      </nav>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "40px 28px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", marginBottom: 4 }}>Admin</h1>
        <p style={{ fontSize: 13, color: "#444", marginBottom: 32 }}>Manage users, sessions, and system health.</p>

        <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          {/* Sidebar */}
          <div style={{ width: 160, flexShrink: 0 }}>
            <NavTab id="overview" icon={<DashboardCircleIcon size={14} />} label="Overview" />
            <NavTab id="users" icon={<UserMultipleIcon size={14} />} label="Users" count={stats?.totalUsers} />
            <NavTab id="sessions" icon={<Time01Icon size={14} />} label="Sessions" count={activeSessions.length || undefined} />
            <div style={{ height: 1, background: "#181818", margin: "10px 0" }} />
            <button onClick={() => setShowInvite(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, fontSize: 12.5, color: "#7c3aed", background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}>
              <UserAdd01Icon size={14} /> Invite user
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* ── OVERVIEW ── */}
            {tab === "overview" && (
              <>
                {loadingStats ? <p style={{ color: "#333", fontSize: 13 }}>Loading…</p> : stats ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                      <StatCard label="Total users" value={stats.totalUsers} sub="all time" />
                      <StatCard label="New this week" value={stats.recentUsers} sub="last 7 days" accent="#a78bfa" />
                      <StatCard label="Active sessions" value={stats.totalSessions} sub="in database" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                      <div style={{ background: "#111", border: "1px solid #1c1c1c", borderRadius: 12, padding: "20px 22px" }}>
                        <p style={{ fontSize: 11, color: "#444", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.07em" }}>Auth breakdown</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {[["GitHub OAuth", githubUsers, "#e8e8e8"], ["Password", pwUsers, "#555"]].map(([label, count, color]) => (
                            <div key={String(label)}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: 12, color: "#555" }}>{label}</span>
                                <span style={{ fontSize: 12, color: String(color) }}>{count} user{Number(count) !== 1 ? "s" : ""}</span>
                              </div>
                              <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${stats.totalUsers ? (Number(count) / stats.totalUsers) * 100 : 0}%`, background: String(color), borderRadius: 2, transition: "width 0.5s" }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ background: "#111", border: "1px solid #1c1c1c", borderRadius: 12, padding: "20px 22px" }}>
                        <p style={{ fontSize: 11, color: "#444", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.07em" }}>OAuth accounts</p>
                        <p style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.04em", marginBottom: 4 }}>{stats.totalAccounts}</p>
                        <p style={{ fontSize: 11.5, color: "#333" }}>linked providers</p>
                      </div>
                    </div>

                    {/* Recent signups */}
                    {users.length > 0 && (
                      <div style={{ background: "#111", border: "1px solid #1c1c1c", borderRadius: 12, padding: "20px 22px", marginBottom: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#e8e8e8", marginBottom: 14 }}>Recent sign-ups</p>
                        {users.slice(0, 5).map((u, i) => (
                          <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, marginBottom: i < Math.min(users.length, 5) - 1 ? 10 : 0, borderBottom: i < Math.min(users.length, 5) - 1 ? "1px solid #161616" : "none" }}>
                            {u.image
                              ? <img src={u.image} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                              : <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1e1e1e", display: "flex", alignItems: "center", justifyContent: "center" }}><UserIcon size={12} color="#444" /></div>}
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 12.5, color: "#e8e8e8" }}>{u.name || u.email}</p>
                              {u.name && <p style={{ fontSize: 11.5, color: "#444" }}>{u.email}</p>}
                            </div>
                            <span style={{ fontSize: 11, color: "#333" }}>{timeAgo(u.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ background: "#111", border: "1px solid #1c1c1c", borderRadius: 12, padding: "20px 22px" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#e8e8e8", marginBottom: 14 }}>System info</p>
                      {[["Database", "SQLite · better-sqlite3"], ["Auth", "NextAuth.js v5 beta"], ["Providers", "GitHub OAuth · Credentials"], ["Environment", "development"]].map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #161616" }}>
                          <span style={{ fontSize: 12.5, color: "#555" }}>{k}</span>
                          <span style={{ fontSize: 12.5, color: "#e8e8e8", fontFamily: "monospace" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </>
            )}

            {/* ── USERS ── */}
            {tab === "users" && (
              <>
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…"
                    style={{ flex: 1, background: "#111", border: "1px solid #1c1c1c", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#e8e8e8", outline: "none" }}
                    onFocus={e => e.currentTarget.style.borderColor = "#333"} onBlur={e => e.currentTarget.style.borderColor = "#1c1c1c"} />
                  <button onClick={exportCSV} style={{ ...btnGhost, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
                    <ArrowDown01Icon size={13} /> Export CSV
                  </button>
                  <button onClick={() => setShowInvite(true)} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                    <AddSquareIcon size={13} /> New user
                  </button>
                </div>

                {loadingUsers ? <p style={{ color: "#333", fontSize: 13 }}>Loading…</p> : (
                  <div style={{ background: "#111", border: "1px solid #1c1c1c", borderRadius: 12, overflow: "hidden" }}>
                    {filtered.length === 0
                      ? <p style={{ padding: 40, textAlign: "center", color: "#333", fontSize: 13 }}>No users found</p>
                      : filtered.map((u, i) => {
                        const isSelf = u.email === session?.user?.email
                        const isExpanded = expandedId === u.id
                        const isEditing = editingId === u.id
                        const isResetting = resetId === u.id
                        const providers = u.accounts.map(a => a.provider)

                        return (
                          <div key={u.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #161616" : "none" }}>
                            {/* Row */}
                            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", cursor: "pointer" }} onClick={() => setExpandedId(isExpanded ? null : u.id)}>
                              {u.image
                                ? <img src={u.image} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                                : <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1e1e1e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><UserIcon size={14} color="#444" /></div>}

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 13, fontWeight: 500, color: "#e8e8e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || "—"}</span>
                                  {isSelf && <span style={{ fontSize: 10, background: "#1a1a2e", color: "#7c3aed", padding: "1px 6px", borderRadius: 4, border: "1px solid #2a1a4a", flexShrink: 0 }}>you</span>}
                                </div>
                                <span style={{ fontSize: 11.5, color: "#444", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{u.email}</span>
                              </div>

                              <div style={{ display: "flex", gap: 4 }}>
                                {providers.includes("github") && <span style={{ fontSize: 10.5, background: "#161616", color: "#555", padding: "2px 7px", borderRadius: 5, border: "1px solid #1e1e1e" }}>github</span>}
                                {(!providers.length || providers.includes("credentials")) && <span style={{ fontSize: 10.5, background: "#161616", color: "#555", padding: "2px 7px", borderRadius: 5, border: "1px solid #1e1e1e" }}>pw</span>}
                              </div>

                              <PlanBadge plan={u.plan || "free"} />

                              <span style={{ fontSize: 11, color: "#333", whiteSpace: "nowrap" }}>{u._count.projects ?? 0} proj</span>

                              <span style={{ fontSize: 11, color: "#2a2a2a", whiteSpace: "nowrap" }}>{fmtDate(u.createdAt)}</span>

                              {u._count.sessions > 0 && (
                                <span style={{ fontSize: 10.5, background: "#0d1a0d", color: "#4ade80", padding: "2px 7px", borderRadius: 5, border: "1px solid #1a3a1a", whiteSpace: "nowrap" }}>{u._count.sessions} session{u._count.sessions !== 1 ? "s" : ""}</span>
                              )}

                              <span style={{ color: "#333", fontSize: 12 }}>{isExpanded ? "▲" : "▼"}</span>
                            </div>

                            {/* Expanded panel */}
                            {isExpanded && (
                              <div style={{ background: "#0d0d0d", borderTop: "1px solid #161616", padding: "18px 18px 18px 62px" }}>
                                {isEditing ? (
                                  <div style={{ maxWidth: 360 }}>
                                    <label style={labelStyle}>Display name</label>
                                    <input style={inputStyle} value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name" />
                                    <label style={labelStyle}>Email</label>
                                    <input style={inputStyle} value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email" type="email" />
                                    <label style={labelStyle}>Plan</label>
                                    <select
                                      value={editPlan}
                                      onChange={e => setEditPlan(e.target.value)}
                                      style={{ ...inputStyle, cursor: "pointer", appearance: "none" as const }}
                                    >
                                      <option value="free">Free</option>
                                      <option value="pro">Pro ($2/mo)</option>
                                      <option value="team">Team ($5/mo)</option>
                                    </select>
                                    <div style={{ display: "flex", gap: 8 }}>
                                      <button onClick={() => saveEdit(u.id)} disabled={editLoading} style={btnPrimary}>{editLoading ? "Saving…" : "Save"}</button>
                                      <button onClick={() => setEditingId(null)} style={btnGhost}>Cancel</button>
                                    </div>
                                  </div>
                                ) : isResetting ? (
                                  <div style={{ maxWidth: 320 }}>
                                    <label style={labelStyle}>New password</label>
                                    <input style={inputStyle} type="password" value={resetPw} onChange={e => setResetPw(e.target.value)} placeholder="Min. 8 characters" />
                                    <div style={{ display: "flex", gap: 8 }}>
                                      <button onClick={() => resetPassword(u.id)} disabled={resetLoading} style={btnPrimary}>{resetLoading ? "Resetting…" : "Set password"}</button>
                                      <button onClick={() => { setResetId(null); setResetPw("") }} style={btnGhost}>Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px", marginBottom: 16 }}>
                                      {[["ID", u.id], ["Email verified", u.emailVerified ? fmtDate(u.emailVerified) : "Not verified"], ["Last updated", timeAgo(u.updatedAt)], ["OAuth accounts", String(u._count.accounts)]].map(([k, v]) => (
                                        <div key={k} style={{ paddingBottom: 8 }}>
                                          <p style={{ fontSize: 11, color: "#333", marginBottom: 2 }}>{k}</p>
                                          <p style={{ fontSize: 12.5, color: "#888", fontFamily: k === "ID" ? "monospace" : "inherit", fontSize: k === "ID" ? 10.5 : 12.5 } as React.CSSProperties}>{v}</p>
                                        </div>
                                      ))}
                                    </div>

                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                      <button onClick={() => { setEditingId(u.id); setEditName(u.name || ""); setEditEmail(u.email); setEditPlan(u.plan || "free") }} style={{ ...btnGhost, display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                                        <PencilEdit02Icon size={12} /> Edit profile
                                      </button>
                                      <button onClick={() => { setResetId(u.id); setResetPw("") }} style={{ ...btnGhost, display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                                        <LockPasswordIcon size={12} /> Reset password
                                      </button>
                                      {u._count.sessions > 0 && (
                                        <button onClick={() => revokeUserSessions(u.id, u.email)} style={{ ...btnGhost, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#fb923c", borderColor: "#2a1a0a" }}>
                                          <Cancel01Icon size={12} /> Revoke sessions ({u._count.sessions})
                                        </button>
                                      )}
                                      {!isSelf && (
                                        <button onClick={() => deleteUser(u.id, u.email)} disabled={!!deletingId} style={{ ...btnGhost, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#f87171", borderColor: "#2a1010" }}>
                                          <Delete02Icon size={12} /> {deletingId === u.id ? "Deleting…" : "Delete user"}
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                )}
                <p style={{ fontSize: 11.5, color: "#2a2a2a", marginTop: 12 }}>{filtered.length} of {users.length} user{users.length !== 1 ? "s" : ""}</p>
              </>
            )}

            {/* ── SESSIONS ── */}
            {tab === "sessions" && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: 13, color: "#e8e8e8" }}><span style={{ color: "#4ade80", fontWeight: 600 }}>{activeSessions.length}</span> active · <span style={{ color: "#333" }}>{sessions.length - activeSessions.length} expired</span></p>
                  </div>
                  <button onClick={loadSessions} style={{ ...btnGhost, fontSize: 12 }}>Refresh</button>
                </div>

                {loadingSessions ? <p style={{ color: "#333", fontSize: 13 }}>Loading…</p> : (
                  <div style={{ background: "#111", border: "1px solid #1c1c1c", borderRadius: 12, overflow: "hidden" }}>
                    {sessions.length === 0
                      ? <p style={{ padding: 40, textAlign: "center", color: "#333", fontSize: 13 }}>No sessions found</p>
                      : sessions.map((s, i) => {
                        const expired = new Date(s.expires) < new Date()
                        return (
                          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", borderBottom: i < sessions.length - 1 ? "1px solid #161616" : "none", opacity: expired ? 0.45 : 1 }}>
                            {s.user.image
                              ? <img src={s.user.image} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                              : <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1e1e1e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><UserIcon size={12} color="#444" /></div>}

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 12.5, color: "#e8e8e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.user.name || s.user.email}</p>
                              <p style={{ fontSize: 11, color: "#333", fontFamily: "monospace" }}>{s.id.slice(0, 20)}…</p>
                            </div>

                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <p style={{ fontSize: 11.5, color: expired ? "#555" : "#4ade80" }}>{expired ? "Expired" : "Active"}</p>
                              <p style={{ fontSize: 11, color: "#333" }}>expires {fmtDate(s.expires)}</p>
                            </div>

                            {!expired && (
                              <button onClick={() => revokeSession(s.id)} disabled={revokingSession === s.id} style={{ background: "none", border: "none", cursor: "pointer", color: "#333", padding: 4 }}
                                onMouseEnter={e => e.currentTarget.style.color = "#f87171"} onMouseLeave={e => e.currentTarget.style.color = "#333"}>
                                <Cancel01Icon size={14} />
                              </button>
                            )}
                          </div>
                        )
                      })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <Modal title="Create user" onClose={() => setShowInvite(false)}>
          <label style={labelStyle}>Name (optional)</label>
          <input style={inputStyle} value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Full name" />
          <label style={labelStyle}>Email *</label>
          <input style={inputStyle} type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="user@example.com" />
          <label style={labelStyle}>Password *</label>
          <input style={inputStyle} type="password" value={invitePw} onChange={e => setInvitePw(e.target.value)} placeholder="Min. 8 characters" />
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button onClick={inviteUser} disabled={inviteLoading} style={btnPrimary}>{inviteLoading ? "Creating…" : "Create user"}</button>
            <button onClick={() => setShowInvite(false)} style={btnGhost}>Cancel</button>
          </div>
        </Modal>
      )}

      {toast && <Toast type={toast.type} msg={toast.msg} onClose={() => setToast(null)} />}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
