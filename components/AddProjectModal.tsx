"use client"
import { useState } from "react"
import { Cancel01Icon, Copy01Icon, CheckmarkCircle02Icon, ArrowDown01Icon, ArrowUp01Icon, AddSquareIcon } from "hugeicons-react"
import { ProjectConfig, HostingProvider } from "@/lib/types"

import { cn } from "@/lib/utils"

interface Props {
  onClose: () => void
  onAdded: (p: ProjectConfig) => void
  onConnectVercel?: () => void
  onConnectProvider?: (provider: HostingProvider) => void
}

// ── Accurate brand logos (match ConnectProvider.tsx) ─────────────────────────

const VercelMark = () => (
  <svg width="16" height="16" viewBox="0 0 76 65" fill="#fff" xmlns="http://www.w3.org/2000/svg">
    <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
  </svg>
)

const NetlifyMark = () => (
  <svg width="20" height="20" viewBox="0 0 105 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 10H37C41 10 44 12.5 44 17V63C44 67.5 41 70 37 70H19C15 70 12 67.5 12 63V17C12 15 13 10 19 10Z" fill="#05BDBA"/>
    <path d="M44 38H93V52H44V38Z" fill="#05BDBA"/>
    <path d="M57 10H75C79 10 82 13 82 17V30H57V10Z" fill="#05BDBA"/>
    <path d="M57 50H82V63C82 67 79 70 75 70H57V50Z" fill="#05BDBA"/>
  </svg>
)

const RailwayMark = () => (
  <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="18" fill="#0B0D0E"/>
    <path d="M22 28H55C61.6 28 67 33.4 67 40C67 46.6 61.6 52 55 52H40L54 72H43L29 52H22V28Z" fill="#C8FF00"/>
    <rect x="22" y="62" width="12" height="10" fill="#C8FF00"/>
  </svg>
)

const RenderMark = () => (
  <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="18" fill="#46E3B7"/>
    <path d="M26 20H52C64.2 20 74 29.8 74 42C74 51.4 68.4 59.5 60.2 63.1L76 80H62L48 65.5H38V80H26V20Z" fill="white"/>
    <path d="M38 32V53.5H52C58.4 53.5 63.5 48.4 63.5 42C63.5 35.6 58.4 30.5 52 30.5H38V32Z" fill="#46E3B7"/>
  </svg>
)

const FlyMark = () => (
  <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="18" fill="#7C3AED"/>
    <path d="M50 12C50 12 78 27 78 50C78 64 69 75 62 75C55 75 53 68 50 68C47 68 45 75 38 75C31 75 22 64 22 50C22 27 50 12 50 12Z" fill="white"/>
    <circle cx="50" cy="48" r="11" fill="#7C3AED"/>
    <circle cx="50" cy="48" r="5" fill="white"/>
    <path d="M41 75L37 88H63L59 75H41Z" fill="white"/>
  </svg>
)

const HerokuMark = () => (
  <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="18" fill="#430098"/>
    <path d="M28 14H40V44L63 24H77L52 50L77 86H63L40 55V86H28V14Z" fill="white"/>
    <path d="M63 14H75V28H63V14Z" fill="#00AEEF"/>
  </svg>
)

type Step = "type" | "form" | "code" | "done"

