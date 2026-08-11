"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signInWithGitHub } from "./actions"
import { GitHubSubmitButton, Spinner } from "@/components/AuthLoader"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await signIn("credentials", { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      setError("Invalid email or password")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span style={{ color: "#fff", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.05em" }}>m-ops</span>
          <p style={{ color: "#444", fontSize: "13.5px", margin: 0 }}>Sign in to your workspace</p>
        </div>

        <form action={signInWithGitHub}>
          <GitHubSubmitButton />
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ flex: 1, height: "1px", background: "#181818" }} />
          <span style={{ color: "#2a2a2a", fontSize: "12px" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "#181818" }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ color: "#555", fontSize: "12px", fontWeight: 500 }}>Password</label>
              <Link href="/forgot-password" style={{ color: "#60a5fa", fontSize: "12px", textDecoration: "none" }}>Forgot password?</Link>
            </div>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
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
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "#333", fontSize: "13px", marginTop: "24px" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "#60a5fa", textDecoration: "none" }}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}
