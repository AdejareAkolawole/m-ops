"use client"
import { useState, useEffect, useCallback } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"
import { ArrowReloadHorizontalIcon, Loading03Icon } from "hugeicons-react"
import { getProjectAdminConfig } from "@/lib/store"

const ACCENT = "#60a5fa"

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦", USD: "$", GBP: "£", EUR: "€", GHS: "₵", KES: "KSh", ZAR: "R",
}
function sym(currency?: string) {
  if (!currency) return "$"
  return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? currency
}
function fmt(n: number, currency?: string) {
  if (n >= 1_000_000) return `${sym(currency)}${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${sym(currency)}${(n / 1_000).toFixed(1)}K`
  return `${sym(currency)}${n.toLocaleString()}`
}
function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

const PLAN_COLORS: Record<string, string> = {
  FREE: "#222222",
  STARTER: "#333333",
  PRO: "#555555",
  BUSINESS: "#888888",
  ENTERPRISE: ACCENT,
}

// Stat tile
function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: "#111", border: "1px solid #1c1c1c", borderRadius: "10px", padding: "18px 20px" }}>
      <p style={{ color: "#404040", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>{label}</p>
      <p style={{ color: "#fff", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ color: "#383838", fontSize: "11px", marginTop: "6px" }}>{sub}</p>}
    </div>
  )
}

// Section card
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "10px", padding: "20px" }}>
      <p style={{ color: "#303030", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>{title}</p>
      {children}
    </div>
  )
}

function ChartTooltip({ active, payload, label, currency }: {
  active?: boolean; payload?: { name: string; value: number }[]; label?: string; currency?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "8px 12px", fontSize: "12px" }}>
      {label && <p style={{ color: "#555", marginBottom: "4px" }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: "#fff", fontWeight: 600 }}>
          {currency ? fmt(p.value, currency) : fmtNum(p.value)}
        </p>
      ))}
    </div>
  )
}

interface AdminData {
  generatedAt?: string
  users?: { total?: number; new30d?: number; new7d?: number; byPlan?: Record<string, number> }
  sites?: { total?: number; published?: number; draft?: number }
  pageViews?: { allTime?: number; last30d?: number }
  domains?: { active?: number }
  revenue?: { mrr?: number; arr?: number; totalRevenue?: number; domainRevenue?: number; domainProfit?: number; renewalRevenue?: number; backupRevenue?: number; aiPassRevenue?: number; currency?: string }
  subscriptions?: { active?: number; byPlan?: Record<string, number> }
  [key: string]: unknown
}