export function AddProjectModal({ onClose, onAdded, onConnectVercel, onConnectProvider }: Props) {
  const [step, setStep] = useState<Step>("type")
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [hubSecret] = useState(() => generateSecret())
  const [healthEndpoint, setHealthEndpoint] = useState("/api/hub/health")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [error, setError] = useState("")
  const [project, setProject] = useState<ProjectConfig | null>(null)
  const [copied, setCopied] = useState<Record<string, boolean>>({})

  function handleNext() {
    if (!name.trim() || !url.trim()) { setError("Name and URL are required"); return }
    let normalized = url.trim()
    if (!normalized.startsWith("http")) normalized = "https://" + normalized
    setError("")
    const p: ProjectConfig = {
      id: crypto.randomUUID(),
      name: name.trim(),
      url: normalized,
      hubSecret,
      healthEndpoint,
      description: description.trim() || undefined,
      addedAt: new Date().toISOString(),
    }
    setProject(p)
    setStep("code")
  }

  function handleFinish() {
    if (!project) return
    onAdded(project)
  }

  function copy(key: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopied((prev) => ({ ...prev, [key]: true }))
    setTimeout(() => setCopied((prev) => ({ ...prev, [key]: false })), 2000)
  }

  const filePath = `app${healthEndpoint}/route.ts`
  const routeCode = generateHealthCode(hubSecret, healthEndpoint)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              {step === "type" ? "Add Project" : step === "form" ? "Custom Project" : step === "code" ? "Set up health reporting" : "Done"}
            </h2>
            {step !== "type" && (
              <div className="flex items-center gap-1 mt-1">
                {(["form", "code", "done"] as Step[]).map((s) => (
                  <span key={s} className={cn(
                    "h-1 rounded-full transition-all",
                    step === s ? "w-6 bg-zinc-900 dark:bg-white" : "w-2 bg-zinc-200 dark:bg-zinc-700"
                  )} />
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <Cancel01Icon size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* STEP 0: type selection */}
          {step === "type" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "4px" }}>
              <p style={{ color: "#383838", fontSize: "12px", marginBottom: "6px" }}>Where is your project hosted?</p>

              <ProviderButton
                onClick={() => { onClose(); onConnectVercel?.() }}
                hoverColor="#fff"
                logo={<div style={{ background: "#111", borderRadius: "8px", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center" }}><VercelMark /></div>}
                name="Vercel"
                desc="Import deployments, domains, and analytics from your Vercel account"
                badge="Native integration"
                badgeColor="#60a5fa"
              />
              <ProviderButton
                onClick={() => { onClose(); onConnectProvider?.("netlify") }}
                hoverColor="#05BDBA"
                logo={<div style={{ background: "#05BDBA12", border: "1px solid #05BDBA22", borderRadius: "10px", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center" }}><NetlifyMark /></div>}
                name="Netlify"
                desc="Connect your Netlify account — sites, deploys, and uptime"
              />
              <ProviderButton
                onClick={() => { onClose(); onConnectProvider?.("railway") }}
                hoverColor="#C8FF00"
                logo={<div style={{ background: "#C8FF0010", border: "1px solid #C8FF0022", borderRadius: "10px", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center" }}><RailwayMark /></div>}
                name="Railway"
                desc="Import Railway projects and track service uptime"
              />
              <ProviderButton
                onClick={() => { onClose(); onConnectProvider?.("render") }}
                hoverColor="#46E3B7"
                logo={<div style={{ background: "#46E3B710", border: "1px solid #46E3B722", borderRadius: "10px", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center" }}><RenderMark /></div>}
                name="Render"
                desc="Connect Render and monitor web services, workers, and static sites"
              />
              <ProviderButton
                onClick={() => { onClose(); onConnectProvider?.("flyio") }}
                hoverColor="#a78bfa"
                logo={<div style={{ background: "#a78bfa10", border: "1px solid #a78bfa22", borderRadius: "10px", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center" }}><FlyMark /></div>}
                name="Fly.io"
                desc="Import Fly apps and keep an eye on global deployments"
              />
              <ProviderButton
                onClick={() => { onClose(); onConnectProvider?.("heroku") }}
                hoverColor="#b39ddb"
                logo={<div style={{ background: "#b39ddb10", border: "1px solid #b39ddb22", borderRadius: "10px", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center" }}><HerokuMark /></div>}
                name="Heroku"
                desc="Connect Heroku and monitor your dynos and apps"
              />

              <div style={{ height: "1px", background: "#181818", margin: "4px 0" }} />

              <ProviderButton
                onClick={() => setStep("form")}
                hoverColor="#4ade80"
                logo={<div style={{ background: "#4ade8012", border: "1px solid #4ade8022", borderRadius: "10px", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center" }}><AddSquareIcon size={16} style={{ color: "#4ade80" }} /></div>}
                name="Other / Custom URL"
                desc="Monitor any URL — uptime, response time, SSL, DNS checks"
              />
            </div>
          )}

          {/* STEP 1: form */}
          {step === "form" && (
            <div className="space-y-4">
              <Field label="Project name *">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  placeholder="My App"
                  className={inputCls}
                />
              </Field>
              <Field label="Production URL *">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  placeholder="https://myapp.com"
                  className={inputCls}
                />
              </Field>
              <Field label="Description">
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What this project does"
                  className={inputCls}
                />
              </Field>

              <button
                onClick={() => setShowAdvanced((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {showAdvanced ? <ArrowUp01Icon size={11} /> : <ArrowDown01Icon size={11} />}
                Advanced
              </button>

              {showAdvanced && (
                <Field label="Health endpoint path" hint="The hub will call this URL to get DB status, user counts, revenue, etc.">
                  <input
                    value={healthEndpoint}
                    onChange={(e) => setHealthEndpoint(e.target.value)}
                    placeholder="/api/hub/health"
                    className={cn(inputCls, "font-mono text-xs")}
                  />
                </Field>
              )}

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button onClick={handleNext} className={btnPrimary}>
                Continue →
              </button>

              <p className="text-xs text-zinc-400 text-center">
                Basic uptime monitoring starts immediately. The next step sets up rich health data.
              </p>
            </div>
          )}

          {/* STEP 2: code */}
          {step === "code" && project && (
            <div className="space-y-5">
              <p className="text-xs text-zinc-500 leading-relaxed">
                Add these two things to <strong className="text-zinc-700 dark:text-zinc-300">{project.name}</strong> so the hub can see your DB status, user counts, revenue, and more. Takes 2 minutes. You can skip and only get uptime monitoring.
              </p>

              {/* 1 — env var */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white">Add this environment variable to your hosting platform</p>
                </div>
                <div className="rounded-xl bg-zinc-950 dark:bg-black border border-zinc-800 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium">.env / hosting dashboard</span>
                    <button onClick={() => copy("env", `HUB_SECRET=${hubSecret}`)}
                      className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200">
                      {copied.env ? <><CheckmarkCircle02Icon size={9} className="text-emerald-400" /> Copied</> : <><Copy01Icon size={9} /> Copy</>}
                    </button>
                  </div>
                  <code className="text-xs font-mono text-emerald-400 break-all">
                    HUB_SECRET=<span className="text-zinc-300">{hubSecret}</span>
                  </code>
                </div>
              </div>

              {/* 2 — file */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white">Create this file in your project</p>
                </div>
                <div className="rounded-xl bg-zinc-950 dark:bg-black border border-zinc-800 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
                    <span className="text-[10px] font-mono text-zinc-500">{filePath}</span>
                    <button onClick={() => copy("code", routeCode)}
                      className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200">
                      {copied.code ? <><CheckmarkCircle02Icon size={9} className="text-emerald-400" /> Copied</> : <><Copy01Icon size={9} /> Copy code</>}
                    </button>
                  </div>
                  <pre className="p-3 text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre">{routeCode}</pre>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Edit the return value to pull real data from your database — users, revenue, etc.
                </p>
              </div>

              {/* 3 — redeploy */}
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white">Deploy your project</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Push the file or trigger a redeploy. The hub will start picking up health data on the next check.</p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setStep("form")}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  ← Back
                </button>
                <button onClick={handleFinish} className={cn(btnPrimary, "flex-1")}>
                  <AddSquareIcon size={13} /> Add {project.name}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function generateHealthCode(secret: string, endpoint: string): string {
  return `import { NextRequest, NextResponse } from "next/server"
// Optional: import your DB client here
// import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-hub-secret")
  if (secret !== process.env.HUB_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // --- Edit below to return real data from your app ---
  return NextResponse.json({
    status: "ok",
    db: {
      ok: true,           // await db.$queryRaw\`SELECT 1\`
      latencyMs: 0,
    },
    stats: {
      users: 0,           // await db.user.count()
      revenue: 0,         // await db.payment.sum(...)
    },
    fetchedAt: new Date().toISOString(),
  })
}`
}

function ProviderButton({ onClick, hoverColor, logo, name, desc, badge, badgeColor }: {
  onClick: () => void; hoverColor: string; logo: React.ReactNode
  name: string; desc: string; badge?: string; badgeColor?: string
}) {
  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: "11px", cursor: "pointer", textAlign: "left", width: "100%", transition: "border-color 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = hoverColor + "55")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#1e1e1e")}
    >
      <div style={{ flexShrink: 0 }}>{logo}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
          <p style={{ color: "#e8e8e8", fontSize: "13px", fontWeight: 600 }}>{name}</p>
          {badge && <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", padding: "2px 6px", borderRadius: "99px", background: `${badgeColor}18`, color: badgeColor, border: `1px solid ${badgeColor}30` }}>{badge}</span>}
        </div>
        <p style={{ color: "#383838", fontSize: "11.5px" }}>{desc}</p>
      </div>
    </button>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-zinc-400 mt-1">{hint}</p>}
    </div>
  )
}

function generateSecret() {
  const arr = new Uint8Array(24)
  crypto.getRandomValues(arr)
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("")
}

const inputCls = "w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
const btnPrimary = "w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 transition-colors"
