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
} from "hugeicons-react"

type Tab = "profile" | "security" | "notifications" | "billing"

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

            {tab === "billing" && (
              <>
                <div style={S.card} className="settings-card">
                  <p style={S.cardTitle}>Current plan</p>
                  <p style={S.cardDesc}>Your active subscription tier.</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{
                      padding: "4px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 700, letterSpacing: "0.04em",
                      background: plan === "free" ? "#1a1a1a" : "#1e1b4b", color: plan === "free" ? "#555" : "#a5b4fc",
                      border: `1px solid ${plan === "free" ? "#222" : "#312e81"}`,
                    }}>
                      {plan.toUpperCase()}
                    </span>
                    <span style={{ color: "#444", fontSize: "13px" }}>
                      {plan === "free" ? "Free plan — limited to 3 projects, 5-min intervals" :
                       plan === "pro" ? "Pro plan — unlimited projects, 30-sec intervals, AI analysis" :
                       "Team plan — everything in Pro + 5 seats, SLA reports"}
                    </span>
                  </div>
                </div>

                {plan === "free" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {[
                      { name: "pro", label: "Pro", price: "$2/mo", features: ["Unlimited projects", "30-sec intervals", "AI root cause analysis", "Slack & alerts"] },
                      { name: "team", label: "Team", price: "$5/mo", features: ["Everything in Pro", "5 team seats", "SLA reports", "Dedicated support"] },
                    ].map(({ name, label, price, features }) => (
                      <div key={name} style={{ ...S.card, marginBottom: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
                          <p style={{ ...S.cardTitle, margin: 0 }}>{label}</p>
                          <span style={{ color: "#e8e8e8", fontSize: "16px", fontWeight: 700 }}>{price}</span>
                        </div>
                        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                          {features.map(f => (
                            <li key={f} style={{ display: "flex", gap: "8px", fontSize: "12px", color: "#555" }}>
                              <span style={{ color: "#22c55e" }}>✓</span>{f}
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => startCheckout(name)}
                          disabled={billingLoading === name}
                          style={{ ...S.btn, background: "#6366f1", color: "#fff", width: "100%", opacity: billingLoading === name ? 0.7 : 1 }}
                        >
                          {billingLoading === name ? "Redirecting…" : `Upgrade to ${label}`}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {plan !== "free" && (
                  <div style={S.card} className="settings-card">
                    <p style={S.cardTitle}>Manage subscription</p>
                    <p style={S.cardDesc}>To cancel or change your plan, contact support at hello@bachs.io or reach out via your Bachs dashboard.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}
