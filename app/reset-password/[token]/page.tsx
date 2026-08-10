"use client"
import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

export default function ResetPasswordPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (password !== confirm) { setError("Passwords don't match"); return }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return }
    setStatus("loading")
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || "Something went wrong"); setStatus("idle"); return }
      setStatus("done")
      setTimeout(() => router.push("/login"), 2000)
    } catch {
      setError("Something went wrong")
      setStatus("idle")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050508] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
            </div>
            <span className="text-white font-semibold text-lg">m-ops</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Set new password</h1>
          <p className="text-[#94a3b8] text-sm">Choose a strong password for your account</p>
        </div>

        <div className="bg-[#0f1117] border border-[#1e2433] rounded-2xl p-6">
          {status === "done" ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-white font-medium mb-1">Password updated!</p>
              <p className="text-[#94a3b8] text-sm">Redirecting you to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-1.5">New password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#1a1f2e] border border-[#2a3040] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-1.5">Confirm password</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full bg-[#1a1f2e] border border-[#2a3040] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Repeat your password"
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-60"
              >
                {status === "loading" ? "Updating..." : "Update password"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-[#64748b] mt-6">
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
