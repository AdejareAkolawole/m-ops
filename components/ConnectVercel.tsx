"use client"
import { useState } from "react"
import { Cancel01Icon, LinkSquare02Icon, Loading03Icon, CheckmarkCircle02Icon } from "hugeicons-react"
import { saveVercelAccount, saveVercelProjects } from "@/lib/store"
import { VercelAccount, VercelSyncedProject } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Props {
  onClose: () => void
  onConnected: (projects: VercelSyncedProject[]) => void
}

export function ConnectVercel({ onClose, onConnected }: Props) {
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleConnect() {
    if (!token.trim()) { setError("Paste your Vercel token first"); return }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/vercel/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to connect")

      const account: VercelAccount = { token: token.trim(), connectedAt: new Date().toISOString() }
      saveVercelAccount(account)
      saveVercelProjects(data)
      onConnected(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to connect")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl">

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 76 65" fill="currentColor" className="text-zinc-900 dark:text-white">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Connect Vercel</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <Cancel01Icon size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/60 p-4 space-y-3">
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">How to get your token</p>
            <ol className="space-y-2">
              {[
                "Go to vercel.com → your avatar → Settings",
                'Click "Tokens" in the left sidebar',
                'Click "Create Token", give it any name',
                "Copy the token and paste it below",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <a
              href="https://vercel.com/account/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400"
            >
              Open Vercel token settings <LinkSquare02Icon size={10} />
            </a>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">
              Vercel API Token
            </label>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="paste your token here..."
              type="password"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 font-mono"
            />
            <p className="text-[11px] text-zinc-400 mt-1.5">
              Stored locally on your device only. Never sent anywhere except Vercel&apos;s API.
            </p>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={handleConnect}
            disabled={loading}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all",
              "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100",
              loading && "opacity-70 cursor-not-allowed"
            )}
          >
            {loading
              ? <><Loading03Icon size={14} className="animate-spin" /> Connecting...</>
              : <><CheckmarkCircle02Icon size={14} /> Connect &amp; import all projects</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
