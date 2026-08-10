"use client"
import { useState } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setStatus("loading")
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || "Something went wrong")
        setStatus("idle")
        return
      }
      setStatus("done")
    } catch {
      setError("Something went wrong")
      setStatus("idle")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050508] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-6">
            <span className="text-white font-bold text-2xl tracking-tight">m-ops</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Forgot your password?</h1>
          <p className="text-[#94a3b8] text-sm">Enter your email and we&apos;ll send a reset link</p>
        </div>

        <div className="bg-[#0f1117] border border-[#1e2433] rounded-2xl p-6">
          {status === "done" ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-white font-medium mb-1">Check your email</p>
              <p className="text-[#94a3b8] text-sm">If an account exists for <strong className="text-white">{email}</strong>, you&apos;ll receive a reset link shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#1a1f2e] border border-[#2a3040] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-60"
              >
                {status === "loading" ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-[#64748b] mt-6">
          Remember your password?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
