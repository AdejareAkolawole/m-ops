"use client"
import { useState, useEffect } from "react"
import {
  WavingHand01Icon,
  AddSquareIcon,
  Notification01Icon,
  BarChartIcon,
  RocketIcon,
  BulbIcon,
  GithubIcon,
  AiBrain01Icon,
  ArrowRight01Icon,
} from "hugeicons-react"

const STORAGE_KEY = "hub_onboarding_v2"

export type OnboardingStep =
  | "welcome"
  | "add_project"
  | "check_status"
  | "connect_github"
  | "view_sla"
  | "setup_alerts"
  | "done"

const STEPS: {
  id: OnboardingStep
  Icon: React.ComponentType<{ size: number; color: string }>
  color: string
  bg: string
  border: string
  title: string
  desc: string
  cta: string
  tip: string
  action: "add_project" | "alerts" | "next" | "done"
}[] = [
  {
    id: "welcome",
    Icon: WavingHand01Icon,
    color: "#a78bfa", bg: "#1a0f2e", border: "#2d1a5e",
    title: "Welcome to m-ops",
    desc: "m-ops is your full-stack developer ops platform. Let's walk through it together — it'll take 2 minutes and you'll see exactly what it can do for you.",
    cta: "Start the tour →",
    tip: "This tour walks you through every key feature. You can restart it anytime from the ? menu.",
    action: "next",
  },
  {
    id: "add_project",
    Icon: AddSquareIcon,
    color: "#60a5fa", bg: "#0a1220", border: "#1a2a40",
    title: "Step 1 — Add your first project",
    desc: "Click **Add Project** in the top right and paste any URL. m-ops will start monitoring it immediately — response time, status code, SSL, and DNS health.",
    cta: "Add a project now",
    tip: "You can also connect Vercel with one API token and import all your projects at once.",
    action: "add_project",
  },
  {
    id: "check_status",
    Icon: BarChartIcon,
    color: "#4ade80", bg: "#051a10", border: "#0a3020",
    title: "Step 2 — Watch the live status",
    desc: "Every project card shows the current status, last response time, and a 30-day sparkline. m-ops checks your projects automatically — you don't have to do anything.",
    cta: "Next →",
    tip: "Pro plan checks every 30 seconds. Free plan checks every 5 minutes. Upgrade any time.",
    action: "next",
  },
  {
    id: "connect_github",
    Icon: GithubIcon,
    color: "#e8e8e8", bg: "#141414", border: "#2a2a2a",
    title: "Step 3 — Connect GitHub",
    desc: "Go to **Settings → Integrations** and connect GitHub. m-ops will scan your repos for code issues, track open PRs, and give you AI-powered fix suggestions.",
    cta: "Go to Integrations",
    tip: "This is what makes m-ops different — it understands your actual codebase, not just your URL.",
    action: "next",
  },
  {
    id: "view_sla",
    Icon: AiBrain01Icon,
    color: "#f59e0b", bg: "#1a1000", border: "#3a2500",
    title: "Step 4 — Open the AI + SLA tabs",
    desc: "Click any project → **SLA Report** for uptime history across 24h, 7d, 30d, 90d. Click **Code** for AI-powered issue detection and fix suggestions on your repo.",
    cta: "Next →",
    tip: "AI features are available on Pro and Team plans. The SLA tab works for everyone.",
    action: "next",
  },
  {
    id: "setup_alerts",
    Icon: Notification01Icon,
    color: "#f87171", bg: "#1a0a0a", border: "#3a1a1a",
    title: "Step 5 — Set up alerts",
    desc: "Email alerts are already on by default. Go to **Settings → Alerts** to connect Slack so your whole team gets notified the moment anything breaks.",
    cta: "Go to Alerts",
    tip: "Pro and Team plans also support PagerDuty for on-call escalation.",
    action: "alerts",
  },
  {
    id: "done",
    Icon: RocketIcon,
    color: "#a78bfa", bg: "#1a0f2e", border: "#2d1a5e",
    title: "You're ready to ship with confidence",
    desc: "m-ops is watching your stack. You'll be the first to know when something breaks — and the AI will help you fix it fast.",
    cta: "Let's go →",
    tip: "Press ? anytime for help, keyboard shortcuts, or to book a support call with us.",
    action: "done",
  },
]

