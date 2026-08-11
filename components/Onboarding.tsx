"use client"
import { useState, useEffect } from "react"
import {
  WavingHand01Icon,
  GithubIcon,
  AiBrain01Icon,
  BarChartIcon,
  RocketIcon,
  Notification01Icon,
  BulbIcon,
} from "hugeicons-react"

const STORAGE_KEY = "hub_onboarding_v2"

const STEPS = [
  {
    Icon: WavingHand01Icon,
    color: "#a78bfa",
    bg: "#1a1a2e",
    border: "#2a2a4a",
    title: "Welcome to m-ops",
    desc: "Your full-stack developer ops platform. Monitor deployments, debug with AI, track code health — all in one place.",
    action: null,
    tip: "m-ops goes beyond uptime. Connect GitHub and Vercel to get deep insights into your entire stack.",
  },
  {
    Icon: GithubIcon,
    color: "#e8e8e8",
    bg: "#141414",
    border: "#2a2a2a",
    title: "Connect your stack",
    desc: "Link GitHub, Vercel, Railway, Netlify — and m-ops pulls in your projects, deployments, and repo health automatically.",
    action: { label: "Add Project", onClick: "add_project" },
    tip: "One API token imports all your Vercel projects. GitHub gives you PR insights, code issues, and AI-powered fixes.",
  },
  {
    Icon: AiBrain01Icon,
    color: "#4ade80",
    bg: "#0a1a0a",
    border: "#1a3a1a",
    title: "AI debugging & code insights",
    desc: "m-ops AI scans your repos for issues, suggests fixes, and explains what's breaking — before your users notice.",
    action: { label: "Go to Alerts", onClick: "alerts" },
    tip: "Upgrade to Pro to unlock AI debugging, code insights, and Slack/PagerDuty alerts.",
  },
  {
    Icon: BarChartIcon,
    color: "#60a5fa",
    bg: "#0a0f1a",
    border: "#1a2a3a",
    title: "SLA reports & uptime history",
    desc: "Every project gets a full SLA tab — 24h, 7d, 30d, 90d uptime percentages with incident breakdowns.",
    action: null,
    tip: "The SLA tab auto-calculates from live check history. No setup needed — just add a project and it starts tracking.",
  },
  {
    Icon: RocketIcon,
    color: "#f59e0b",
    bg: "#1a1000",
    border: "#3a2a00",
    title: "You're ready to ship with confidence",
    desc: "m-ops is watching your stack. You'll be the first to know when something breaks — and the first to fix it.",
    action: null,
    tip: "Hit the ? button anytime for help, keyboard shortcuts, or to book a support call with us.",
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
  const StepIcon = s.Icon

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 22, width: "100%", maxWidth: 480, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}>

        {/* Progress bar */}
        <div style={{ height: 3, background: "#1a1a1a" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg,#7c3aed,#a78bfa)", borderRadius: 2, transition: "width 0.4s ease", width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        {/* Content */}
        <div style={{ padding: "36px 36px 28px", opacity: animating ? 0 : 1, transition: "opacity 0.18s ease" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: s.bg, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <StepIcon size={30} color={s.color} />
            </div>
          </div>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", textAlign: "center", marginBottom: 8 }}>{s.title}</h2>
          <p style={{ fontSize: 13.5, color: "#777", textAlign: "center", lineHeight: 1.7, marginBottom: 20 }}>{s.desc}</p>

          {/* Tip */}
          <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 10, padding: "10px 14px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <BulbIcon size={14} color="#444" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 12, color: "#444", margin: 0, lineHeight: 1.6 }}>{s.tip}</p>
          </div>

          {/* Step dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 24 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? "#a78bfa" : i < step ? "#3a2a5a" : "#1e1e1e", transition: "all 0.3s ease", cursor: i < step ? "pointer" : "default" }} onClick={() => i < step && setStep(i)} />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            {s.action && (
              <button onClick={() => handleAction(s.action!.onClick)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg,#7c3aed,#a78bfa)", color: "#fff", border: "none", cursor: "pointer" }}>
                {s.action.label} →
              </button>
            )}
            <button onClick={next} style={{ flex: 1, padding: "11px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, background: s.action ? "#161616" : "#e8e8e8", color: s.action ? "#666" : "#000", border: s.action ? "1px solid #1e1e1e" : "none", cursor: "pointer" }}>
              {step >= STEPS.length - 1 ? "Let's go →" : s.action ? "Skip" : "Next →"}
            </button>
          </div>

          <button onClick={dismiss} style={{ display: "block", width: "100%", marginTop: 10, background: "none", border: "none", cursor: "pointer", color: "#2a2a2a", fontSize: 12 }}>
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
