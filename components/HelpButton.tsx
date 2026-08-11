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
}

export function HelpButton({ onAddProject, plan }: Props) {
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
      onClick: () => { resetOnboarding(); window.location.reload() },
    },
    {
      Icon: KeyboardIcon,
      label: "Keyboard shortcuts",
      desc: "Speed up your workflow",
      onClick: () => setView("shortcuts"),
    },
    {
      Icon: BookOpen01Icon,
      label: "Documentation",
      desc: "Guides and API reference",
      onClick: () => window.open("https://m-ops.pro/docs", "_blank"),
    },
    {
      Icon: Bug01Icon,
      label: "Report a bug",
      desc: "Something broken? Let us know",
      onClick: () => window.open("mailto:adejare.akolawole@gmail.com?subject=m-ops bug report", "_blank"),
    },
    {
      Icon: Idea01Icon,
      label: "Request a feature",
      desc: "Suggest something new",
      onClick: () => window.open("mailto:adejare.akolawole@gmail.com?subject=m-ops feature request", "_blank"),
    },
    {
      Icon: Activity01Icon,
      label: "System status",
      desc: "Check platform health",
      onClick: () => window.open("https://status.m-ops.pro", "_blank"),
    },
    ...(plan === "team" ? [{
      Icon: CallIcon,
      label: "Book a support call",
      desc: "Talk to us on Google Meet",
      onClick: () => { window.location.href = "/settings?tab=support"; setOpen(false) },
    }] : [{
      Icon: Mail01Icon,
      label: "Contact support",
      desc: "Email the team",
      onClick: () => window.open("mailto:adejare.akolawole@gmail.com?subject=m-ops support", "_blank"),
    }]),
    {
      Icon: CrownIcon,
      label: "Upgrade plan",
      desc: "Unlock Pro & Team features",
      onClick: () => { window.location.href = "/settings?tab=billing"; setOpen(false) },
      highlight: plan === "free",
    },
  ]

  return (
    <div ref={ref} style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1500 }}>
      {open && (
        <div style={{
          position: "absolute", bottom: 56, right: 0,
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
                      padding: "9px 14px", background: item.highlight ? "#1a0f2e" : "transparent",
                      border: "none", cursor: "pointer", textAlign: "left",
                      transition: "background 0.1s",
                    }}
                      onMouseEnter={e => { if (!item.highlight) (e.currentTarget as HTMLElement).style.background = "#141414" }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = item.highlight ? "#1a0f2e" : "transparent" }}
                    >
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        background: item.highlight ? "#2d1a5e" : "#161616",
                        border: `1px solid ${item.highlight ? "#3d2a6e" : "#222"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <ItemIcon size={14} color={item.highlight ? "#a78bfa" : "#555"} />
                      </div>
                      <div>
                        <p style={{ fontSize: 12.5, fontWeight: 600, color: item.highlight ? "#c4b5fd" : "#d4d4d4", margin: 0 }}>{item.label}</p>
                        <p style={{ fontSize: 11, color: item.highlight ? "#7c3aed" : "#333", margin: 0 }}>{item.desc}</p>
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
          width: 44, height: 44, borderRadius: "50%",
          background: open ? "#1a0f2e" : "#0f0f0f",
          border: `1px solid ${open ? "#3d2a6e" : "#1e1e1e"}`,
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          transition: "all 0.15s ease",
        }}
        title="Help & options (press ?)"
      >
        {open
          ? <Cancel01Icon size={18} color="#a78bfa" />
          : <QuestionIcon size={18} color="#666" />
        }
      </button>
    </div>
  )
}