export function AnalyticsDashboard({ projectId }: { projectId: string }) {
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)

  const load = useCallback(async () => {
    const cfg = getProjectAdminConfig(projectId)
    if (!cfg.adminApiUrl) return
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/admin-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiUrl: cfg.adminApiUrl, apiToken: cfg.adminApiToken }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || `HTTP ${json.status}`)
      setData(json.data as AdminData)
      setFetchedAt(Date.now())
    } catch (e) { setError(String(e)) }
    finally { setLoading(false) }
  }, [projectId])

  useEffect(() => { load() }, [load])

  if (loading && !data) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px" }}>
      <Loading03Icon size={22} style={{ color: ACCENT }} className="animate-spin" />
    </div>
  )

  if (error) return (
    <div style={{ background: "#1a0000", border: "1px solid #3a0000", borderRadius: "10px", padding: "20px" }}>
      <p style={{ color: "#ff6666", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Failed to load analytics</p>
      <p style={{ color: "#884444", fontSize: "12px" }}>{error}</p>
      <button onClick={load} style={{ marginTop: "12px", background: "#ff4444", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Retry</button>
    </div>
  )

  if (!data) return null

  const rev = data.revenue ?? {}
  const users = data.users ?? {}
  const sites = data.sites ?? {}
  const views = data.pageViews ?? {}
  const currency = rev.currency

  const timeAgo = (ts: number) => {
    const d = Date.now() - ts
    if (d < 60_000) return "just now"
    if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
    return `${Math.floor(d / 3_600_000)}h ago`
  }

  const revenueBreakdown = [
    { name: "Domain", value: rev.domainRevenue ?? 0 },
    { name: "Profit", value: rev.domainProfit ?? 0 },
    { name: "Renewal", value: rev.renewalRevenue ?? 0 },
    { name: "Backup", value: rev.backupRevenue ?? 0 },
    { name: "AI Pass", value: rev.aiPassRevenue ?? 0 },
  ].filter(d => d.value > 0)

  const planData = Object.entries(users.byPlan ?? {})
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))

  const sitesData = [
    { name: "Published", value: sites.published ?? 0 },
    { name: "Draft", value: sites.draft ?? 0 },
  ].filter(d => d.value > 0)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ color: "#fff", fontSize: "14px", fontWeight: 600, letterSpacing: "-0.01em" }}>Analytics</h3>
          {fetchedAt && <p style={{ color: "#333", fontSize: "11px", marginTop: "2px" }}>Updated {timeAgo(fetchedAt)}</p>}
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{ padding: "6px", borderRadius: "7px", background: "#111", border: "1px solid #1c1c1c", color: "#444", cursor: "pointer" }}
        >
          <ArrowReloadHorizontalIcon size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Top stat tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
        <Tile label="Total revenue" value={fmt(rev.totalRevenue ?? 0, currency)} sub={currency} />
        <Tile label="Total users" value={fmtNum(users.total ?? 0)} sub={`+${users.new30d ?? 0} this month`} />
        <Tile label="Page views (30d)" value={fmtNum(views.last30d ?? 0)} sub={`${fmtNum(views.allTime ?? 0)} all time`} />
        <Tile label="Active domains" value={fmtNum(data.domains?.active ?? 0)} sub={`${sites.total ?? 0} total sites`} />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {revenueBreakdown.length > 0 ? (
          <Section title="Revenue breakdown">
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={revenueBreakdown} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={58} tick={{ fontSize: 11, fill: "#555" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ fill: "rgba(0,212,160,0.04)" }} />
                <Bar dataKey="value" fill={ACCENT} radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        ) : (
          <Section title="Revenue breakdown">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "190px" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: ACCENT, fontSize: "28px", fontWeight: 700, letterSpacing: "-0.025em" }}>{fmt(rev.totalRevenue ?? 0, currency)}</p>
                <p style={{ color: "#333", fontSize: "11px", marginTop: "6px" }}>Total revenue · MRR {fmt(rev.mrr ?? 0, currency)}</p>
              </div>
            </div>
          </Section>
        )}

        {planData.length > 0 ? (
          <Section title="Users by plan">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={planData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {planData.map((entry) => (
                    <Cell key={entry.name} fill={PLAN_COLORS[entry.name] ?? "#444"} />
                  ))}
                </Pie>
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload as { name: string; value: number }
                  const total = planData.reduce((a, b) => a + b.value, 0)
                  return (
                    <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "8px 12px", fontSize: "12px" }}>
                      <p style={{ color: "#fff", fontWeight: 600 }}>{d.name}</p>
                      <p style={{ color: "#555" }}>{d.value} users · {Math.round(d.value / total * 100)}%</p>
                    </div>
                  )
                }} />
                <Legend iconType="circle" iconSize={7} formatter={(v) => <span style={{ fontSize: 11, color: "#444" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </Section>
        ) : (
          <Section title="Users by plan">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "190px" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#fff", fontSize: "28px", fontWeight: 700, letterSpacing: "-0.025em" }}>{fmtNum(users.total ?? 0)}</p>
                <p style={{ color: "#333", fontSize: "11px", marginTop: "6px" }}>Total users · +{users.new30d ?? 0} this month</p>
              </div>
            </div>
          </Section>
        )}
      </div>

      {/* Sites + Subscriptions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {sitesData.length > 0 && (
          <Section title="Sites">
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {sitesData.map((d) => {
                const total = (sites.total ?? 0) || 1
                const pct = Math.round(d.value / total * 100)
                return (
                  <div key={d.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ color: "#555", fontSize: "12px" }}>{d.name}</span>
                      <span style={{ color: "#fff", fontSize: "12px", fontWeight: 600 }}>{d.value} <span style={{ color: "#333", fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    <div style={{ height: "4px", borderRadius: "99px", background: "#1a1a1a", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "99px", width: `${pct}%`, background: d.name === "Published" ? ACCENT : "#333" }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #1a1a1a", display: "flex", gap: "20px" }}>
              <span style={{ color: "#333", fontSize: "11px" }}>Total <span style={{ color: "#fff", fontWeight: 600 }}>{sites.total ?? 0}</span></span>
              <span style={{ color: "#333", fontSize: "11px" }}>Domains <span style={{ color: "#fff", fontWeight: 600 }}>{data.domains?.active ?? 0}</span></span>
            </div>
          </Section>
        )}

        <Section title="Subscriptions & growth">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {[
              { label: "MRR", value: fmt(rev.mrr ?? 0, currency) },
              { label: "ARR", value: fmt(rev.arr ?? 0, currency) },
              { label: "Active subs", value: fmtNum(data.subscriptions?.active ?? 0) },
              { label: "New users (7d)", value: `+${users.new7d ?? 0}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "#141414", border: "1px solid #1c1c1c", borderRadius: "8px", padding: "12px 14px" }}>
                <p style={{ color: "#383838", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>{label}</p>
                <p style={{ color: "#fff", fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em" }}>{value}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
