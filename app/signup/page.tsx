"use client"
import { useState } from "react"
import Link from "next/link"
import { signUpWithGitHub } from "./actions"
import { GitHubSubmitButton, Spinner } from "@/components/AuthLoader"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || "Something went wrong")
      setLoading(false)
      return
    }

    setDone(true)
  }

  async function handleResend() {
    setResendStatus("sending")
    // Sign in to get a session so the resend endpoint can auth
    const { signIn } = await import("next-auth/react")
    await signIn("credentials", { email, password, redirect: false })
    const res = await fetch("/api/auth/resend-verification", { method: "POST" })
    setResendStatus(res.ok ? "sent" : "idle")
  }

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: "#080808", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: "380px", textAlign: "center" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "#111", border: "1px solid #1e1e1e", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "24px" }}>✉️</div>
          <h1 style={{ color: "#fff", fontSize: "20px", fontWeight: 700, margin: "0 0 10px", letterSpacing: "-0.03em" }}>Check your inbox</h1>
          <p style={{ color: "#555", fontSize: "13.5px", lineHeight: 1.6, margin: "0 0 6px" }}>
            We sent a verification link to
          </p>
          <p style={{ color: "#bbb", fontSize: "13.5px", fontWeight: 600, margin: "0 0 32px" }}>{email}</p>
          <p style={{ color: "#444", fontSize: "12.5px", lineHeight: 1.7, margin: "0 0 28px" }}>
            Click the link in the email to verify your account and access your dashboard. Check your spam folder if you don&apos;t see it.
          </p>
          <button
            onClick={handleResend}
            disabled={resendStatus !== "idle"}
            style={{ width: "100%", padding: "11px", borderRadius: "9px", background: resendStatus === "sent" ? "#111" : "#1a1a1a", color: resendStatus === "sent" ? "#555" : "#aaa", fontSize: "13px", fontWeight: 500, border: "1px solid #1e1e1e", cursor: resendStatus !== "idle" ? "not-allowed" : "pointer", marginBottom: "12px" }}
          >
            {resendStatus === "sending" ? "Sending…" : resendStatus === "sent" ? "Email resent — check your inbox" : "Resend verification email"}
          </button>
          <Link href="/login" style={{ display: "block", color: "#333", fontSize: "13px", textDecoration: "none", textAlign: "center" }}>
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span style={{ color: "#fff", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.05em" }}>m-ops</span>
          <p style={{ color: "#444", fontSize: "13.5px", margin: 0 }}>Create your workspace</p>
        </div>

        <form action={signUpWithGitHub}>
          <GitHubSubmitButton />
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ flex: 1, height: "1px", background: "#181818" }} />
          <span style={{ color: "#2a2a2a", fontSize: "12px" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "#181818" }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ color: "#555", fontSize: "12px", fontWeight: 500 }}>Name</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Your name"
              style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: "9px", padding: "10px 14px", fontSize: "13.5px", color: "#e8e8e8", outline: "none" }}
              onFocus={e => e.currentTarget.style.borderColor = "#333"}
              onBlur={e => e.currentTarget.style.borderColor = "#1e1e1e"}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ color: "#555", fontSize: "12px", fontWeight: 500 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="you@example.com"
              style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: "9px", padding: "10px 14px", fontSize: "13.5px", color: "#e8e8e8", outline: "none" }}
              onFocus={e => e.currentTarget.style.borderColor = "#333"}
              onBlur={e => e.currentTarget.style.borderColor = "#1e1e1e"}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ color: "#555", fontSize: "12px", fontWeight: 500 }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="Min. 8 characters"
              style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: "9px", padding: "10px 14px", fontSize: "13.5px", color: "#e8e8e8", outline: "none" }}
              onFocus={e => e.currentTarget.style.borderColor = "#333"}
              onBlur={e => e.currentTarget.style.borderColor = "#1e1e1e"}
            />
          </div>

          {error && <p style={{ color: "#f87171", fontSize: "12.5px", margin: 0 }}>{error}</p>}

          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "11px", borderRadius: "9px", background: "#60a5fa", color: "#000", fontSize: "13.5px", fontWeight: 600, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            {loading && <Spinner size={14} color="#000" />}
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "#333", fontSize: "13px", marginTop: "24px" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#60a5fa", textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
