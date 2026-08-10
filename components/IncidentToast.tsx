"use client"
import { useEffect, useState, useRef } from "react"

export interface ToastEvent {
  id: string
  type: "down" | "recover" | "deploy"
  projectName: string
  projectId?: string
  message: string
  startedAt: number // unix ms — for timers
  onDiagnose?: () => void
}

interface Props {
  toasts: ToastEvent[]
  onDismiss: (id: string) => void
}

function liveDuration(startedAt: number) {
  const s = Math.floor((Date.now() - startedAt) / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}m ${rem}s`
}

function ToastCard({ toast, onDismiss }: { toast: ToastEvent; onDismiss: () => void }) {
  const [, tick] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Enter animation
    const t = setTimeout(() => setVisible(true), 20)
    return () => clearTimeout(t)
  }, [])

  // Live tick for "down" duration
  useEffect(() => {
    if (toast.type !== "down") return
    const t = setInterval(() => tick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [toast.type])

  // Auto-dismiss recovers after 5s
  useEffect(() => {
    if (toast.type !== "recover" && toast.type !== "deploy") return
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 350)
    }, 5000)
    return () => clearTimeout(t)
  }, [toast.type, onDismiss])

  const isDown = toast.type === "down"
  const isRecover = toast.type === "recover"
  const color = isDown ? "#f87171" : isRecover ? "#4ade80" : "#60a5fa"
  const bg = isDown ? "#f8717108" : isRecover ? "#4ade8008" : "#60a5fa08"

  return (
    <div
      style={{
        background: "#111", border: `1px solid ${color}35`,
        borderRadius: "14px", padding: "14px 16px",
        display: "flex", flexDirection: "column", gap: "6px",
        boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${color}12`,
        transform: visible ? "translateX(0)" : "translateX(24px)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease",
        width: "300px",
        background2: bg,
      } as React.CSSProperties}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ position: "relative", width: "8px", height: "8px", flexShrink: 0 }}>
            <span style={{
              position: "absolute", inset: 0, borderRadius: "50%", background: color,
              animation: isDown ? "status-pulse 1s ease-in-out infinite" : undefined,
              // @ts-expect-error css var
              "--dot-color": color,
            }} />
          </span>
          <span style={{ color: "#e8e8e8", fontSize: "13px", fontWeight: 600 }}>{toast.projectName}</span>
        </div>
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 350) }}
          style={{ color: "#333", background: "none", border: "none", cursor: "pointer", fontSize: "16px", lineHeight: 1, marginTop: "-2px", flexShrink: 0 }}
        >
          ×
        </button>
      </div>

      <p style={{ color: isDown ? "#f87171" : isRecover ? "#4ade80" : "#888", fontSize: "12.5px", paddingLeft: "16px" }}>
        {toast.message}
      </p>

      {/* Live incident timer */}
      {isDown && (
        <div style={{ paddingLeft: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#f87171", animation: "status-pulse 1s ease-in-out infinite" }} />
            <span style={{ color: "#484848", fontSize: "11px", fontVariantNumeric: "tabular-nums" }}>
              Down for <span style={{ color: "#f87171", fontWeight: 600 }}>{liveDuration(toast.startedAt)}</span>
            </span>
          </div>
          {toast.onDiagnose && (
            <button
              onClick={toast.onDiagnose}
              style={{ fontSize: "11px", fontWeight: 600, color: "#f87171", background: "#f8717115", border: "1px solid #f8717130", borderRadius: "6px", padding: "3px 10px", cursor: "pointer" }}
            >
              ⚡ Diagnose
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function IncidentToasts({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null

  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px", zIndex: 200,
      display: "flex", flexDirection: "column-reverse", gap: "10px",
    }}>
      {toasts.map(t => (
        <ToastCard key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  )
}