interface Props {
  onAddProject: () => void
  onGoToAlerts: () => void
}

export function Onboarding({ onAddProject, onGoToAlerts }: Props) {
  const [stepIdx, setStepIdx] = useState(0)
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

  function goNext() {
    if (stepIdx >= STEPS.length - 1) { dismiss(); return }
    setAnimating(true)
    setTimeout(() => { setStepIdx(i => i + 1); setAnimating(false) }, 180)
  }

  function handleCta() {
    const step = STEPS[stepIdx]
    switch (step.action) {
      case "add_project":
        onAddProject()
        goNext()
        break
      case "alerts":
        window.location.href = "/settings?tab=alerts"
        dismiss()
        break
      case "done":
        dismiss()
        break
      default:
        goNext()
    }
  }

  if (!visible) return null

  const step = STEPS[stepIdx]
  const StepIcon = step.Icon
  const progress = ((stepIdx + 1) / STEPS.length) * 100

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 22, width: "100%", maxWidth: 500, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}>

        {/* Progress bar */}
        <div style={{ height: 3, background: "#1a1a1a" }}>
          <div style={{ height: "100%", background: `linear-gradient(90deg, ${step.color}99, ${step.color})`, borderRadius: 2, transition: "width 0.4s ease", width: `${progress}%` }} />
        </div>

        <div style={{ padding: "32px 32px 24px", opacity: animating ? 0 : 1, transition: "opacity 0.18s ease" }}>
          {/* Step counter */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 5 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  width: i === stepIdx ? 20 : 6, height: 6, borderRadius: 3,
                  background: i === stepIdx ? step.color : i < stepIdx ? "#2a2a2a" : "#1a1a1a",
                  transition: "all 0.3s ease",
                }} />
              ))}
            </div>
            <span style={{ fontSize: 11, color: "#2a2a2a" }}>{stepIdx + 1} / {STEPS.length}</span>
          </div>

          {/* Icon */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div style={{ width: 68, height: 68, borderRadius: 20, background: step.bg, border: `1px solid ${step.border}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 32px ${step.color}22` }}>
              <StepIcon size={32} color={step.color} />
            </div>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", textAlign: "center", marginBottom: 10 }}>{step.title}</h2>
          <p style={{ fontSize: 13.5, color: "#666", textAlign: "center", lineHeight: 1.75, marginBottom: 22 }}>
            {step.desc.split(/(\*\*[^*]+\*\*)/).map((p, i) =>
              p.startsWith("**") ? <strong key={i} style={{ color: "#aaa" }}>{p.slice(2, -2)}</strong> : p
            )}
          </p>

          {/* Tip box */}
          <div style={{ background: "#0a0a0a", border: "1px solid #141414", borderRadius: 10, padding: "10px 12px", marginBottom: 22, display: "flex", gap: 9, alignItems: "flex-start" }}>
            <BulbIcon size={13} color="#333" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 11.5, color: "#3a3a3a", margin: 0, lineHeight: 1.65 }}>{step.tip}</p>
          </div>

          {/* CTA */}
          <button onClick={handleCta} style={{
            width: "100%", padding: "12px 0", borderRadius: 11, fontSize: 13.5, fontWeight: 700,
            background: step.bg, color: step.color, border: `1px solid ${step.border}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "all 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.85" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1" }}
          >
            {step.cta}
            {step.action !== "done" && <ArrowRight01Icon size={14} color={step.color} />}
          </button>

          <button onClick={dismiss} style={{ display: "block", width: "100%", marginTop: 10, background: "none", border: "none", cursor: "pointer", color: "#222", fontSize: 12 }}>
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
