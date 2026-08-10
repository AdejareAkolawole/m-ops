"use client"
import { useEffect } from "react"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050508] px-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
        <p className="text-[#64748b] mb-8 max-w-sm">An unexpected error occurred. Our team has been notified.</p>
        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors"
          >
            Try again
          </button>
          <a href="/dashboard" className="bg-[#1a1f2e] hover:bg-[#232938] text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors border border-[#2a3040]">
            Go home
          </a>
        </div>
      </div>
    </div>
  )
}
