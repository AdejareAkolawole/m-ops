"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [ghLoading, setGhLoading] = useState(false)
  const router = useRouter()

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

    // Auto sign in after signup
    await signIn("credentials", { email, password, redirect: false })
    router.push("/dashboard")
  }

  async function handleGitHub() {
    setGhLoading(true)
    await signIn("github", { callbackUrl: "/dashboard" })
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span style={{ color: "#fff", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.05em" }}>m-ops</span>
          <p style={{ color: "#444", fontSize: "13.5px", margin: 0 }}>Create your workspace</p>
        </div>

        {/* GitHub button */}
        <button onClick={handleGitHub} disabled={ghLoading}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "11px", borderRadius: "10px", background: "#161616", border: "1px solid #222", color: "#e8e8e8", fontSize: "13.5px", fontWeight: 500, cursor: "pointer", marginBottom: "20px", transition: "border-color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#333"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "#222"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          {ghLoading ? "Redirecting..." : "Continue with GitHub"}
        </button>

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
            style={{ width: "100%", padding: "11px", borderRadius: "9px", background: "#60a5fa", color: "#000", fontSize: "13.5px", fontWeight: 600, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: "4px" }}
          >
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
