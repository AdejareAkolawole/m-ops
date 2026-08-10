"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { VercelSyncedProject, ManualProject, CheckResult } from "@/lib/types"

interface Props {
  vercelProjects: VercelSyncedProject[]
  manualProjects: ManualProject[]
  uptime: Record<string, { ok: boolean; responseMs?: number } | undefined>
  history: Record<string, CheckResult[]>
  onOpen: (id: string, type: "vercel" | "manual") => void
  onClose: () => void
}

const PALETTE = ["#60a5fa","#a78bfa","#34d399","#f472b6","#fb923c","#facc15","#38bdf8","#e879f9","#4ade80","#f87171"]

// Generate once — stable across renders
const STARS = Array.from({ length: 220 }, (_, i) => ({
  id: i,
  x: (Math.sin(i * 9.7) * 0.5 + 0.5) * 100,
  y: (Math.cos(i * 7.3) * 0.5 + 0.5) * 100,
  r: (Math.sin(i * 3.1) * 0.5 + 0.5) * 1.8 + 0.2,
  twinkleDelay: (i % 5) * 0.9,
  twinkleDur: 2 + (i % 4) * 0.7,
  brightness: 0.2 + (Math.sin(i * 5.3) * 0.5 + 0.5) * 0.7,
}))

const SHOOTERS = Array.from({ length: 4 }, (_, i) => ({
  id: i,
  delay: i * 7 + 2,
  dur: 1.4,
  y: 10 + i * 18,
}))

