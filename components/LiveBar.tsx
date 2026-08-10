"use client"
import { useEffect, useState, useRef } from "react"

interface LiveEvent {
  id: string
  projectName: string
  message: string
  ms?: number
  type: "check" | "down" | "recover"
}

interface Props {
  onCheck?: (projectId: string, projectName: string, url: string) => Promise<{ ok: boolean; ms: number }>
  projects: { id: string; name: string; url: string }[]
  intervalSecs?: number
}

export function LiveBar({ projects, intervalSecs = 60 }: Props) {
  const [current, setCurrent] = useState<LiveEvent | null>(null)
  const [countdown, setCountdown] = useState(intervalSecs)
  const [visible, setVisible] = useState(false)
  const queueRef = useRef<LiveEvent[]>([])
  const showingRef = useRef(false)

  // Countdown to next check
  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) return intervalSecs
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [intervalSecs])

  function enqueue(ev: LiveEvent) {
    queueRef.current.push(ev)
    if (!showingRef.current) showNext()
  }

  function showNext() {
    const ev = queueRef.current.shift()
    if (!ev) { showingRef.current = false; return }
    showingRef.current = true
    setCurrent(ev)
    setVisible(true)
    setTimeout(() => {
      setVisible(false)
      setTimeout(showNext, 400)
    }, ev.type === "check" ? 2200 : 4000)
  }

  // Expose enqueue globally so the uptime checker can push events
  useEffect(() => {
    // @ts-expect-error global
    window.__liveBarEnqueue = enqueue
    return () => {
      // @ts-expect-error global
      delete window.__liveBarEnqueue
    }
  })

  if (!current) return null

  const isDown = current.type === "down"
  const isRecover = current.type === "recover"
  const color = isDown ? "#f87171" : isRecover ? "#4ade80" : "#60a5fa"

  return (
    <div
      style={{
        position: "fixed", bottom: "24px", left: "50%", transform: `translateX(-50%) translateY(${visible ? "0" : "12px"})`,
        opacity: visible ? 1 : 0, transition: "opacity 0.3s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1)",
        zIndex: 100, pointerEvents: "none",
        background: "#111", border: `1px solid ${color}30`,
        borderRadius: "99px", padding: "8px 16px 8px 12px",
        display: "flex", alignItems: "center", gap: "10px",
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${color}18`,
        backdropFilter: "blur(12px)",
        whiteSpace: "nowrap",
      }}
    >
      {/* Animated dot */}
      <span style={{ position: "relative", width: "8px", height: "8px", flexShrink: 0 }}>
        <span style={{
          position: "absolute", inset: 0, borderRadius: "50%", background: color,
          animation: isDown ? "status-pulse 1s ease-in-out infinite" : "status-glow 2s ease-in-out infinite",
          // @ts-expect-error css var
          "--dot-color": color,
        }} />
      </span>

      <span style={{ color: "#aaa", fontSize: "12px" }}>
        <span style={{ color: "#e8e8e8", fontWeight: 600 }}>{current.projectName}</span>
        {" "}
        <span style={{ color: "#484848" }}>—</span>
        {" "}
        <span style={{ color: isDown ? "#f87171" : isRecover ? "#4ade80" : "#606060" }}>{current.message}</span>
        {current.ms != null && (
          <span style={{ color: color, marginLeft: "6px", fontVariantNumeric: "tabular-nums" }}>{current.ms}ms</span>
        )}
      </span>

      {/* Next check countdown (only on regular checks) */}
      {!isDown && !isRecover && (
        <span style={{ color: "#282828", fontSize: "11px", marginLeft: "4px", fontVariantNumeric: "tabular-nums" }}>
          next in {countdown}s
        </span>
      )}
    </div>
  )
}

export function pushLiveEvent(ev: Omit<LiveEvent, "id">) {
  // @ts-expect-error global
  window.__liveBarEnqueue?.({ ...ev, id: Math.random().toString(36).slice(2) })
}
