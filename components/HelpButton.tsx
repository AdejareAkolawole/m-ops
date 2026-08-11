"use client"
import { useState, useEffect, useRef } from "react"
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
  const [view, setView] = useState<"menu" | "shortcuts" | "status">("menu")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "?" && !["INPUT","TEXTAREA","SELECT"].includes((e.target as HTMLElement).tagName)) {
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
      icon: "🎓",
      label: "Restart tour",
      desc: "Walk through onboarding again",
      onClick: () => { resetOnboarding(); window.location.reload() },
    },
    {
      icon: "⌨️",
      label: "Keyboard shortcuts",
      desc: "Speed up your workflow",
      onClick: () => setView("shortcuts"),
    },
    {
      icon: "📖",
      label: "Documentation",
      desc: "Guides and API reference",
      onClick: () => window.open("https://m-ops.pro/docs", "_blank"),
    },
    {
      icon: "🐛",
      label: "Report a bug",
      desc: "Something broken? Let us know",
      onClick: () => window.open("mailto:adejare.akolawole@gmail.com?subject=m-ops bug report", "_blank"),
    },
    {
      icon: "💡",
      label: "Request a feature",
      desc: "Suggest something new",
      onClick: () => window.open("mailto:adejare.akolawole@gmail.com?subject=m-ops feature request", "_blank"),
    },
    {
      icon: "🟢",
      label: "System status",
      desc: "Check platform health",
      onClick: () => window.open("https://status.m-ops.pro", "_blank"),
    },
    ...(plan === "team" ? [{
      icon: "📞",
      label: "Book a support call",
      desc: "Talk to us on Google Meet",
      onClick: () => { window.location.href = "/settings?tab=support"; setOpen(false) },
    }] : [{
      icon: "✉️",
      label: "Contact support",
      desc: "Email the team",
      onClick: () => window.open("mailto:adejare.akolawole@gmail.com?subject=m-ops support", "_blank"),
    }]),
    {
      icon: "⭐",
      label: "Upgrade plan",
      desc: "Unlock Pro & Team features",
      onClick: () => { window.location.href = "/settings?tab=billing"; setOpen(false) },
      highlight: plan === "free",
    },
  ]

  return (
    <div ref={ref} style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1500 }}>
      {/* Panel */}
      {open && (
        <div style={{
          position: "absolute", bottom: 56, right: 0,
          background: "#111", border: "1px solid #222", borderRadius: 16,
          width: 300, boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
          overflow: "hidden",
          animation: "helpSlideUp 0.18s ease",
        }}>
          <style>{`@keyframes helpSlideUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>

          {view === "menu" && (
            <>
              <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #1a1a1a" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#e8e8e8", margin: 0 }}>Help & options</p>
                <p style={{ fontSize: 11, color: "#444", margin: 0 }}>Press <kbd style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 4, padding: "1px 5px", fontSize: 10, color: "#888" }}>?</kbd> to toggle</p>
              </div>
              <div style={{ padding: "6px 0" }}>
                {menuItems.map((item, i) => (
                  <button key={i} onClick={item.onClick} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "9px 16px", background: item.highlight ? "#1e1b4b" : "transparent",
                    border: "none", cursor: "pointer", textAlign: "left",
                    transition: "background 0.1s",
                  }}
                    onMouseEnter={e => { if (!item.highlight) (e.currentTarget as HTMLElement).style.background = "#161616" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = item.highlight ? "#1e1b4b" : "transparent" }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                    <div>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: item.highlight ? "#a5b4fc" : "#e8e8e8", margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: 11, color: item.highlight ? "#6366f1" : "#444", margin: 0 }}>{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ padding: "10px 16px", borderTop: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#333" }}>m-ops · {plan ?? "free"} plan</span>
                <a href="/settings" style={{ fontSize: 11, color: "#555", textDecoration: "none" }}>Settings →</a>
              </div>
            </>
          )}

          {view === "shortcuts" && (
            <>
              <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setView("menu")} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: 0, fontSize: 16 }}>←</button>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#e8e8e8", margin: 0 }}>Keyboard shortcuts</p>
              </div>
              <div style={{ padding: "8px 0 12px" }}>
                {SHORTCUTS.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px" }}>
                    <span style={{ fontSize: 12.5, color: "#888" }}>{s.desc}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {s.keys.map(k => (
                        <kbd key={k} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 5, padding: "2px 8px", fontSize: 11, color: "#e8e8e8", fontFamily: "monospace" }}>{k}</kbd>
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
          background: open ? "#1e1b4b" : "#141414",
          border: `1px solid ${open ? "#3730a3" : "#222"}`,
          color: open ? "#a5b4fc" : "#888",
          fontSize: 18, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          transition: "all 0.15s ease",
        }}
        title="Help & options (press ?)"
      >
        {open ? "×" : "?"}
      </button>
    </div>
  )
}
