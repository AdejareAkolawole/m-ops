"use client"
import { useState, useEffect } from "react"

const STORAGE_KEY = "hub_onboarding_v2"

const STEPS = [
  {
    icon: "👋",
    title: "Welcome to m-ops",
    desc: "Your all-in-one monitoring platform. Let's get you set up in 60 seconds.",
    action: null,
    tip: "Monitor any URL, Vercel deployment, or provider — and get alerted the moment something breaks.",
  },
  {
    icon: "🔗",
    title: "Add your first project",
    desc: "Paste any URL and m-ops will start pinging it every 30 seconds.",
    action: { label: "Add Project", onClick: "add_project" },
    tip: "You can also connect Vercel, Netlify, Railway, and more with one click.",
  },
  {
    icon: "🔔",
    title: "Set up alerts",
    desc: "Get notified by email the moment a project goes down or recovers.",
    action: { label: "Go to Alerts", onClick: "alerts" },
    tip: "Upgrade to Pro to add Slack and PagerDuty alerts too.",
  },
  {
    icon: "📊",
    title: "Read your SLA",
    desc: "Click any project → SLA Report to see uptime percentages across 24h, 7d, 30d, and 90d.",
    action: null,
    tip: "The SLA tab auto-calculates from your check history — no setup needed.",
  },
  {
    icon: "🚀",
    title: "You're all set!",
    desc: "m-ops is now watching your projects. We'll alert you the moment anything looks wrong.",
    action: null,
    tip: "Hit the ? button anytime for help, shortcuts, or to book a support call.",
  },
]

interface Props {
  onAddProject: () => void
  onGoToAlerts: () => void
}

export function Onboarding({ onAddProject, onGoToAlerts }: Props) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "done")
    setVisible(false)
  }

  function next() {
    if (step >= STEPS.length - 1) { dismiss(); return }
    setAnimating(true)
    setTimeout(() => { setStep(s => s + 1); setAnimating(false) }, 180)
  }

  function handleAction(onClick: string) {
    if (onClick === "add_project") { onAddProject(); dismiss() }
    if (onClick === "alerts") { window.location.href = "/settings?tab=alerts"; dismiss() }
  }

  if (!visible) return null

  const s = STEPS[step]

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#111", border: "1px solid #222", borderRadius: 20, width: "100%", maxWidth: 480, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>

        {/* Progress bar */}
        <div style={{ height: 3, background: "#1a1a1a" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg,#7c3aed,#a78bfa)", borderRadius: 2, transition: "width 0.4s ease", width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        {/* Content */}
        <div style={{ padding: 36, opacity: animating ? 0 : 1, transition: "opacity 0.18s ease" }}>
          <div style={{ fontSize: 42, marginBottom: 16, textAlign: "center" }}>{s.icon}</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", textAlign: "center", marginBottom: 8 }}>{s.title}</h2>
          <p style={{ fontSize: 13.5, color: "#888", textAlign: "center", lineHeight: 1.65, marginBottom: 20 }}>{s.desc}</p>

          {/* Tip */}
          <div style={{ background: "#0d0d0d", border: "1px solid #1c1c1c", borderRadius: 10, padding: "10px 14px", marginBottom: 24, display: "flex", gap: 8 }}>
            <span style={{ fontSize: 13 }}>💡</span>
            <p style={{ fontSize: 12, color: "#555", margin: 0, lineHeight: 1.6 }}>{s.tip}</p>
          </div>

          {/* Step dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 24 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ width: i === step ? 18 : 6, height: 6, borderRadius: 3, background: i === step ? "#a78bfa" : i < step ? "#3a2a5a" : "#1e1e1e", transition: "all 0.3s ease", cursor: "pointer" }} onClick={() => i < step && setStep(i)} />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            {s.action && (
              <button onClick={() => handleAction(s.action!.onClick)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg,#7c3aed,#a78bfa)", color: "#fff", border: "none", cursor: "pointer" }}>
                {s.action.label} →
              </button>
            )}
            <button onClick={next} style={{ flex: 1, padding: "11px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, background: s.action ? "#1a1a1a" : "#e8e8e8", color: s.action ? "#888" : "#000", border: s.action ? "1px solid #222" : "none", cursor: "pointer" }}>
              {step >= STEPS.length - 1 ? "Get started" : s.action ? "Skip" : "Next →"}
            </button>
          </div>

          <button onClick={dismiss} style={{ display: "block", width: "100%", marginTop: 12, background: "none", border: "none", cursor: "pointer", color: "#333", fontSize: 12 }}>
            Skip tour
          </button>
        </div>
      </div>
    </div>
  )
}

export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY)
}
