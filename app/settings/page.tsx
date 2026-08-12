"use client"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  UserIcon,
  LockPasswordIcon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Cancel01Icon,
  Notification01Icon,
  CreditCardIcon,
  Mail01Icon,
  SlackIcon,
  UserGroupIcon,
  Clock01Icon,
  BarChartIcon,
  Delete02Icon,
  AddCircleIcon,
} from "hugeicons-react"

type Tab = "profile" | "security" | "notifications" | "alerts" | "billing" | "team" | "support"

const S = {
  page: { minHeight: "100vh", background: "#090909", color: "#e8e8e8", fontFamily: "inherit" } as React.CSSProperties,
  nav: { height: "52px", borderBottom: "1px solid #181818", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", background: "#090909" } as React.CSSProperties,
  navLogo: { color: "#fff", fontSize: "13.5px", fontWeight: 600, letterSpacing: "-0.02em" } as React.CSSProperties,
  container: { maxWidth: "780px", margin: "0 auto", padding: "40px 28px" } as React.CSSProperties,
  heading: { fontSize: "20px", fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", marginBottom: "4px" } as React.CSSProperties,
  subheading: { fontSize: "13px", color: "#444", marginBottom: "32px" } as React.CSSProperties,
  layout: { display: "flex", gap: "32px", alignItems: "flex-start" } as React.CSSProperties,
  sidebar: { width: "160px", flexShrink: 0 } as React.CSSProperties,
  content: { flex: 1, minWidth: 0 } as React.CSSProperties,
  // mobile overrides handled via <style> tag

  card: { background: "#111", border: "1px solid #1c1c1c", borderRadius: "12px", padding: "24px", marginBottom: "16px" } as React.CSSProperties,
  cardTitle: { fontSize: "13px", fontWeight: 600, color: "#e8e8e8", marginBottom: "4px" } as React.CSSProperties,
  cardDesc: { fontSize: "12px", color: "#444", marginBottom: "20px" } as React.CSSProperties,
  label: { display: "block", fontSize: "11.5px", fontWeight: 500, color: "#555", marginBottom: "6px" } as React.CSSProperties,
  input: { width: "100%", background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "9px 12px", fontSize: "13px", color: "#e8e8e8", outline: "none", boxSizing: "border-box" } as React.CSSProperties,
  row: { marginBottom: "16px" } as React.CSSProperties,
  btn: { padding: "8px 16px", borderRadius: "8px", fontSize: "12.5px", fontWeight: 600, border: "none", cursor: "pointer" } as React.CSSProperties,
  divider: { height: "1px", background: "#181818", margin: "20px 0" } as React.CSSProperties,
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px",
      borderRadius: "8px", fontSize: "12.5px", fontWeight: active ? 600 : 400,
      color: active ? "#e8e8e8" : "#444", background: active ? "#1a1a1a" : "transparent",
      border: "none", cursor: "pointer", textAlign: "left", marginBottom: "2px",
    }}>
      {icon}{label}
    </button>
  )
}

