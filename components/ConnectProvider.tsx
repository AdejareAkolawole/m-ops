"use client"
import { useState } from "react"
import { Cancel01Icon, LinkSquare02Icon, Loading03Icon, CheckmarkCircle02Icon } from "hugeicons-react"
import { saveProviderAccount, saveProviderProjects } from "@/lib/store"
import { HostingProvider, ProviderProject } from "@/lib/types"

interface ProviderMeta {
  label: string
  color: string
  logo: React.ReactNode
  tokenLabel: string
  tokenPlaceholder: string
  steps: string[]
  docsUrl: string
  docsLabel: string
  apiPath: string
}

// ── Accurate brand logos ──────────────────────────────────────────────────────

const NetlifyMark = () => (
  <svg width="18" height="18" viewBox="0 0 105 113" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M34.5 68.2H28.3L27 74.8H19.8L27.5 42H35.3L43 74.8H35.8L34.5 68.2ZM29.6 62.3H33.2L31.4 53L29.6 62.3Z" fill="#05BDBA"/>
    <path d="M60.2 42V74.8H53.6L45.9 57V74.8H39.3V42H46L53.6 59.8V42H60.2Z" fill="#05BDBA"/>
    <path d="M73.6 47.9V74.8H66.7V47.9H60.4V42H79.9V47.9H73.6Z" fill="#05BDBA"/>
    <path d="M97.3 42L90.4 61.7L97.9 74.8H90.3L85.6 65.2V74.8H78.7V42H85.6V57.7L89.9 42H97.3Z" fill="#05BDBA"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M19.3 82.4H85.7V90.3H19.3V82.4Z" fill="#05BDBA"/>
  </svg>
)

const RailwayMark = () => (
  <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 32C10 26.5 14.5 22 20 22H80C85.5 22 90 26.5 90 32V68C90 73.5 85.5 78 80 78H20C14.5 78 10 73.5 10 68V32Z" fill="#0B0D0E"/>
    <path d="M24 40H54C58 40 62 43 62 48C62 53 58 56 54 56H42L54 68H44L32 56H24V40Z" fill="#C8FF00"/>
    <rect x="24" y="60" width="10" height="8" fill="#C8FF00"/>
  </svg>
)

const RenderMark = () => (
  <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#46E3B7"/>
    <path d="M28 22H52C63.6 22 73 31.4 73 43C73 51.6 67.8 59 60 62.4L75 78H61L48 65H40V78H28V22Z" fill="white"/>
    <path d="M40 34V53H52C58.1 53 63 48.1 63 42C63 35.9 58.1 31 52 31H40V34Z" fill="#46E3B7"/>
  </svg>
)

const FlyMark = () => (
  <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#7C3AED"/>
    <path d="M50 14C50 14 76 28 76 50C76 62 68 72 62 72C56 72 54 66 50 66C46 66 44 72 38 72C32 72 24 62 24 50C24 28 50 14 50 14Z" fill="white"/>
    <circle cx="50" cy="48" r="10" fill="#7C3AED"/>
    <circle cx="50" cy="48" r="5" fill="white"/>
    <path d="M42 72L38 86H62L58 72" fill="white"/>
  </svg>
)

const HerokuMark = () => (
  <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#430098"/>
    <path d="M30 16H42V46L62 26H76L54 48L76 84H62L42 54V84H30V16Z" fill="white"/>
    <path d="M62 16H74V28H62V16Z" fill="#00AEEF"/>
  </svg>
)

// ── Provider config ───────────────────────────────────────────────────────────

