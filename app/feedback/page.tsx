"use client"
import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft01Icon,
  Bug01Icon,
  Idea01Icon,
  CheckmarkCircle01Icon,
} from "hugeicons-react"

function FeedbackForm() {
  const params = useSearchParams()
  const router = useRouter()
  const initialType = (params.get("type") ?? "feature") as "bug" | "feature"

  const [type, setType] = useState<"bug" | "feature">(initialType)
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const isBug = type === "bug"
  const color = isBug ? "#f87171" : "#fbbf24"
  const bg = isBug ? "#1a0a0a" : "#1a1200"
  const border = isBug ? "#3a1a1a" : "#3a2a00"
  const Icon = isBug ? Bug01Icon : Idea01Icon

  async function submit() {
    if (!title.trim()) return
    setLoading(true)
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, description: desc }),
      })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "#051a10", border: "1px solid #0a3020", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <CheckmarkCircle01Icon size={32} color="#4ade80" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", marginBottom: 8 }}>
          {isBug ? "Bug reported!" : "Feature requested!"}
        </h2>
        <p style={{ fontSize: 13.5, color: "#555", marginBottom: 28, lineHeight: 1.7 }}>
          Thanks for taking the time — we'll review it soon.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={() => { setTitle(""); setDesc(""); setSent(false) }} style={{ padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: "#141414", color: "#888", border: "1px solid #1e1e1e", cursor: "pointer" }}>
            Submit another
          </button>
          <Link href="/dashboard" style={{ padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "#e8e8e8", color: "#000", textDecoration: "none", display: "inline-block" }}>
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Type toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {(["bug", "feature"] as const).map(t => {
          const c = t === "bug" ? "#f87171" : "#fbbf24"
          const b = t === "bug" ? "#1a0a0a" : "#1a1200"
          const bd = t === "bug" ? "#3a1a1a" : "#3a2a00"
          const TIcon = t === "bug" ? Bug01Icon : Idea01Icon
          const active = type === t
          return (
            <button key={t} onClick={() => setType(t)} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "12px 0", borderRadius: 12, border: `1px solid ${active ? bd : "#1e1e1e"}`,
              background: active ? b : "#0f0f0f", cursor: "pointer",
              transition: "all 0.15s",
            }}>
              <TIcon size={15} color={active ? c : "#333"} />
              <span style={{ fontSize: 13, fontWeight: 700, color: active ? c : "#333" }}>
                {t === "bug" ? "Report a bug" : "Request a feature"}
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={22} color={color} />
        </div>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", margin: 0 }}>
            {isBug ? "Report a bug" : "Request a feature"}
          </h1>
          <p style={{ fontSize: 12.5, color: "#444", margin: 0 }}>
            {isBug ? "Describe what's broken and how to reproduce it." : "Tell us what you'd like and why it matters."}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: "#444", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {isBug ? "Bug title" : "Feature title"} <span style={{ color: "#f87171" }}>*</span>
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={isBug ? "e.g. Dashboard crashes when clicking SLA tab" : "e.g. Dark mode for the docs page"}
            style={{ width: "100%", background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 10, padding: "11px 14px", color: "#e8e8e8", fontSize: 13.5, outline: "none", boxSizing: "border-box" }}
            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = color }}
            onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "#1e1e1e" }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: "#444", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {isBug ? "Steps to reproduce" : "Description"}
          </label>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder={isBug
              ? "1. Go to...\n2. Click on...\n3. See error..."
              : "Describe what you'd like, who it would help, and any examples you've seen elsewhere..."}
            rows={6}
            style={{ width: "100%", background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 10, padding: "11px 14px", color: "#e8e8e8", fontSize: 13.5, outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.65 }}
            onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = color }}
            onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = "#1e1e1e" }}
          />
        </div>

        <button
          onClick={submit}
          disabled={!title.trim() || loading}
          style={{
            padding: "13px 0", borderRadius: 11, fontSize: 13.5, fontWeight: 700,
            background: title.trim() ? bg : "#111",
            color: title.trim() ? color : "#2a2a2a",
            border: `1px solid ${title.trim() ? border : "#1a1a1a"}`,
            cursor: title.trim() ? "pointer" : "not-allowed",
            transition: "all 0.15s",
          }}
        >
          {loading ? "Submitting…" : isBug ? "Submit bug report" : "Submit feature request"}
        </button>
      </div>
    </>
  )
}

export default function FeedbackPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #141414", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 6, color: "#444", textDecoration: "none", fontSize: 13 }}>
          <ArrowLeft01Icon size={14} color="#444" /> Dashboard
        </Link>
        <div style={{ width: 1, height: 16, background: "#1e1e1e" }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#e8e8e8" }}>Feedback</span>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ width: "100%", maxWidth: 520, background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 20, padding: "32px 32px" }}>
          <Suspense>
            <FeedbackForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