function Toast({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
      display: "flex", alignItems: "center", gap: "10px",
      padding: "12px 16px", borderRadius: "10px", fontSize: "13px",
      background: type === "success" ? "#0d1f14" : "#1f0d0d",
      border: `1px solid ${type === "success" ? "#1a4028" : "#401a1a"}`,
      color: type === "success" ? "#4ade80" : "#f87171",
    }}>
      {type === "success" ? <CheckmarkCircle02Icon size={15} /> : <AlertCircleIcon size={15} />}
      {message}
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", marginLeft: "4px", padding: 0 }}>
        <Cancel01Icon size={13} />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("profile")
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // Profile fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [profileLoading, setProfileLoading] = useState(false)

  // Password fields
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [pwLoading, setPwLoading] = useState(false)

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Notifications
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifyIncidents, setNotifyIncidents] = useState(true)
  const [notifyWeekly, setNotifyWeekly] = useState(false)
  const [notifySaving, setNotifySaving] = useState(false)

  // Billing
  const [plan, setPlan] = useState("free")
  const [billingLoading, setBillingLoading] = useState<string | null>(null)

  // Alerts
  const [slackConnected, setSlackConnected] = useState(false)
  const [slackChannel, setSlackChannel] = useState("")
  const [slackTeam, setSlackTeam] = useState("")
  const [slackDisconnecting, setSlackDisconnecting] = useState(false)
  const [pagerdutyKey, setPagerdutyKey] = useState("")
  const [pdSaving, setPdSaving] = useState(false)
  const [customInterval, setCustomInterval] = useState<number | "">(30)
  const [intervalSaving, setIntervalSaving] = useState(false)

  // Team
  const [teamMembers, setTeamMembers] = useState<{ id: string; email: string; name?: string; status: string }[]>([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [teamLoading, setTeamLoading] = useState(false)

  // Support calls
  const [supportCalls, setSupportCalls] = useState<{ id: string; topic: string; description?: string; preferredAt: string; status: string }[]>([])
  const [callTopic, setCallTopic] = useState("")
  const [callDesc, setCallDesc] = useState("")
  const [callDate, setCallDate] = useState("")
  const [callTime, setCallTime] = useState("10:00")
  const [callLoading, setCallLoading] = useState(false)

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "")
      setEmail(session.user.email || "")
    }
  }, [session])

  useEffect(() => {
    fetch("/api/user/notifications").then(r => r.json()).then(d => {
      if (d.notifyEmail !== undefined) setNotifyEmail(d.notifyEmail)
      if (d.notifyIncidents !== undefined) setNotifyIncidents(d.notifyIncidents)
      if (d.notifyWeeklyReport !== undefined) setNotifyWeekly(d.notifyWeeklyReport)
    })
    fetch("/api/user/plan").then(r => r.json()).then(d => {
      if (d.plan) setPlan(d.plan)
    })
    fetch("/api/user/alerts").then(r => r.json()).then(d => {
      if (d.slackWebhookUrl) { setSlackConnected(true); setSlackChannel(d.slackChannelName ?? ""); setSlackTeam(d.slackTeamName ?? "") }
      if (d.pagerdutyKey) setPagerdutyKey(d.pagerdutyKey)
      if (d.customIntervalSec) setCustomInterval(d.customIntervalSec)
    }).catch(() => {})
    // Handle redirect params
    const params = new URLSearchParams(window.location.search)
    if (params.get("slack") === "connected") { setSlackConnected(true); showToast("success", "Slack connected!"); window.history.replaceState({}, "", "/settings?tab=alerts") }
    if (params.get("slack") === "error") { showToast("error", "Slack connection failed. Try again."); window.history.replaceState({}, "", "/settings?tab=alerts") }
    if (params.get("plan") === "upgraded") {
      setTab("billing")
      // Re-fetch plan so UI reflects the new tier immediately
      fetch("/api/user/plan").then(r => r.json()).then(d => { if (d.plan) setPlan(d.plan) })
      showToast("success", "🎉 Plan upgraded successfully! Welcome to the next tier.")
      window.history.replaceState({}, "", "/settings?tab=billing")
    }
    if (params.get("plan") === "cancelled") {
      setTab("billing")
      showToast("error", "Checkout cancelled — no charge was made.")
      window.history.replaceState({}, "", "/settings?tab=billing")
    }
    if (params.get("tab")) setTab(params.get("tab") as Tab)
    fetch("/api/team").then(r => r.json()).then(d => { if (Array.isArray(d)) setTeamMembers(d) }).catch(() => {})
    fetch("/api/support/book").then(r => r.json()).then(d => { if (Array.isArray(d)) setSupportCalls(d) }).catch(() => {})
  }, [])

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message })
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileLoading(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      })
      const data = await res.json()
      if (!res.ok) return showToast("error", data.error || "Failed to update profile")
      await update({ name: data.name, email: data.email })
      showToast("success", "Profile updated successfully")
    } finally { setProfileLoading(false) }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) return showToast("error", "New passwords don't match")
    if (newPw.length < 8) return showToast("error", "Password must be at least 8 characters")
    setPwLoading(true)
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const data = await res.json()
      if (!res.ok) return showToast("error", data.error || "Failed to change password")
      setCurrentPw(""); setNewPw(""); setConfirmPw("")
      showToast("success", "Password changed successfully")
    } finally { setPwLoading(false) }
  }

  async function saveNotifications() {
    setNotifySaving(true)
    try {
      await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifyEmail, notifyIncidents, notifyWeeklyReport: notifyWeekly }),
      })
      showToast("success", "Notification preferences saved")
    } finally { setNotifySaving(false) }
  }

  async function startCheckout(planName: string) {
    setBillingLoading(planName)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planName }),
      })
      const data = await res.json()
      if (!res.ok) { showToast("error", data.error || "Failed to start checkout"); return }
      window.location.href = data.url
    } finally { setBillingLoading(null) }
  }

  async function disconnectSlack() {
    setSlackDisconnecting(true)
    try {
      await fetch("/api/auth/slack/disconnect", { method: "POST" })
      setSlackConnected(false); setSlackChannel(""); setSlackTeam("")
      showToast("success", "Slack disconnected")
    } finally { setSlackDisconnecting(false) }
  }

  async function savePagerduty() {
    setPdSaving(true)
    try {
      await fetch("/api/user/alerts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pagerdutyKey: pagerdutyKey || null }) })
      showToast("success", pagerdutyKey ? "PagerDuty key saved" : "PagerDuty disconnected")
    } finally { setPdSaving(false) }
  }

  async function saveInterval() {
    setIntervalSaving(true)
    try {
      await fetch("/api/user/alerts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customIntervalSec: customInterval !== "" ? Number(customInterval) : null }) })
      showToast("success", "Check interval updated")
    } finally { setIntervalSaving(false) }
  }

  async function inviteMember() {
    if (!inviteEmail) return
    setTeamLoading(true)
    try {
      const res = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: inviteEmail, name: inviteName }) })
      const d = await res.json()
      if (!res.ok) return showToast("error", d.message || d.error || "Failed to invite")
      setTeamMembers(prev => [...prev, d])
      setInviteEmail(""); setInviteName("")
      showToast("success", `${inviteEmail} invited`)
    } finally { setTeamLoading(false) }
  }

  async function removeMember(id: string) {
    await fetch("/api/team", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    setTeamMembers(prev => prev.filter(m => m.id !== id))
  }

  async function bookCall() {
    if (!callTopic) return
    setCallLoading(true)
    try {
      const preferredAt = callDate ? new Date(`${callDate}T${callTime}`).toISOString() : new Date().toISOString()
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const res = await fetch("/api/support/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: callTopic, description: callDesc, preferredAt, timezone }),
      })
      const d = await res.json()
      if (!res.ok) return showToast("error", d.message || d.error || "Failed")
      setSupportCalls(prev => [...prev, d])

      // Open Google Calendar to schedule with both parties + Meet
      const start = callDate ? `${callDate.replace(/-/g, "")}T${callTime.replace(":", "")}00` : ""
      const title = encodeURIComponent(`m-ops Support Call: ${callTopic}`)
      const details = encodeURIComponent(`Support call with m-ops.\n\n${callDesc || ""}`)
      const guests = encodeURIComponent("adejare.akolawole@gmail.com")
      const calUrl = start
        ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&add=${guests}&dates=${start}/${start}&crm=BUSY`
        : `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&add=${guests}&crm=BUSY`
      window.open(calUrl, "_blank")

      setCallTopic(""); setCallDesc(""); setCallDate(""); setCallTime("10:00")
      showToast("success", "Google Calendar opened — confirm the time and Google Meet is auto-added.")
    } finally { setCallLoading(false) }
  }

  async function cancelCall(id: string) {
    await fetch("/api/support/book", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    setSupportCalls(prev => prev.filter(c => c.id !== id))
    showToast("success", "Call request cancelled")
  }

  async function deleteAccount() {
    if (deleteConfirm !== "delete my account") return
    setDeleteLoading(true)
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" })
      if (!res.ok) return showToast("error", "Failed to delete account")
      await signOut({ callbackUrl: "/" })
    } finally { setDeleteLoading(false) }
  }

  const avatarLetter = (session?.user?.name || session?.user?.email || "U")[0].toUpperCase()

  return (
    <div style={S.page}>
      {/* Nav */}
      <nav style={S.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#444", fontSize: "12px", textDecoration: "none" }}>
            <ArrowLeft01Icon size={14} /> Dashboard
          </Link>
          <span style={{ color: "#222" }}>·</span>
          <span style={S.navLogo}>m-ops</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {session?.user?.image ? (
            <img src={session.user.image} alt="" style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: "#fff" }}>
              {avatarLetter}
            </div>
          )}
          <span style={{ fontSize: "12px", color: "#444" }}>{session?.user?.name || session?.user?.email}</span>
        </div>
      </nav>

      <style>{`
        @media (max-width: 640px) {
          .settings-layout { flex-direction: column !important; }
          .settings-sidebar { width: 100% !important; display: flex !important; flex-direction: row !important; overflow-x: auto !important; gap: 4px !important; padding-bottom: 8px; border-bottom: 1px solid #1c1c1c; margin-bottom: 8px; }
          .settings-sidebar button { flex-shrink: 0 !important; margin-bottom: 0 !important; }
          .settings-container { padding: 24px 16px !important; }
          .settings-card { padding: 16px !important; }
        }
      `}</style>
      <div style={S.container} className="settings-container">
        <h1 style={S.heading}>Settings</h1>
        <p style={S.subheading}>Manage your account preferences and security.</p>

        <div style={S.layout} className="settings-layout">
          {/* Sidebar tabs */}
          <div style={S.sidebar} className="settings-sidebar">
            <TabButton active={tab === "profile"} onClick={() => setTab("profile")} icon={<UserIcon size={14} />} label="Profile" />
            <TabButton active={tab === "security"} onClick={() => setTab("security")} icon={<LockPasswordIcon size={14} />} label="Security" />
            <TabButton active={tab === "notifications"} onClick={() => setTab("notifications")} icon={<Notification01Icon size={14} />} label="Notifications" />
            <TabButton active={tab === "alerts"} onClick={() => setTab("alerts")} icon={<Mail01Icon size={14} />} label="Alerts" />
            {(plan === "team") && <TabButton active={tab === "team"} onClick={() => setTab("team")} icon={<UserGroupIcon size={14} />} label="Team" />}
            {(plan === "team") && <TabButton active={tab === "support"} onClick={() => setTab("support")} icon={<Clock01Icon size={14} />} label="Book a call" />}
            <TabButton active={tab === "billing"} onClick={() => setTab("billing")} icon={<CreditCardIcon size={14} />} label="Billing" />
          </div>

          {/* Content */}
          <div style={S.content}>
            {tab === "profile" && (
              <>
                {/* Avatar */}
                <div style={S.card} className="settings-card">
                  <p style={S.cardTitle}>Profile picture</p>
                  <p style={S.cardDesc}>Your avatar is shown across m-ops.</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {session?.user?.image ? (
                      <img src={session.user.image} alt="" style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", border: "2px solid #1e1e1e" }} />
                    ) : (
                      <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 700, color: "#fff" }}>
                        {avatarLetter}
                      </div>
                    )}
                    <div>
                      <p style={{ fontSize: "12.5px", color: "#e8e8e8", marginBottom: "4px" }}>{session?.user?.name || "No name set"}</p>
                      <p style={{ fontSize: "11.5px", color: "#444" }}>
                        {session?.user?.image ? "Avatar synced from GitHub" : "Auto-generated from your name"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Name & Email */}
                <div style={S.card} className="settings-card">
                  <p style={S.cardTitle}>Personal information</p>
                  <p style={S.cardDesc}>Update your display name and email address.</p>
                  <form onSubmit={saveProfile}>
                    <div style={S.row}>
                      <label style={S.label}>Display name</label>
                      <input
                        style={S.input} type="text" value={name}
                        onChange={e => setName(e.target.value)} placeholder="Your name"
                        onFocus={e => e.currentTarget.style.borderColor = "#333"}
                        onBlur={e => e.currentTarget.style.borderColor = "#1e1e1e"}
                      />
                    </div>
                    <div style={S.row}>
                      <label style={S.label}>Email address</label>
                      <input
                        style={S.input} type="email" value={email}
                        onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                        onFocus={e => e.currentTarget.style.borderColor = "#333"}
                        onBlur={e => e.currentTarget.style.borderColor = "#1e1e1e"}
                      />
                    </div>
                    <button type="submit" disabled={profileLoading} style={{ ...S.btn, background: "#e8e8e8", color: "#000", opacity: profileLoading ? 0.6 : 1 }}>
                      {profileLoading ? "Saving…" : "Save changes"}
                    </button>
                  </form>
                </div>

                {/* Connected accounts */}
                <div style={S.card} className="settings-card">
                  <p style={S.cardTitle}>Connected accounts</p>
                  <p style={S.cardDesc}>Third-party sign-in methods linked to your account.</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#0f0f0f", borderRadius: "8px", border: "1px solid #1e1e1e" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#e8e8e8">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      <span style={{ fontSize: "12.5px", color: "#e8e8e8" }}>GitHub</span>
                    </div>
                    <span style={{ fontSize: "11.5px", color: session?.user?.image ? "#4ade80" : "#444" }}>
                      {session?.user?.image ? "Connected" : "Not connected"}
                    </span>
                  </div>
                </div>
              </>
            )}

            {tab === "security" && (
              <>
                {/* Change password */}
                <div style={S.card} className="settings-card">
                  <p style={S.cardTitle}>Change password</p>
                  <p style={S.cardDesc}>Choose a strong password of at least 8 characters.</p>
                  <form onSubmit={changePassword}>
                    <div style={S.row}>
                      <label style={S.label}>Current password</label>
                      <input
                        style={S.input} type="password" value={currentPw}
                        onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••"
                        onFocus={e => e.currentTarget.style.borderColor = "#333"}
                        onBlur={e => e.currentTarget.style.borderColor = "#1e1e1e"}
                      />
                    </div>
                    <div style={S.row}>
                      <label style={S.label}>New password</label>
                      <input
                        style={S.input} type="password" value={newPw}
                        onChange={e => setNewPw(e.target.value)} placeholder="••••••••"
                        onFocus={e => e.currentTarget.style.borderColor = "#333"}
                        onBlur={e => e.currentTarget.style.borderColor = "#1e1e1e"}
                      />
                    </div>
                    <div style={S.row}>
                      <label style={S.label}>Confirm new password</label>
                      <input
                        style={S.input} type="password" value={confirmPw}
                        onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••"
                        onFocus={e => e.currentTarget.style.borderColor = "#333"}
                        onBlur={e => e.currentTarget.style.borderColor = "#1e1e1e"}
                      />
                    </div>
                    <button type="submit" disabled={pwLoading} style={{ ...S.btn, background: "#e8e8e8", color: "#000", opacity: pwLoading ? 0.6 : 1 }}>
                      {pwLoading ? "Updating…" : "Update password"}
                    </button>
                  </form>
                </div>

                {/* Sessions */}
                <div style={S.card} className="settings-card">
                  <p style={S.cardTitle}>Active session</p>
                  <p style={S.cardDesc}>You are currently signed in on this device.</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: "12.5px", color: "#e8e8e8", marginBottom: "3px" }}>This browser</p>
                      <p style={{ fontSize: "11.5px", color: "#444" }}>Signed in as {session?.user?.email}</p>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      style={{ ...S.btn, background: "#1a1a1a", color: "#e8e8e8", border: "1px solid #2a2a2a", fontSize: "12px" }}
                    >
                      Sign out
                    </button>
                  </div>
                </div>

                {/* Danger zone */}
                <div style={{ ...S.card, border: "1px solid #2a1010" }}>
                  <p style={{ ...S.cardTitle, color: "#f87171" }}>Danger zone</p>
                  <p style={S.cardDesc}>Permanently delete your account and all associated data. This cannot be undone.</p>
                  <div style={S.row}>
                    <label style={S.label}>Type <span style={{ color: "#f87171", fontFamily: "monospace" }}>delete my account</span> to confirm</label>
                    <input
                      style={{ ...S.input, borderColor: deleteConfirm === "delete my account" ? "#7f1d1d" : "#1e1e1e" }}
                      type="text" value={deleteConfirm}
                      onChange={e => setDeleteConfirm(e.target.value)}
                      placeholder="delete my account"
                      onFocus={e => e.currentTarget.style.borderColor = "#7f1d1d"}
                      onBlur={e => e.currentTarget.style.borderColor = deleteConfirm === "delete my account" ? "#7f1d1d" : "#1e1e1e"}
                    />
                  </div>
                  <button
                    onClick={deleteAccount}
                    disabled={deleteConfirm !== "delete my account" || deleteLoading}
                    style={{ ...S.btn, background: deleteConfirm === "delete my account" ? "#7f1d1d" : "#1a1a1a", color: "#f87171", opacity: deleteLoading ? 0.6 : 1, cursor: deleteConfirm !== "delete my account" ? "not-allowed" : "pointer" }}
                  >
                    {deleteLoading ? "Deleting…" : "Delete account"}
                  </button>
                </div>
              </>
            )}

            {tab === "notifications" && (
              <div style={S.card} className="settings-card">
                <p style={S.cardTitle}>Notification preferences</p>
                <p style={S.cardDesc}>Choose what you get notified about. Email delivery requires a configured Resend API key.</p>
                {[
                  { label: "Email notifications", desc: "Receive notifications via email", value: notifyEmail, set: setNotifyEmail },
                  { label: "Incident alerts", desc: "Get alerted when a monitored service goes down", value: notifyIncidents, set: setNotifyIncidents },
                  { label: "Weekly summary", desc: "A weekly digest of your uptime and performance", value: notifyWeekly, set: setNotifyWeekly },
                ].map(({ label, desc, value, set }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #1a1a1a" }}>
                    <div>
                      <p style={{ color: "#e8e8e8", fontSize: "13px", fontWeight: 500, margin: "0 0 2px" }}>{label}</p>
                      <p style={{ color: "#444", fontSize: "12px", margin: 0 }}>{desc}</p>
                    </div>
                    <button
                      onClick={() => set(!value)}
                      style={{
                        width: "38px", height: "22px", borderRadius: "100px", border: "none", cursor: "pointer",
                        background: value ? "#6366f1" : "#222", transition: "background 0.2s", position: "relative", flexShrink: 0,
                      }}
                    >
                      <span style={{
                        position: "absolute", top: "3px", left: value ? "19px" : "3px",
                        width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "left 0.2s",
                      }} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={saveNotifications}
                  disabled={notifySaving}
                  style={{ ...S.btn, background: "#e8e8e8", color: "#000", marginTop: "20px", opacity: notifySaving ? 0.6 : 1 }}
                >
                  {notifySaving ? "Saving…" : "Save preferences"}
                </button>
              </div>
            )}

            {tab === "alerts" && (
              <>
                {/* Email */}
                <div style={S.card} className="settings-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={S.cardTitle}>Email</p>
                      <p style={{ ...S.cardDesc, margin: 0 }}>Sent to your account email on incidents.</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#888" }}>{session?.user?.email}</span>
                      <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#0d2a1a", color: "#4ade80", border: "1px solid #1a4a2a", fontWeight: 600 }}>Active</span>
                    </div>
                  </div>
                </div>

                {/* Slack */}
                <div style={S.card} className="settings-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <p style={{ ...S.cardTitle, margin: 0 }}>Slack</p>
                        {plan === "free" && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "#1e1b4b", color: "#a5b4fc", border: "1px solid #2a1a5e" }}>Pro+</span>}
                      </div>
                      <p style={{ ...S.cardDesc, margin: 0 }}>
                        {slackConnected
                          ? `Connected to ${slackChannel ? `#${slackChannel}` : "a channel"}${slackTeam ? ` in ${slackTeam}` : ""}`
                          : "Get incident alerts in any Slack channel."}
                      </p>
                    </div>
                    {plan === "free" ? (
                      <button onClick={() => setTab("billing")} style={{ ...S.btn, background: "#1e1b4b", color: "#a5b4fc", border: "1px solid #2a1a5e", fontSize: 12 }}>
                        Upgrade to connect
                      </button>
                    ) : slackConnected ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#0d2a1a", color: "#4ade80", border: "1px solid #1a4a2a", fontWeight: 600 }}>Connected</span>
                        <button onClick={disconnectSlack} disabled={slackDisconnecting} style={{ ...S.btn, background: "transparent", color: "#f87171", border: "1px solid #2a1010", fontSize: 12, padding: "6px 12px" }}>
                          {slackDisconnecting ? "…" : "Disconnect"}
                        </button>
                      </div>
                    ) : (
                      <a href="/api/auth/slack" style={{ ...S.btn, background: "#4a154b", color: "#fff", fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8 }}>
                        <svg width="16" height="16" viewBox="0 0 54 54" fill="none"><path d="M19.7 33.3a4.9 4.9 0 1 1-4.9-4.9H19.7v4.9z" fill="#E01E5A"/><path d="M22.2 33.3a4.9 4.9 0 0 1 9.8 0v12.3a4.9 4.9 0 1 1-9.8 0V33.3z" fill="#E01E5A"/><path d="M27.1 19.7a4.9 4.9 0 1 1 4.9-4.9v4.9H27.1z" fill="#36C5F0"/><path d="M27.1 22.2a4.9 4.9 0 0 1 0 9.8H14.8a4.9 4.9 0 1 1 0-9.8H27.1z" fill="#36C5F0"/><path d="M40.7 27.1a4.9 4.9 0 1 1-4.9 4.9V27.1h4.9z" fill="#2EB67D"/><path d="M38.2 27.1a4.9 4.9 0 0 1 0-9.8h12.3a4.9 4.9 0 1 1 0 9.8H38.2z" fill="#2EB67D"/><path d="M33.3 13.5a4.9 4.9 0 1 1 4.9 4.9H33.3V13.5z" fill="#ECB22E"/><path d="M33.3 16a4.9 4.9 0 0 1-9.8 0V3.7a4.9 4.9 0 1 1 9.8 0V16z" fill="#ECB22E"/></svg>
                        Add to Slack
                      </a>
                    )}
                  </div>
                </div>

                {/* PagerDuty */}
                <div style={S.card} className="settings-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <p style={{ ...S.cardTitle, margin: 0 }}>PagerDuty</p>
                    {plan === "free" && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "#1e1b4b", color: "#a5b4fc", border: "1px solid #2a1a5e" }}>Pro+</span>}
                  </div>
                  <p style={S.cardDesc}>Triggers and resolves PagerDuty incidents automatically.</p>
                  {plan === "free" ? (
                    <button onClick={() => setTab("billing")} style={{ ...S.btn, background: "#1e1b4b", color: "#a5b4fc", border: "1px solid #2a1a5e", fontSize: 12 }}>Upgrade to connect</button>
                  ) : (
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                      <div style={{ flex: 1 }}>
                        <label style={S.label}>Integration key (Events API v2)</label>
                        <input style={S.input} value={pagerdutyKey} onChange={e => setPagerdutyKey(e.target.value)} placeholder="Paste your routing key…" type="password" />
                      </div>
                      <button onClick={savePagerduty} disabled={pdSaving} style={{ ...S.btn, background: pagerdutyKey ? "#e8e8e8" : "#1a1a1a", color: pagerdutyKey ? "#000" : "#555", border: "1px solid #222", padding: "9px 16px", flexShrink: 0 }}>
                        {pdSaving ? "Saving…" : pagerdutyKey ? "Save" : "Remove"}
                      </button>
                    </div>
                  )}
                  {pagerdutyKey && plan !== "free" && (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#0d2a1a", color: "#4ade80", border: "1px solid #1a4a2a", fontWeight: 600 }}>Connected</span>
                      <span style={{ fontSize: 11.5, color: "#444" }}>Incidents will be triggered automatically</span>
                    </div>
                  )}
                </div>

                {/* Custom interval (Team) */}
                {plan === "team" && (
                  <div style={S.card} className="settings-card">
                    <p style={S.cardTitle}>Custom check interval</p>
                    <p style={S.cardDesc}>Override the default 30-second monitoring interval.</p>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input type="number" min={10} max={3600} style={{ ...S.input, width: 110 }} value={customInterval} onChange={e => setCustomInterval(e.target.value === "" ? "" : Number(e.target.value))} />
                      <span style={{ fontSize: 12, color: "#444" }}>seconds</span>
                      <button onClick={saveInterval} disabled={intervalSaving} style={{ ...S.btn, background: "#e8e8e8", color: "#000", marginLeft: "auto" }}>
                        {intervalSaving ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === "team" && (
              <>
                <div style={S.card} className="settings-card">
                  <p style={S.cardTitle}>Team seats</p>
                  <p style={S.cardDesc}>Team plan includes 5 seats. Invite members to share your workspace.</p>
                  <div style={{ marginBottom: 16 }}>
                    {teamMembers.length === 0 && <p style={{ fontSize: 12.5, color: "#333" }}>No members yet. Invite someone below.</p>}
                    {teamMembers.map(m => (
                      <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #161616" }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#666", fontWeight: 700, flexShrink: 0 }}>
                          {(m.name || m.email)[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 12.5, color: "#e8e8e8", margin: 0 }}>{m.name || m.email}</p>
                          {m.name && <p style={{ fontSize: 11.5, color: "#444", margin: 0 }}>{m.email}</p>}
                        </div>
                        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: m.status === "active" ? "#0d2a1a" : "#1a1a1a", color: m.status === "active" ? "#4ade80" : "#555", border: `1px solid ${m.status === "active" ? "#1a4a2a" : "#222"}` }}>{m.status}</span>
                        <button onClick={() => removeMember(m.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", padding: 4 }}><Delete02Icon size={13} /></button>
                      </div>
                    ))}
                  </div>
                  {teamMembers.length < 4 && (
                    <div style={{ background: "#0d0d0d", border: "1px solid #161616", borderRadius: 10, padding: 16 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 12 }}>Invite a member</p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <input style={{ ...S.input, flex: 1, minWidth: 140 }} value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Name (optional)" />
                        <input style={{ ...S.input, flex: 2, minWidth: 200 }} type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email address" />
                        <button onClick={inviteMember} disabled={teamLoading || !inviteEmail} style={{ ...S.btn, background: "#e8e8e8", color: "#000", display: "flex", alignItems: "center", gap: 6 }}>
                          <AddCircleIcon size={13} /> {teamLoading ? "Adding…" : "Invite"}
                        </button>
                      </div>
                    </div>
                  )}
                  {teamMembers.length >= 4 && (
                    <p style={{ fontSize: 12, color: "#444" }}>You've used all 5 team seats (you + 4 members).</p>
                  )}
                </div>
              </>
            )}

            {tab === "support" && (
              <>
                {/* Header */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#0d1a2e", border: "1px solid #1a3050", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="#60a5fa" strokeWidth="1.5"/><path d="M8 2v4M16 2v4M3 10h18" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#e8e8e8", margin: 0 }}>Book a support call</p>
                      <p style={{ fontSize: 12, color: "#444", margin: 0 }}>Google Meet · Dedicated support for Team plan</p>
                    </div>
                  </div>
                </div>

                {/* Book form */}
                <div style={S.card} className="settings-card">
                  <p style={S.cardTitle}>Request a call</p>
                  <p style={S.cardDesc}>Tell us what you need help with and pick a preferred time. We'll send a Google Meet link to your email.</p>

                  <div style={S.row}>
                    <label style={S.label}>What do you need help with?</label>
                    <select style={{ ...S.input, cursor: "pointer" }} value={callTopic} onChange={e => setCallTopic(e.target.value)}>
                      <option value="">Select a topic…</option>
                      <option value="Onboarding & setup">Onboarding & setup</option>
                      <option value="Monitoring configuration">Monitoring configuration</option>
                      <option value="Alert integrations (Slack, PagerDuty)">Alert integrations (Slack, PagerDuty)</option>
                      <option value="Incident review">Incident review</option>
                      <option value="SLA & reporting">SLA & reporting</option>
                      <option value="Billing & account">Billing & account</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div style={S.row}>
                    <label style={S.label}>Additional details (optional)</label>
                    <textarea
                      style={{ ...S.input, height: 80, resize: "vertical" as const, lineHeight: 1.5 }}
                      value={callDesc}
                      onChange={e => setCallDesc(e.target.value)}
                      placeholder="Describe what you're running into…"
                    />
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <label style={S.label}>Preferred date</label>
                      <input type="date" style={S.input} value={callDate} min={new Date().toISOString().split("T")[0]} onChange={e => setCallDate(e.target.value)} />
                    </div>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <label style={S.label}>Preferred time</label>
                      <input type="time" style={S.input} value={callTime} onChange={e => setCallTime(e.target.value)} />
                    </div>
                  </div>

                  <button
                    onClick={bookCall}
                    disabled={callLoading || !callTopic}
                    style={{ ...S.btn, background: callTopic ? "#1a73e8" : "#1a1a1a", color: callTopic ? "#fff" : "#444", border: "none", display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: callTopic ? "pointer" : "not-allowed" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 4H5a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-9 11H7V9h3v6zm5 0h-3V9h3v6z" fill="currentColor"/></svg>
                    {callLoading ? "Opening Calendar…" : "Schedule on Google Calendar"}
                  </button>
                  <p style={{ fontSize: 11.5, color: "#444", marginTop: 10 }}>Opens Google Meet instantly — share the link with us in the chat below.</p>
                </div>

                {/* Upcoming calls */}
                {supportCalls.length > 0 && (
                  <div style={S.card} className="settings-card">
                    <p style={S.cardTitle}>Your requests</p>
                    {supportCalls.map(c => {
                      const dt = new Date(c.preferredAt)
                      const isPast = dt < new Date()
                      return (
                        <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #161616" }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: "#0d0d0d", border: "1px solid #1c1c1c", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: 9, color: "#555", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{dt.toLocaleString("en", { month: "short" })}</span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#e8e8e8", lineHeight: 1 }}>{dt.getDate()}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 12.5, fontWeight: 600, color: "#e8e8e8", margin: 0 }}>{c.topic}</p>
                            <p style={{ fontSize: 11.5, color: "#444", margin: 0 }}>{dt.toLocaleString("en", { hour: "2-digit", minute: "2-digit", weekday: "short" })}</p>
                          </div>
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600,
                            background: c.status === "confirmed" ? "#0d2a1a" : isPast ? "#1a1a1a" : "#1a1a0d",
                            color: c.status === "confirmed" ? "#4ade80" : isPast ? "#444" : "#fbbf24",
                            border: `1px solid ${c.status === "confirmed" ? "#1a4a2a" : isPast ? "#222" : "#3a3000"}`,
                          }}>{c.status === "confirmed" ? "Confirmed" : isPast ? "Past" : "Pending"}</span>
                          {!isPast && c.status !== "confirmed" && (
                            <button onClick={() => cancelCall(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: 4, fontSize: 11 }}>Cancel</button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                <div style={{ padding: "12px 0", fontSize: 12, color: "#333", display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#444" strokeWidth="1.5"/><path d="M12 8v4l3 3" stroke="#444" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  We typically confirm within a few hours and send a Google Meet link to your account email.
                </div>
              </>
            )}

            {tab === "billing" && (
              <>
                {/* Current plan banner */}
                <div style={{ ...S.card, background: plan === "free" ? "#111" : plan === "pro" ? "#0e0e1e" : "#0a1a12", border: `1px solid ${plan === "free" ? "#1e1e1e" : plan === "pro" ? "#2a2a5e" : "#1a3a24"}` }} className="settings-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em",
                          background: plan === "free" ? "#1a1a1a" : plan === "pro" ? "#1e1b4b" : "#0d2a1a",
                          color: plan === "free" ? "#555" : plan === "pro" ? "#a5b4fc" : "#4ade80",
                          border: `1px solid ${plan === "free" ? "#282828" : plan === "pro" ? "#312e81" : "#1a4a2a"}`,
                        }}>{plan.toUpperCase()}</span>
                        <span style={{ color: "#888", fontSize: "12px" }}>Current plan</span>
                      </div>
                      <p style={{ color: "#e8e8e8", fontSize: "14px", fontWeight: 600, margin: "0 0 4px" }}>
                        {plan === "free" ? "Free" : plan === "pro" ? "Pro — $2/month" : "Team — $5/month"}
                      </p>
                      <p style={{ color: "#555", fontSize: "12px", margin: 0 }}>
                        {plan === "free" ? "3 projects · 5-min check intervals · Email alerts only" :
                         plan === "pro" ? "Unlimited projects · 30-sec intervals · AI analysis · Slack alerts" :
                         "Everything in Pro · 5 team seats · SLA reports · Dedicated support"}
                      </p>
                    </div>
                    {plan !== "free" && (
                      <button
                        onClick={async () => {
                          if (!confirm("Cancel your subscription? You'll be downgraded to the free plan immediately.")) return
                          try {
                            const r = await fetch("/api/billing/cancel", { method: "POST" })
                            if (!r.ok) throw new Error((await r.json()).error || "Failed")
                            setPlan("free")
                            setToast({ type: "success", message: "Subscription cancelled. You're now on the free plan." })
                          } catch (e: unknown) {
                            setToast({ type: "error", message: e instanceof Error ? e.message : "Failed to cancel" })
                          }
                        }}
                        style={{ ...S.btn, background: "#1a1a1a", color: "#555", border: "1px solid #222", fontSize: 12 }}
                      >
                        Cancel subscription
                      </button>
                    )}
                  </div>
                </div>

                {/* Feature comparison table */}
                <div style={S.card} className="settings-card">
                  <p style={{ ...S.cardTitle, marginBottom: 4 }}>Compare plans</p>
                  <p style={{ ...S.cardDesc, marginBottom: 20 }}>Everything included at each tier.</p>
                  <div style={{ overflowX: "auto" as const }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left" as const, padding: "8px 12px 8px 0", color: "#444", fontWeight: 600, borderBottom: "1px solid #1e1e1e", width: "40%" }}>Feature</th>
                          {(["free", "pro", "team"] as const).map(p => (
                            <th key={p} style={{ textAlign: "center" as const, padding: "8px 12px", color: plan === p ? "#e8e8e8" : "#444", fontWeight: 700, borderBottom: "1px solid #1e1e1e", background: plan === p ? "#161616" : "transparent", borderRadius: plan === p ? "6px 6px 0 0" : 0 }}>
                              {p.toUpperCase()}
                              {plan === p && <span style={{ display: "block", fontSize: 9, fontWeight: 500, color: "#555", marginTop: 2 }}>current</span>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: "Price", free: "Free", pro: "$2/mo", team: "$5/mo" },
                          { label: "Projects", free: "3 max", pro: "Unlimited", team: "Unlimited" },
                          { label: "Check interval", free: "5 minutes", pro: "30 seconds", team: "30 seconds" },
                          { label: "Uptime history", free: "7 days", pro: "90 days", team: "90 days" },
                          { label: "Email alerts", free: "✓", pro: "✓", team: "✓" },
                          { label: "Slack alerts", free: "—", pro: "✓", team: "✓" },
                          { label: "PagerDuty", free: "—", pro: "✓", team: "✓" },
                          { label: "AI root cause analysis", free: "—", pro: "✓", team: "✓" },
                          { label: "Code insights", free: "—", pro: "✓", team: "✓" },
                          { label: "Team seats", free: "1", pro: "1", team: "5" },
                          { label: "SLA reports", free: "—", pro: "—", team: "✓" },
                          { label: "Support call scheduling", free: "—", pro: "—", team: "✓" },
                        ].map((row, i) => (
                          <tr key={row.label} style={{ background: i % 2 === 0 ? "transparent" : "#0d0d0d" }}>
                            <td style={{ padding: "9px 12px 9px 0", color: "#666", borderBottom: "1px solid #141414" }}>{row.label}</td>
                            {(["free", "pro", "team"] as const).map(p => (
                              <td key={p} style={{ textAlign: "center" as const, padding: "9px 12px", borderBottom: "1px solid #141414", background: plan === p ? "#161616" : "transparent",
                                color: row[p] === "✓" ? "#22c55e" : row[p] === "—" ? "#282828" : plan === p ? "#e8e8e8" : "#555", fontWeight: row[p] === "✓" ? 700 : 400
                              }}>
                                {row[p]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Upgrade cards — only show if not on team */}
                {plan !== "team" && (
                  <div style={{ display: "grid", gridTemplateColumns: plan === "free" ? "1fr 1fr" : "1fr", gap: "12px" }}>
                    {(plan === "free" ? [
                      { name: "pro", label: "Pro", price: "$2", period: "/month", tagline: "For serious solo developers", highlight: true,
                        features: ["Unlimited projects", "30-second check intervals", "90-day uptime history", "AI root cause analysis", "Code insights", "Slack & PagerDuty alerts"] },
                      { name: "team", label: "Team", price: "$5", period: "/month", tagline: "For teams that ship together", highlight: false,
                        features: ["Everything in Pro", "5 team seats", "SLA reports & exports", "Support call scheduling", "Shared workspace", "Priority support"] },
                    ] : [
                      { name: "team", label: "Team", price: "$5", period: "/month", tagline: "For teams that ship together", highlight: true,
                        features: ["Everything in Pro", "5 team seats", "SLA reports & exports", "Support call scheduling", "Shared workspace", "Priority support"] },
                    ]).map(({ name, label, price, period, tagline, highlight, features }) => (
                      <div key={name} style={{ ...S.card, marginBottom: 0, border: highlight ? "1px solid #312e81" : "1px solid #1e1e1e", background: highlight ? "#0e0e1e" : "#111", position: "relative" as const }}>
                        {highlight && <span style={{ position: "absolute" as const, top: -1, right: 20, background: "#6366f1", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: "0 0 8px 8px", letterSpacing: "0.04em" }}>RECOMMENDED</span>}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                          <div>
                            <p style={{ ...S.cardTitle, margin: "0 0 4px" }}>{label}</p>
                            <p style={{ color: "#555", fontSize: 12, margin: 0 }}>{tagline}</p>
                          </div>
                          <div style={{ textAlign: "right" as const }}>
                            <span style={{ color: "#e8e8e8", fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}>{price}</span>
                            <span style={{ color: "#444", fontSize: 12 }}>{period}</span>
                          </div>
                        </div>
                        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                          {features.map(f => (
                            <li key={f} style={{ display: "flex", gap: "8px", fontSize: "12.5px", color: "#777", alignItems: "center" }}>
                              <span style={{ color: "#22c55e", fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => startCheckout(name)}
                          disabled={billingLoading === name}
                          style={{ ...S.btn, background: highlight ? "#6366f1" : "#1e1e1e", color: highlight ? "#fff" : "#888", border: highlight ? "none" : "1px solid #282828", width: "100%", opacity: billingLoading === name ? 0.7 : 1, fontSize: 13, fontWeight: 700 }}
                        >
                          {billingLoading === name ? "Redirecting…" : `Upgrade to ${label} →`}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* FAQ */}
                <div style={S.card} className="settings-card">
                  <p style={{ ...S.cardTitle, marginBottom: 16 }}>Billing FAQ</p>
                  {[
                    { q: "When am I charged?", a: "You're charged immediately when you upgrade. Your billing cycle starts from that date each month." },
                    { q: "Can I cancel anytime?", a: "Yes. Email hello@m-ops.pro and we'll cancel your subscription. You keep access until the end of the billing period." },
                    { q: "What payment methods are accepted?", a: "All major credit and debit cards via Stripe. No PayPal or crypto at this time." },
                    { q: "Is there a free trial?", a: "The Free plan is yours forever. No trial needed — upgrade when you're ready for more." },
                  ].map(({ q, a }, i) => (
                    <div key={i} style={{ borderBottom: i < 3 ? "1px solid #141414" : "none", paddingBottom: i < 3 ? 14 : 0, marginBottom: i < 3 ? 14 : 0 }}>
                      <p style={{ color: "#ccc", fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>{q}</p>
                      <p style={{ color: "#555", fontSize: 12.5, margin: 0, lineHeight: 1.6 }}>{a}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}
