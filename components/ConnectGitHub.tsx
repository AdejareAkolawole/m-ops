"use client"
import { useState } from "react"
import { Cancel01Icon } from "hugeicons-react"
import { GitHubAccount } from "@/lib/types"

const GitHubMark = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 98 96" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
  </svg>
)

interface Props {
  onClose: () => void
  onConnected: (account: GitHubAccount) => void
}

export function ConnectGitHub({ onClose }: Props) {
  const [loading, setLoading] = useState(false)

  function handleLogin() {
    setLoading(true)
    // Store intent so the app knows to open Code Insights on return
    localStorage.setItem("gh_oauth_pending", "insights")
    window.location.href = "/api/github/auth"
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "400px", borderRadius: "18px", background: "#0d0d0d", border: "1px solid #222", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <GitHubMark size={20} />
            <span style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}>Connect GitHub</span>
          </div>
          <button onClick={onClose} style={{ color: "#484848", background: "none", border: "none", cursor: "pointer" }}>
            <Cancel01Icon size={16} />
          </button>
        </div>

        <div style={{ padding: "28px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#161616", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GitHubMark size={32} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <p style={{ color: "#e8e8e8", fontSize: "15px", fontWeight: 600, margin: 0 }}>Authorize Project Hub</p>
            <p style={{ color: "#505050", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
              We&apos;ll read your code to detect issues and open PRs with auto-fixes. We never push to main directly.
            </p>
          </div>

          <div style={{ width: "100%", background: "#111", borderRadius: "10px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              ["Read access", "Scan your repo files for issues"],
              ["Pull requests", "Open fix PRs on your behalf"],
              ["User info", "Show your avatar & username"],
            ].map(([perm, desc]) => (
              <div key={perm} style={{ display: "flex", alignItems: "center", gap: "10px", textAlign: "left" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
                <div>
                  <span style={{ color: "#c0c0c0", fontSize: "12px", fontWeight: 600 }}>{perm}</span>
                  <span style={{ color: "#484848", fontSize: "12px" }}> — {desc}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              padding: "13px", borderRadius: "10px", fontSize: "14px", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              background: loading ? "#1a1a1a" : "#e8e8e8", color: loading ? "#404040" : "#000",
              border: loading ? "1px solid #2a2a2a" : "none",
              transition: "all 0.15s",
            }}
          >
            {loading ? (
              <span style={{ opacity: 0.5 }}>Redirecting to GitHub...</span>
            ) : (
              <><GitHubMark size={15} /> Login with GitHub</>
            )}
          </button>

          <p style={{ color: "#2a2a2a", fontSize: "11px", margin: 0 }}>
            Token stored locally only. We never share your code.
          </p>
        </div>
      </div>
    </div>
  )
}
