"use client"
import { AddSquareIcon, ArrowReloadHorizontalIcon, PlugSocketIcon, GridIcon, ChartLineData01Icon, AlertCircleIcon, Settings01Icon, LayerAddIcon, LockPasswordIcon, SourceCodeSquareIcon, Bug01Icon } from "hugeicons-react"
import { cn } from "@/lib/utils"
import { VercelSyncedProject, ManualProject, CheckResult } from "@/lib/types"

type SelectedProject =
  | { type: "vercel"; project: VercelSyncedProject }
  | { type: "manual"; project: ManualProject }

interface SidebarProps {
  vercelProjects: VercelSyncedProject[]
  manualProjects: ManualProject[]
  selected: SelectedProject | null
  onSelect: (s: SelectedProject | null) => void
  activeTab: string
  onTabChange: (tab: string) => void
  vercelConnected: boolean
  syncing: boolean
  onSync: () => void
  onConnectVercel: () => void
  onDisconnectVercel: () => void
  onAddProject: () => void
  onManageVercel: () => void
  uptime: Record<string, { ok: boolean } | undefined>
  history: Record<string, CheckResult[]>
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const ACCENT = "#60a5fa"
const C_OK   = "#4ade80"
const C_CRIT = "#f87171"

const VERCEL_SECTIONS = [
  {
    label: "MONITOR",
    items: [
      { id: "overview",     label: "Overview",     Icon: GridIcon },
      { id: "performance",  label: "Performance",  Icon: ChartLineData01Icon },
      { id: "incidents",    label: "Incidents",    Icon: AlertCircleIcon },
      { id: "insights",     label: "Code Insights", Icon: SourceCodeSquareIcon },
      { id: "debug",        label: "Debug with AI", Icon: Bug01Icon },
    ],
  },
  {
    label: "CONFIGURE",
    items: [
      { id: "admin", label: "Admin", Icon: LockPasswordIcon },
    ],
  },
]

const MANUAL_SECTIONS = [
  {
    label: "MONITOR",
    items: [
      { id: "overview",    label: "Overview",    Icon: GridIcon },
      { id: "performance", label: "Performance", Icon: ChartLineData01Icon },
      { id: "incidents",   label: "Incidents",   Icon: AlertCircleIcon },
      { id: "insights",    label: "Code Insights", Icon: SourceCodeSquareIcon },
      { id: "debug",       label: "Debug with AI", Icon: Bug01Icon },
    ],
  },
  {
    label: "CONFIGURE",
    items: [
      { id: "settings", label: "Settings", Icon: Settings01Icon },
      { id: "cms",      label: "CMS",      Icon: LayerAddIcon },
      { id: "admin",    label: "Admin",    Icon: LockPasswordIcon },
    ],
  },
]

export function Sidebar({
  vercelProjects, manualProjects, selected, onSelect,
  activeTab, onTabChange,
  vercelConnected, syncing, onSync, onConnectVercel, onDisconnectVercel,
  onAddProject, uptime, history,
  mobileOpen = false, onMobileClose,
}: SidebarProps) {
  const sections = selected?.type === "vercel" ? VERCEL_SECTIONS
    : selected?.type === "manual" ? MANUAL_SECTIONS : null

  const getIncidents = (id: string) => {
    const h = history[id] ?? []
    let count = 0, inDown = false
    for (const c of [...h].reverse()) {
      if (c.status !== "online") { if (!inDown) { count++; inDown = true } }
      else inDown = false
    }
    return count
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 39, display: "none" }}
          className="mob-backdrop"
        />
      )}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-aside { position: fixed !important; left: -228px; top: 0; z-index: 40; transition: left 0.25s cubic-bezier(.22,.68,0,1.2) !important; }
          .sidebar-aside.open { left: 0 !important; }
          .mob-backdrop { display: block !important; }
        }
      `}</style>
    <aside className={`sidebar-aside${mobileOpen ? " open" : ""}`} style={{
      width: "228px",
      background: "#080808",
      borderRight: "1px solid #161616",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      flexShrink: 0,
      overflow: "hidden",
    }}>

      {/* ── Brand ── */}
      <div style={{
        height: "56px",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        borderBottom: "1px solid #141414",
        gap: "10px",
        flexShrink: 0,
      }}>
        <span style={{ color: "#fff", fontSize: "15px", fontWeight: 800, letterSpacing: "-0.05em" }}>m-ops</span>
        {onMobileClose && (
          <button onClick={onMobileClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#444", padding: "4px", display: "none" }} className="mob-close-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {/* ── Nav scroll area ── */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 0" }}>

        {/* Dashboard link */}
        <div style={{ padding: "0 10px", marginBottom: "6px" }}>
          <button
            onClick={() => onSelect(null)}
            style={{
              width: "100%", textAlign: "left",
              display: "flex", alignItems: "center", gap: "9px",
              padding: "8px 12px", borderRadius: "8px",
              fontSize: "13px", fontWeight: !selected ? 500 : 400,
              color: !selected ? "#e8e8e8" : "#3a3a3a",
              background: !selected ? "#161616" : "transparent",
              border: "none", cursor: "pointer",
              transition: "background 0.1s, color 0.1s",
            }}
          >
            <GridIcon size={14} style={{ color: !selected ? ACCENT : "#2a2a2a", flexShrink: 0 }} />
            Dashboard
          </button>
        </div>

        {/* ── Vercel projects ── */}
        {vercelConnected && vercelProjects.length > 0 && (
          <div style={{ marginTop: "18px" }}>
            {/* Section header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 22px", marginBottom: "4px",
            }}>
              <span style={{ color: "#282828", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Vercel
              </span>
              <button
                onClick={onSync} disabled={syncing}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#282828", padding: "2px", lineHeight: 0 }}
              >
                <ArrowReloadHorizontalIcon size={10} className={cn(syncing && "animate-spin")} />
              </button>
            </div>

            <div style={{ padding: "0 10px" }}>
              {vercelProjects.map(p => {
                const isActive = selected?.type === "vercel" && selected.project.id === p.id
                const state = p.latestDeployment?.state
                const dotColor = state === "READY" ? C_OK : state === "ERROR" ? C_CRIT : "#282828"

                return (
                  <div key={p.id}>
                    {/* Project row */}
                    <button
                      onClick={() => { onSelect({ type: "vercel", project: p }); onTabChange("overview") }}
                      style={{
                        width: "100%", textAlign: "left",
                        display: "flex", alignItems: "center", gap: "9px",
                        padding: "7px 12px", borderRadius: "8px",
                        fontSize: "13px", fontWeight: isActive ? 500 : 400,
                        color: isActive ? "#e8e8e8" : "#404040",
                        background: isActive ? "#141414" : "transparent",
                        border: "none", cursor: "pointer",
                        transition: "background 0.1s, color 0.1s",
                      }}
                    >
                      <span className={state === "READY" ? "status-dot-nominal" : state === "ERROR" ? "status-dot-offline" : ""} style={{ width: "6px", height: "6px", borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {p.name}
                      </span>
                      {(() => {
                        const checks = history[p.id] ?? []
                        if (checks.length === 0) return null
                        const uPct = Math.round(checks.filter(c => c.status === "online").length / checks.length * 100)
                        return <span style={{ fontSize: "10px", fontVariantNumeric: "tabular-nums", color: uPct >= 99 ? "#2a3a2a" : uPct >= 95 ? "#3a2800" : "#3a1818", flexShrink: 0 }}>{uPct}%</span>
                      })()}
                    </button>

                    {/* Sub-nav (only when selected) */}
                    {isActive && sections && (
                      <div style={{ marginTop: "4px", marginBottom: "8px" }}>
                        {sections.map(section => (
                          <div key={section.label}>
                            <p style={{
                              color: "#202020", fontSize: "9.5px", fontWeight: 700,
                              letterSpacing: "0.1em", textTransform: "uppercase",
                              padding: "10px 22px 5px",
                              margin: 0,
                            }}>
                              {section.label}
                            </p>
                            <div style={{ padding: "0 10px" }}>
                              {section.items.map(({ id, label, Icon }) => {
                                const isTabActive = activeTab === id
                                const ic = id === "incidents" ? getIncidents(p.id) : 0
                                return (
                                  <button
                                    key={id}
                                    onClick={() => onTabChange(id)}
                                    style={{
                                      width: "100%", textAlign: "left",
                                      display: "flex", alignItems: "center", gap: "9px",
                                      padding: "7px 12px", borderRadius: "7px",
                                      fontSize: "12.5px", fontWeight: isTabActive ? 500 : 400,
                                      color: isTabActive ? "#e8e8e8" : "#363636",
                                      background: isTabActive ? "#161616" : "transparent",
                                      border: "none", cursor: "pointer",
                                      transition: "background 0.1s, color 0.1s",
                                    }}
                                  >
                                    <Icon size={13} style={{ color: isTabActive ? ACCENT : "#282828", flexShrink: 0 }} />
                                    <span style={{ flex: 1 }}>{label}</span>
                                    {ic > 0 && (
                                      <span style={{
                                        fontSize: "9px", fontWeight: 700,
                                        background: "#ff000015", color: "#ff5555",
                                        padding: "1px 6px", borderRadius: "99px",
                                      }}>
                                        {ic}
                                      </span>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Manual projects ── */}
        {manualProjects.length > 0 && (
          <div style={{ marginTop: "18px" }}>
            <div style={{ padding: "0 22px", marginBottom: "4px" }}>
              <span style={{ color: "#282828", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Projects
              </span>
            </div>

            <div style={{ padding: "0 10px" }}>
              {manualProjects.map(p => {
                const isActive = selected?.type === "manual" && selected.project.id === p.id
                const u = uptime[p.id]
                const dotColor = u?.ok === true ? C_OK : u?.ok === false ? C_CRIT : "#282828"

                return (
                  <div key={p.id}>
                    <button
                      onClick={() => { onSelect({ type: "manual", project: p }); onTabChange("overview") }}
                      style={{
                        width: "100%", textAlign: "left",
                        display: "flex", alignItems: "center", gap: "9px",
                        padding: "7px 12px", borderRadius: "8px",
                        fontSize: "13px", fontWeight: isActive ? 500 : 400,
                        color: isActive ? "#e8e8e8" : "#404040",
                        background: isActive ? "#141414" : "transparent",
                        border: "none", cursor: "pointer",
                        transition: "background 0.1s, color 0.1s",
                      }}
                    >
                      <span className={u?.ok === true ? "status-dot-nominal" : u?.ok === false ? "status-dot-offline" : ""} style={{ width: "6px", height: "6px", borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {p.name}
                      </span>
                      {(() => {
                        const checks = history[p.id] ?? []
                        if (checks.length === 0) return null
                        const uPct = Math.round(checks.filter(c => c.status === "online").length / checks.length * 100)
                        return <span style={{ fontSize: "10px", fontVariantNumeric: "tabular-nums", color: uPct >= 99 ? "#2a3a2a" : uPct >= 95 ? "#3a2800" : "#3a1818", flexShrink: 0 }}>{uPct}%</span>
                      })()}
                    </button>

                    {isActive && sections && (
                      <div style={{ marginTop: "4px", marginBottom: "8px" }}>
                        {sections.map(section => (
                          <div key={section.label}>
                            <p style={{
                              color: "#202020", fontSize: "9.5px", fontWeight: 700,
                              letterSpacing: "0.1em", textTransform: "uppercase",
                              padding: "10px 22px 5px", margin: 0,
                            }}>
                              {section.label}
                            </p>
                            <div style={{ padding: "0 10px" }}>
                              {section.items.map(({ id, label, Icon }) => {
                                const isTabActive = activeTab === id
                                const ic = id === "incidents" ? getIncidents(p.id) : 0
                                return (
                                  <button
                                    key={id}
                                    onClick={() => onTabChange(id)}
                                    style={{
                                      width: "100%", textAlign: "left",
                                      display: "flex", alignItems: "center", gap: "9px",
                                      padding: "7px 12px", borderRadius: "7px",
                                      fontSize: "12.5px", fontWeight: isTabActive ? 500 : 400,
                                      color: isTabActive ? "#e8e8e8" : "#363636",
                                      background: isTabActive ? "#161616" : "transparent",
                                      border: "none", cursor: "pointer",
                                      transition: "background 0.1s, color 0.1s",
                                    }}
                                  >
                                    <Icon size={13} style={{ color: isTabActive ? ACCENT : "#282828", flexShrink: 0 }} />
                                    <span style={{ flex: 1 }}>{label}</span>
                                    {ic > 0 && (
                                      <span style={{
                                        fontSize: "9px", fontWeight: 700,
                                        background: "#ff000015", color: "#ff5555",
                                        padding: "1px 6px", borderRadius: "99px",
                                      }}>
                                        {ic}
                                      </span>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Connect Vercel prompt */}
        {!vercelConnected && (
          <div style={{ padding: "18px 10px 0" }}>
            <button
              onClick={onConnectVercel}
              style={{
                width: "100%", textAlign: "left",
                display: "flex", alignItems: "center", gap: "8px",
                padding: "8px 12px", borderRadius: "8px",
                fontSize: "12px", color: "#2c2c2c",
                background: "transparent",
                border: "1px dashed #1a1a1a",
                cursor: "pointer",
              }}
            >
              <PlugSocketIcon size={11} style={{ flexShrink: 0 }} />
              Connect Vercel
            </button>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: "12px 10px 16px",
        borderTop: "1px solid #141414",
        flexShrink: 0,
      }}>
        <button
          onClick={onAddProject}
          style={{
            width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
            padding: "9px 0",
            borderRadius: "8px",
            fontSize: "13px", fontWeight: 600,
            background: ACCENT, color: "#fff",
            border: "none", cursor: "pointer",
          }}
        >
          <AddSquareIcon size={13} />
          Add Project
        </button>

        {vercelConnected && (
          <button
            onClick={onDisconnectVercel}
            style={{
              width: "100%", textAlign: "center",
              padding: "8px 0 0",
              fontSize: "11px", color: "#222",
              background: "none", border: "none", cursor: "pointer",
            }}
          >
            Disconnect Vercel
          </button>
        )}
      </div>
    </aside>
    <style>{`@media (max-width: 768px) { .mob-close-btn { display: flex !important; } }`}</style>
    </>
  )
}