const PROVIDERS: Record<HostingProvider, ProviderMeta> = {
  netlify: {
    label: "Netlify",
    color: "#05BDBA",
    logo: <NetlifyMark />,
    tokenLabel: "Personal Access Token",
    tokenPlaceholder: "nfp_xxxxxxxxxxxxxxxxxxxxxxxx",
    steps: [
      "Go to app.netlify.com → your avatar → User settings",
      'Click "Applications" in the left sidebar',
      'Under "Personal access tokens", click "New access token"',
      "Copy the token and paste it below",
    ],
    docsUrl: "https://app.netlify.com/user/applications#personal-access-tokens",
    docsLabel: "Open Netlify token settings",
    apiPath: "/api/providers/netlify",
  },
  railway: {
    label: "Railway",
    color: "#C8FF00",
    logo: <RailwayMark />,
    tokenLabel: "API Token",
    tokenPlaceholder: "railway token here...",
    steps: [
      "Go to railway.app → your avatar → Account Settings",
      'Click "Tokens" in the sidebar',
      'Click "New Token", give it a name',
      "Copy the token and paste it below",
    ],
    docsUrl: "https://railway.app/account/tokens",
    docsLabel: "Open Railway token settings",
    apiPath: "/api/providers/railway",
  },
  render: {
    label: "Render",
    color: "#46E3B7",
    logo: <RenderMark />,
    tokenLabel: "API Key",
    tokenPlaceholder: "rnd_xxxxxxxxxxxxxxxxxxxxxxxx",
    steps: [
      "Go to dashboard.render.com → your avatar → Account Settings",
      'Scroll down to "API Keys"',
      'Click "Create API Key", give it a name',
      "Copy the key and paste it below",
    ],
    docsUrl: "https://dashboard.render.com/u/settings#api-keys",
    docsLabel: "Open Render API key settings",
    apiPath: "/api/providers/render",
  },
  flyio: {
    label: "Fly.io",
    color: "#a78bfa",
    logo: <FlyMark />,
    tokenLabel: "Access Token",
    tokenPlaceholder: "FlyV1 xxxxxxxxxxxxxxxxxx",
    steps: [
      "Go to fly.io → Dashboard → your account",
      'Click "Access Tokens" in the left sidebar',
      'Click "Create token", give it a name',
      "Or run `fly auth token` in your terminal",
      "Copy and paste the token below",
    ],
    docsUrl: "https://fly.io/user/personal_access_tokens",
    docsLabel: "Open Fly.io token settings",
    apiPath: "/api/providers/flyio",
  },
  heroku: {
    label: "Heroku",
    color: "#b39ddb",
    logo: <HerokuMark />,
    tokenLabel: "API Key",
    tokenPlaceholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    steps: [
      "Go to dashboard.heroku.com → your avatar → Account settings",
      'Scroll down to "API Key"',
      'Click "Reveal" to copy your existing key, or "Regenerate API Key"',
      "Paste it below",
    ],
    docsUrl: "https://dashboard.heroku.com/account",
    docsLabel: "Open Heroku account settings",
    apiPath: "/api/providers/heroku",
  },
}

interface Props {
  provider: HostingProvider
  onClose: () => void
  onConnected: (projects: ProviderProject[]) => void
}

export function ConnectProvider({ provider, onClose, onConnected }: Props) {
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const meta = PROVIDERS[provider]

  async function handleConnect() {
    if (!token.trim()) { setError("Paste your token first"); return }
    setLoading(true)
    setError("")
    try {
      const res = await fetch(meta.apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to connect")

      saveProviderAccount({ provider, token: token.trim(), connectedAt: new Date().toISOString() })
      saveProviderProjects(provider, data)
      onConnected(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to connect")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "440px", borderRadius: "18px", background: "#0d0d0d", border: "1px solid #222", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {meta.logo}
            <span style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}>Connect {meta.label}</span>
          </div>
          <button onClick={onClose} style={{ color: "#484848", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
            <Cancel01Icon size={16} />
          </button>
        </div>

        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Steps */}
          <div style={{ background: "#111", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ color: "#888", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>How to get your token</p>
            <ol style={{ display: "flex", flexDirection: "column", gap: "8px", listStyle: "none", margin: 0, padding: 0 }}>
              {meta.steps.map((step, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <span style={{ width: "17px", height: "17px", borderRadius: "50%", background: "#1e1e1e", color: "#666", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>{i + 1}</span>
                  <span style={{ color: "#606060", fontSize: "12px", lineHeight: 1.5 }}>{step}</span>
                </li>
              ))}
            </ol>
            <a href={meta.docsUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11.5px", color: meta.color, textDecoration: "none" }}>
              {meta.docsLabel} <LinkSquare02Icon size={10} />
            </a>
          </div>

          {/* Token input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ color: "#606060", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{meta.tokenLabel}</label>
            <input
              value={token}
              onChange={e => setToken(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleConnect()}
              placeholder={meta.tokenPlaceholder}
              type="password"
              style={{ width: "100%", borderRadius: "10px", border: "1px solid #222", background: "#111", padding: "10px 14px", fontSize: "13px", color: "#e8e8e8", fontFamily: "monospace", outline: "none", boxSizing: "border-box" }}
            />
            <p style={{ color: "#2a2a2a", fontSize: "11px" }}>Stored locally only. Never sent anywhere except {meta.label}&apos;s API.</p>
          </div>

          {error && <p style={{ color: "#f87171", fontSize: "12px" }}>{error}</p>}

          {/* Connect button */}
          <button
            onClick={handleConnect}
            disabled={loading}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              padding: "11px", borderRadius: "10px", fontSize: "13.5px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              background: meta.color, color: "#000", border: "none", opacity: loading ? 0.7 : 1, transition: "opacity 0.15s",
            }}
          >
            {loading
              ? <><Loading03Icon size={14} style={{ animation: "spin 1s linear infinite" }} /> Connecting...</>
              : <><CheckmarkCircle02Icon size={14} /> Connect &amp; import all projects</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