export function CommandCenter({ vercelProjects, manualProjects, uptime, history, onOpen, onClose }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [dim, setDim] = useState({ w: 1400, h: 900 })
  const [now, setNow] = useState(() => Date.now() / 1000)
  const [timeStr, setTimeStr] = useState("")
  const rafRef = useRef<number>(0)

  // Resize
  useEffect(() => {
    const update = () => setDim({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  // Animation loop
  useEffect(() => {
    let running = true
    function loop() {
      if (!running) return
      setNow(Date.now() / 1000)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => { running = false; cancelAnimationFrame(rafRef.current) }
  }, [])

  // Clock
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setTimeStr(`${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}:${String(d.getUTCSeconds()).padStart(2,"0")} UTC`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // ESC to close
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [onClose])

  const cx = dim.w / 2
  const cy = dim.h / 2 - 30

  const allProjects = [
    ...vercelProjects.map(p => ({ ...p, kind: "vercel" as const })),
    ...manualProjects.map(p => ({ ...p, kind: "manual" as const })),
  ]

  const planets = allProjects.map((p, i) => {
    const color = PALETTE[i % PALETTE.length]
    const orbitRx = 155 + i * 85
    const orbitRy = orbitRx * 0.28
    const period = 22 + i * 9
    const startAngle = i * 2.399 // golden angle
    const angle = ((now / period) * Math.PI * 2) + startAngle
    const x = cx + Math.cos(angle) * orbitRx
    const y = cy + Math.sin(angle) * orbitRy

    const u = uptime[p.id]
    const statusColor = u?.ok === true ? "#4ade80" : u?.ok === false ? "#f87171" : "#555"
    const statusLabel = u?.ok === true ? "NOMINAL" : u?.ok === false ? "DOWN" : "UNKNOWN"
    const checks = history[p.id] ?? []
    const uPct = checks.length > 0
      ? Math.round(checks.filter(c => c.status === "online").length / checks.length * 100)
      : null
    const lastMs = u?.responseMs

    return { id: p.id, name: p.name, kind: p.kind, color, orbitRx, orbitRy, x, y, statusColor, statusLabel, uPct, lastMs }
  })

  const selPlanet = planets.find(p => p.id === selected) ?? null
  const nominalCount = planets.filter(p => uptime[p.id]?.ok === true).length
  const downCount = planets.filter(p => uptime[p.id]?.ok === false).length

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#020509", overflow: "hidden" }}>

      {/* ── Starfield + orbits + planets ── */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          {/* Hub gradient */}
          <radialGradient id="cc-hub" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#2563eb" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#1e40af" stopOpacity="0" />
          </radialGradient>
          {/* Planet gradients */}
          {PALETTE.map((c, i) => (
            <radialGradient key={i} id={`cc-p${i}`} cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="white" stopOpacity="0.5" />
              <stop offset="40%" stopColor={c} stopOpacity="0.95" />
              <stop offset="100%" stopColor={c} stopOpacity="0.7" />
            </radialGradient>
          ))}
          {/* Outer ambient glow filter */}
          <filter id="cc-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="cc-glow-soft" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>

        {/* Stars */}
        {STARS.map(s => (
          <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white" opacity={s.brightness}>
            <animate attributeName="opacity"
              values={`${s.brightness};${s.brightness * 0.15};${s.brightness}`}
              dur={`${s.twinkleDur}s`} begin={`${s.twinkleDelay}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* Shooting stars */}
        {SHOOTERS.map(s => (
          <line key={s.id}
            x1="-60" y1={`${s.y}%`} x2="0" y2={`${s.y}%`}
            stroke="white" strokeWidth="1.2" strokeOpacity="0.7"
            strokeLinecap="round"
          >
            <animateTransform attributeName="transform" type="translate"
              from="0 0" to={`${dim.w + 100} 0`}
              dur={`${s.dur}s`} begin={`${s.delay}s`} repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0;0.8;0" dur={`${s.dur}s`} begin={`${s.delay}s`} repeatCount="indefinite" />
          </line>
        ))}

        {/* Orbit rings */}
        {planets.map(p => (
          <ellipse key={`orb-${p.id}`}
            cx={cx} cy={cy} rx={p.orbitRx} ry={p.orbitRy}
            fill="none" stroke="white" strokeWidth="0.4" strokeOpacity="0.04"
            strokeDasharray="3 12"
          />
        ))}

        {/* Hub ambient */}
        <circle cx={cx} cy={cy} r={160} fill="url(#cc-hub)" />

        {/* Hub pulse rings */}
        {[60, 90, 120].map((r, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="#3b82f6" strokeWidth="0.5" strokeOpacity="0.1">
            <animate attributeName="r" values={`${r};${r+20};${r}`} dur={`${4+i}s`} repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0.1;0;0.1" dur={`${4+i}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* Hub core */}
        <circle cx={cx} cy={cy} r={32} fill="#0c1a2e" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.4" />
        <circle cx={cx} cy={cy} r={22} fill="#1d4ed8" fillOpacity="0.6">
          <animate attributeName="r" values="22;25;22" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={9} fill="white" fillOpacity="0.95" />
        <circle cx={cx-3} cy={cy-3} r={3} fill="white" fillOpacity="0.6" />

        {/* Planets */}
        {planets.map((p, i) => {
          const isSel = selected === p.id
          const pr = isSel ? 13 : 10
          const ci = i % PALETTE.length
          const glowR = isSel ? 36 : 26

          return (
            <g key={p.id} onClick={() => setSelected(isSel ? null : p.id)} style={{ cursor: "pointer" }}>
              {/* Soft ambient glow */}
              <circle cx={p.x} cy={p.y} r={glowR} fill={p.color} opacity={isSel ? 0.18 : 0.1} filter="url(#cc-glow-soft)" />

              {/* Status orbit ring */}
              <circle cx={p.x} cy={p.y} r={pr + 6}
                fill="none" stroke={p.statusColor} strokeWidth="1.5"
                strokeOpacity={p.statusColor === "#555" ? 0.15 : 0.5}>
                {p.statusColor !== "#555" && (
                  <animate attributeName="r" values={`${pr+4};${pr+9};${pr+4}`} dur="2.5s" repeatCount="indefinite" />
                )}
                {p.statusColor !== "#555" && (
                  <animate attributeName="stroke-opacity" values="0.5;0.1;0.5" dur="2.5s" repeatCount="indefinite" />
                )}
              </circle>

              {/* Planet body */}
              <circle cx={p.x} cy={p.y} r={pr}
                fill={`url(#cc-p${ci})`}
                stroke={p.color} strokeWidth={isSel ? 2 : 1.5} strokeOpacity={isSel ? 1 : 0.7}
                filter={isSel ? "url(#cc-glow)" : undefined}
              />

              {/* Name label */}
              <text x={p.x} y={p.y + pr + 16}
                textAnchor="middle" fill="white" fontSize="11"
                fontFamily="-apple-system,system-ui,sans-serif"
                fontWeight={isSel ? 700 : 400}
                opacity={isSel ? 0.95 : 0.6}>
                {p.name}
              </text>

              {/* Status + uptime */}
              {p.uPct !== null && (
                <text x={p.x} y={p.y + pr + 29}
                  textAnchor="middle" fill={p.statusColor} fontSize="9"
                  fontFamily="-apple-system,system-ui,sans-serif" opacity="0.7"
                  style={{ fontVariantNumeric: "tabular-nums" }}>
                  {p.uPct}% uptime
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* ── Hub label ── */}
      <div style={{
        position: "absolute",
        left: cx, top: cy - 58,
        transform: "translateX(-50%)",
        textAlign: "center", pointerEvents: "none",
      }}>
        <p style={{ color: "#2563eb", fontSize: "9px", fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase", margin: 0, opacity: 0.8 }}>
          PROJECT HUB
        </p>
      </div>

      {/* ── Top bar ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "52px",
        background: "linear-gradient(to bottom, rgba(2,5,9,0.9), transparent)",
        display: "flex", alignItems: "center", padding: "0 28px",
        gap: "24px",
      }}>
        <span style={{ color: "#1e3a5f", fontSize: "10px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          COMMAND CENTER
        </span>
        <span style={{ color: "#0f2040", fontSize: "10px", letterSpacing: "0.08em", fontVariantNumeric: "tabular-nums" }}>
          {timeStr}
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={{
          color: "#1e3a5f", fontSize: "11px", background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)", borderRadius: "7px",
          padding: "5px 14px", cursor: "pointer", letterSpacing: "0.05em",
          transition: "color 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.color = "#60a5fa"}
          onMouseLeave={e => e.currentTarget.style.color = "#1e3a5f"}
        >
          ← Back
        </button>
      </div>

      {/* ── Info panel (right slide) ── */}
      {selPlanet && (
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: "300px",
          background: "rgba(2,5,9,0.94)", backdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(255,255,255,0.05)",
          display: "flex", flexDirection: "column",
          padding: "64px 24px 90px",
          gap: "20px",
          animation: "slideInRight 0.25s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "9px", height: "9px", borderRadius: "50%",
              background: selPlanet.statusColor,
              boxShadow: `0 0 10px ${selPlanet.statusColor}`,
            }} />
            <span style={{ color: selPlanet.statusColor, fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em" }}>
              {selPlanet.statusLabel}
            </span>
          </div>

          <div>
            <h2 style={{ color: "#fff", fontSize: "20px", fontWeight: 700, margin: 0 }}>{selPlanet.name}</h2>
            <p style={{ color: "#222", fontSize: "11px", margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {selPlanet.kind === "vercel" ? "Vercel" : "Manual"}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {selPlanet.uPct !== null && (
              <Stat label="Uptime" value={`${selPlanet.uPct}%`}
                valueColor={selPlanet.uPct >= 99 ? "#4ade80" : selPlanet.uPct >= 95 ? "#fb923c" : "#f87171"} />
            )}
            {selPlanet.lastMs != null && (
              <Stat label="Response" value={`${selPlanet.lastMs}ms`}
                valueColor={selPlanet.lastMs < 400 ? "#4ade80" : selPlanet.lastMs < 1000 ? "#fb923c" : "#f87171"} />
            )}
            <Stat label="Checks" value={`${history[selPlanet.id]?.length ?? 0}`} valueColor="#60a5fa" />
          </div>

          {/* Uptime bar */}
          {(() => {
            const checks = history[selPlanet.id] ?? []
            if (checks.length === 0) return null
            const last30 = checks.slice(-30)
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <p style={{ color: "#1a1a1a", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>Last 30 checks</p>
                <div style={{ display: "flex", gap: "2px" }}>
                  {last30.map((c, i) => (
                    <div key={i} style={{
                      flex: 1, height: "28px", borderRadius: "2px",
                      background: c.status === "online" ? "#4ade80" : "#f87171",
                      opacity: 0.7,
                    }} />
                  ))}
                </div>
              </div>
            )
          })()}

          <div style={{ flex: 1 }} />

          <button
            onClick={() => { onOpen(selPlanet.id, selPlanet.kind); onClose() }}
            style={{
              padding: "13px", borderRadius: "10px",
              background: selPlanet.color, color: "#000",
              fontWeight: 700, fontSize: "13px", border: "none",
              cursor: "pointer", letterSpacing: "0.02em",
            }}
          >
            Open Dashboard →
          </button>
        </div>
      )}

      {/* ── Bottom HUD ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0,
        right: selPlanet ? "300px" : 0,
        height: "52px",
        background: "linear-gradient(to top, rgba(2,5,9,0.92), transparent)",
        display: "flex", alignItems: "center",
        padding: "0 32px", gap: "32px",
        borderTop: "1px solid rgba(255,255,255,0.03)",
      }}>
        <HudItem dot="#4ade80" label={`${nominalCount} NOMINAL`} />
        {downCount > 0 && <HudItem dot="#f87171" label={`${downCount} DOWN`} />}
        <HudItem dot="#3b82f6" label={`${planets.length} SERVICES`} />
        <div style={{ flex: 1 }} />
        <span style={{ color: "#0f1f35", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          press ESC to exit
        </span>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function Stat({ label, value, valueColor }: { label: string; value: string; valueColor: string }) {
  return (
    <div style={{ background: "#060d16", borderRadius: "10px", padding: "12px 14px" }}>
      <p style={{ color: "#1a1a1a", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>{label}</p>
      <p style={{ color: valueColor, fontSize: "22px", fontWeight: 700, margin: 0, fontVariantNumeric: "tabular-nums" }}>{value}</p>
    </div>
  )
}

function HudItem({ dot, label }: { dot: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: dot, boxShadow: `0 0 6px ${dot}` }} />
      <span style={{ color: "#0f2040", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em" }}>{label}</span>
    </div>
  )
}
