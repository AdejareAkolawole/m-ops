"use client"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function VerifyEmailPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Try to refresh the session — if they already verified, the DB check
    // in the jwt callback will pick it up and we can redirect
    update()
      .then(async (refreshed) => {
        if ((refreshed?.user as any)?.emailVerified) {
          router.replace("/dashboard")
          return
        }
        // Also check the resend endpoint as a fallback — if it says "already verified"
        // the DB is verified but JWT is stale; force a fresh login
        const res = await fetch("/api/auth/resend-verification", { method: "POST" }).catch(() => null)
        if (res?.status === 400) {
          // Already verified in DB — sign out to clear stale JWT, then fresh login
          await signOut({ redirect: false })
          router.replace("/login?verified=1&callbackUrl=/dashboard")
          return
        }
        // Not verified yet and we just sent the email
        setChecking(false)
      })
      .catch(() => setChecking(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function resend() {
    setStatus("sending")
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" })
      if (res.status === 400) {
        await signOut({ redirect: false })
        router.replace("/login?verified=1&callbackUrl=/dashboard")
        return
      }
      setStatus(res.ok ? "sent" : "error")
    } catch {
      setStatus("error")
    }
  }

  if (checking) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#f2f2f2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "32px", height: "32px", border: "2px solid #e0e0e0", borderTopColor: "#0a0a0a", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ color: "#999", fontSize: "13px", margin: 0 }}>Checking verification status…</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f2f2f2",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif",
      padding: "24px",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "48px",
        maxWidth: "440px",
        width: "100%",
        textAlign: "center",
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: "22px",
        }}>✉️</div>

        <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#0a0a0a", margin: "0 0 12px", letterSpacing: "-0.03em" }}>
          Verify your email
        </h1>

        <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.6", margin: "0 0 8px" }}>
          We sent a verification link to
        </p>
        <p style={{ fontSize: "14px", fontWeight: "600", color: "#0a0a0a", margin: "0 0 32px" }}>
          {session?.user?.email || "your email address"}
        </p>

        <p style={{ fontSize: "13px", color: "#999", margin: "0 0 24px", lineHeight: "1.6" }}>
          Click the link in the email to access your dashboard. Check your spam folder if you don&apos;t see it. The link expires in 24 hours.
        </p>

        {status === "sent" && (
          <div style={{ background: "#f0fff4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", color: "#15803d", marginBottom: "24px" }}>
            Email resent — check your inbox.
          </div>
        )}
        {status === "error" && (
          <div style={{ background: "#fff0f0", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", color: "#dc2626", marginBottom: "24px" }}>
            Something went wrong — try signing out and back in.
          </div>
        )}

        <button
          onClick={resend}
          disabled={status === "sending" || status === "sent"}
          style={{ width: "100%", background: status === "sent" ? "#f5f5f5" : "#0a0a0a", color: status === "sent" ? "#999" : "#fff", border: "none", borderRadius: "8px", padding: "12px", fontSize: "14px", fontWeight: "600", cursor: status === "sending" || status === "sent" ? "not-allowed" : "pointer", marginBottom: "12px" }}
        >
          {status === "sending" ? "Sending…" : status === "sent" ? "Email sent" : "Resend verification email"}
        </button>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{ width: "100%", background: "transparent", color: "#999", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "12px", fontSize: "14px", cursor: "pointer" }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
