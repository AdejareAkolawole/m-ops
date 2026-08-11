"use client"
import { useState, useEffect, useRef } from "react"
import {
  Mortarboard01Icon,
  KeyboardIcon,
  BookOpen01Icon,
  Bug01Icon,
  Idea01Icon,
  Activity01Icon,
  CallIcon,
  Mail01Icon,
  CrownIcon,
  QuestionIcon,
  Cancel01Icon,
} from "hugeicons-react"
// Bug01Icon and Idea01Icon used in menu items only (link to /feedback page)
import { resetOnboarding } from "./Onboarding"

const SHORTCUTS = [
  { keys: ["N"], desc: "Add new project" },
  { keys: ["R"], desc: "Refresh all checks" },
  { keys: ["?"], desc: "Open help" },
  { keys: ["Esc"], desc: "Close / go back" },
]

interface Props {
  onAddProject?: () => void
  plan?: string
  inline?: boolean
}

export function HelpButton({ onAddProject, plan, inline }: Props) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<"menu" | "shortcuts">("menu")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "?" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) {
        setOpen(o => !o)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setView("menu") }
    }
    if (open) document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  const menuItems = [
    {
      Icon: Mortarboard01Icon,
      label: "Restart tour",
      desc: "Walk through onboarding again",
      color: "#a78bfa", bg: "#1a0f2e", border: "#2d1a5e",
      onClick: () => { resetOnboarding(); window.location.reload() },
    },
    {
      Icon: KeyboardIcon,
      label: "Keyboard shortcuts",
      desc: "Speed up your workflow",
      color: "#60a5fa", bg: "#0a1220", border: "#1a2a40",
      onClick: () => setView("shortcuts"),
    },
    {
      Icon: BookOpen01Icon,
      label: "Documentation",
      desc: "Guides and API reference",
      color: "#4ade80", bg: "#0a1a0e", border: "#1a3a20",
      onClick: () => { window.location.href = "/docs"; setOpen(false) },
    },
    {
      Icon: Bug01Icon,
      label: "Report a bug",
      desc: "Something broken? Let us know",
      color: "#f87171", bg: "#1a0a0a", border: "#3a1a1a",
      onClick: () => { window.location.href = "/feedback?type=bug"; setOpen(false) },
    },
    {
      Icon: Idea01Icon,
      label: "Request a feature",
      desc: "Suggest something new",
      color: "#fbbf24", bg: "#1a1200", border: "#3a2a00",
      onClick: () => { window.location.href = "/feedback?type=feature"; setOpen(false) },
    },
    {
      Icon: Activity01Icon,
      label: "System status",
      desc: "Check platform health",
      color: "#34d399", bg: "#051a10", border: "#0a3020",
      onClick: () => { window.location.href = "/status"; setOpen(false) },
    },
    ...(plan === "team" ? [{
      Icon: CallIcon,
      label: "Book a support call",
      desc: "Talk to us on Google Meet",
      color: "#818cf8", bg: "#0f1020", border: "#1e2040",
      onClick: () => { window.location.href = "/settings?tab=support"; setOpen(false) },
    }] : [{
      Icon: Mail01Icon,
      label: "Contact support",
      desc: "Email the team",
      color: "#818cf8", bg: "#0f1020", border: "#1e2040",
      onClick: () => window.open("mailto:adejare.akolawole@gmail.com?subject=m-ops support", "_blank"),
    }]),
    {
      Icon: CrownIcon,
      label: "Upgrade plan",
      desc: "Unlock Pro & Team features",
      color: "#f59e0b", bg: "#1a1000", border: "#3a2500",
      onClick: () => { window.location.href = "/settings?tab=billing"; setOpen(false) },
      highlight: plan === "free",
    },
  ]

  return (
    <div ref={ref} style={inline ? { position: "relative", display: "inline-flex" } : { position: "fixed", bottom: 24, right: 24, zIndex: 1500 }}>
      {open && (
        <div style={{
          position: "absolute", bottom: inline ? undefined : 56, top: inline ? 46 : undefined, right: 0,
          background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 18,
          width: 300, boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
          overflow: "hidden",
          animation: "helpSlideUp 0.18s ease",
        }}>
          <style>{`@keyframes helpSlideUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>

          {view === "menu" && (
            <>
              <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #1a1a1a" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#e8e8e8", margin: 0 }}>Help & options</p>
                <p style={{ fontSize: 11, color: "#333", margin: 0 }}>Press <kbd style={{ background: "#1a1a1a", border: "1px solid #222", borderRadius: 4, padding: "1px 5px", fontSize: 10, color: "#666" }}>?</kbd> to toggle</p>
              </div>
              <div style={{ padding: "6px 0" }}>
                {menuItems.map((item, i) => {
                  const ItemIcon = item.Icon
                  return (
                    <button key={i} onClick={item.onClick} style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12,
                      padding: "9px 14px", background: "transparent",
                      border: "none", cursor: "pointer", textAlign: "left",
                      transition: "background 0.1s",
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#141414" }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                        background: item.bg,
                        border: `1px solid ${item.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <ItemIcon size={15} color={item.color} />
                      </div>
                      <div>
                        <p style={{ fontSize: 12.5, fontWeight: 600, color: "#d4d4d4", margin: 0 }}>{item.label}</p>
                        <p style={{ fontSize: 11, color: "#333", margin: 0 }}>{item.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div style={{ padding: "10px 14px", borderTop: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#2a2a2a" }}>m-ops · {plan ?? "free"} plan</span>
                <a href="/settings" style={{ fontSize: 11, color: "#444", textDecoration: "none" }}>Settings →</a>
              </div>
            </>
          )}

          {view === "shortcuts" && (
            <>
              <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setView("menu")} style={{ background: "none", border: "none", cursor: "pointer", color: "#444", padding: 0, fontSize: 16, lineHeight: 1 }}>←</button>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#e8e8e8", margin: 0 }}>Keyboard shortcuts</p>
              </div>
              <div style={{ padding: "8px 0 12px" }}>
                {SHORTCUTS.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px" }}>
                    <span style={{ fontSize: 12.5, color: "#666" }}>{s.desc}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {s.keys.map(k => (
                        <kbd key={k} style={{ background: "#161616", border: "1px solid #222", borderRadius: 5, padding: "2px 8px", fontSize: 11, color: "#d4d4d4", fontFamily: "monospace" }}>{k}</kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => { setOpen(o => !o); setView("menu") }}
        style={{
          height: 32, padding: "0 12px", borderRadius: 8,
          background: open ? "#1a0f2e" : "#141414",
          border: `1px solid ${open ? "#3d2a6e" : "#1e1e1e"}`,
          cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
          transition: "all 0.15s ease",
        }}
        title="Help & options (press ?)"
      >
        {open
          ? <Cancel01Icon size={13} color="#a78bfa" />
          : <QuestionIcon size={13} color="#666" />
        }
        <span style={{ fontSize: 12.5, fontWeight: 600, color: open ? "#a78bfa" : "#666" }}>Help</span>
      </button>
    </div>
  )
}
