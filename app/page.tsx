"use client"
import Link from "next/link"
import { useEffect, useRef } from "react"
import {
  CommandIcon,
  SecurityCheckIcon,
  CodeIcon,
  FlashIcon,
  CpuIcon,
  CloudServerIcon,
  EyeIcon,
  ValidationIcon,
  DashboardCircleIcon,
  ArrowRightBigIcon,
  AiScanIcon,
  ScanIcon,
  BrainIcon,
  RocketIcon,
} from "hugeicons-react"

const FEATURES = [
  {
    Icon: CpuIcon,
    title: "AI that reads your code",
    desc: "Connect GitHub and the AI ingests your actual codebase. Ask anything — it answers from your real stack, not guesswork.",
  },
  {
    Icon: EyeIcon,
    title: "Real-time monitoring",
    desc: "Every service watched every minute. When something breaks, you see it with latency, status code, and the reason.",
  },
  {
    Icon: AiScanIcon,
    title: "Instant diagnosis",
    desc: "Service down? The AI cross-references your code, deploy history, and error logs to pinpoint exactly what broke.",
  },
  {
    Icon: SecurityCheckIcon,
    title: "Security scanning",
    desc: "Scans for hardcoded secrets, unprotected routes, missing validation — with exact file and line references.",
  },
  {
    Icon: CloudServerIcon,
    title: "Every hosting provider",
    desc: "Vercel, Netlify, Railway, Render, Fly.io, Heroku. One dashboard regardless of where your projects live.",
  },
  {
    Icon: CodeIcon,
    title: "Fix from here",
    desc: "When the AI finds an issue, it shows the exact diff. Review and apply without leaving the platform.",
  },
]

const STEPS = [
  { n: "01", title: "Connect your stack", desc: "Link GitHub, your hosting provider, and any services. Takes 60 seconds." },
  { n: "02", title: "AI learns your project", desc: "It reads your code, config, deploy history, and recent errors to build a full picture." },
  { n: "03", title: "Debug and fix instantly", desc: "Something breaks? Ask what's wrong. Get the exact file, line, and the fix." },
]

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", color: "#0a0a0a", fontFamily: "'Satoshi', sans-serif", overflowX: "hidden" }}>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "1px solid #f0f0f0",
        background: "rgba(255,255,255,0.9)", backdropFilter: "blur(20px)",
        padding: "0 48px", height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ color: "#0a0a0a", fontSize: "17px", fontWeight: 800, letterSpacing: "-0.05em" }}>m-ops</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link href="/login" style={{ color: "#888", fontSize: "13px", fontWeight: 500, textDecoration: "none", padding: "7px 14px" }}>Sign in</Link>
          <Link href="/signup" style={{
            background: "#0a0a0a", color: "#fff",
            fontSize: "13px", fontWeight: 600, padding: "8px 18px", borderRadius: "9px", textDecoration: "none",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            Get started <ArrowRightBigIcon size={13} color="#fff" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "120px 48px 80px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "#f5f5f5", border: "1px solid #e8e8e8",
          borderRadius: "99px", padding: "5px 16px", fontSize: "12px", color: "#555",
          marginBottom: "40px", fontWeight: 500, letterSpacing: "0.01em",
        }}>
          <FlashIcon size={12} color="#555" />
          Now in early access — free for developers
        </div>

        <h1 style={{
          fontSize: "clamp(48px,7.5vw,88px)", fontWeight: 800,
          lineHeight: 1.02, letterSpacing: "-0.055em", margin: "0 0 32px",
          color: "#0a0a0a",
        }}>
          Your projects deserve<br />a brain.
        </h1>

        <p style={{ color: "#888", fontSize: "clamp(16px,2vw,19px)", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto 48px", fontWeight: 400 }}>
          m-ops connects your GitHub, deployments, and hosting providers — then gives you an AI that actually knows your stack. Something breaks? It tells you what, why, and how to fix it.
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          <Link href="/signup" style={{
            background: "#0a0a0a", color: "#fff",
            fontSize: "14.5px", fontWeight: 700, padding: "14px 32px", borderRadius: "11px",
            textDecoration: "none", display: "flex", alignItems: "center", gap: "8px",
          }}>
            Start for free <ArrowRightBigIcon size={15} color="#fff" />
          </Link>
          <Link href="/login" style={{
            background: "#f5f5f5", color: "#555",
            fontSize: "14px", fontWeight: 500, padding: "14px 32px", borderRadius: "11px",
            textDecoration: "none", border: "1px solid #e8e8e8",
          }}>
            Sign in
          </Link>
        </div>

        <p style={{ color: "#ccc", fontSize: "12px", marginTop: "20px", letterSpacing: "0.02em" }}>No credit card · Free forever for personal use</p>
      </section>

      {/* Product preview */}
      <section style={{ maxWidth: "1080px", margin: "0 auto 140px", padding: "0 48px" }}>
        <div style={{
          borderRadius: "20px", border: "1px solid #e8e8e8",
          overflow: "hidden", background: "#0a0a0a",
          boxShadow: "0 40px 120px rgba(0,0,0,0.12)",
        }}>
          {/* Titlebar */}
          <div style={{ background: "#111", borderBottom: "1px solid #1a1a1a", padding: "14px 18px", display: "flex", alignItems: "center", gap: "8px" }}>
            {["#3a3a3a","#3a3a3a","#3a3a3a"].map((c, i) => (
              <div key={i} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />
            ))}
            <div style={{ flex: 1, background: "#1a1a1a", borderRadius: "6px", height: "22px", maxWidth: "220px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#444", fontSize: "10px" }}>m-ops.app/dashboard</span>
            </div>
          </div>

          {/* App UI */}
          <div style={{ display: "flex", height: "400px" }}>
            {/* Sidebar */}
            <div style={{ width: "190px", borderRight: "1px solid #141414", padding: "16px 12px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
              {[
                { label: "Overview", Icon: DashboardCircleIcon, active: false },
                { label: "Performance", Icon: EyeIcon, active: false },
                { label: "Incidents", Icon: FlashIcon, active: false },
                { label: "Code Insights", Icon: ScanIcon, active: false },
                { label: "Debug with AI", Icon: AiScanIcon, active: true },
              ].map(({ label, Icon, active }) => (
                <div key={label} style={{
                  padding: "8px 10px", borderRadius: "8px", fontSize: "11.5px", fontWeight: active ? 600 : 400,
                  background: active ? "#1a1a1a" : "transparent",
                  color: active ? "#ffffff" : "#2a2a2a",
                  display: "flex", alignItems: "center", gap: "8px",
                }}>
                  <Icon size={13} color={active ? "#ffffff" : "#2a2a2a"} />
                  {label}
                </div>
              ))}
            </div>

            {/* Main content */}
            <div style={{ flex: 1, padding: "20px 28px", display: "flex", flexDirection: "column", gap: "14px", overflow: "hidden" }}>
              {/* Status badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.15)", fontSize: "11px", color: "#f87171", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#f87171" }} />
                  Service degraded
                </div>
                <div style={{ padding: "4px 10px", borderRadius: "6px", background: "#111", border: "1px solid #1a1a1a", fontSize: "11px", color: "#444" }}>my-saas-app</div>
              </div>

              {/* Quick actions */}
              <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
                {["What's wrong?","Why is it slow?","Security check","Explain this"].map(label => (
                  <div key={label} style={{ padding: "5px 12px", borderRadius: "7px", background: "#111", border: "1px solid #1a1a1a", fontSize: "10.5px", color: "#3a3a3a" }}>
                    {label}
                  </div>
                ))}
              </div>

              {/* Chat */}
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ padding: "12px 0", borderBottom: "1px solid #111" }}>
                  <div style={{ fontSize: "9px", color: "#555", fontWeight: 700, marginBottom: "5px", letterSpacing: "0.1em" }}>YOU</div>
                  <div style={{ fontSize: "12px", color: "#555" }}>What's causing the slow response times?</div>
                </div>
                <div style={{ padding: "14px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <div style={{ fontSize: "9px", color: "#4ade80", fontWeight: 700, letterSpacing: "0.1em" }}>AI</div>
                    <div style={{ fontSize: "9px", color: "#222", background: "#161616", border: "1px solid #1e1e1e", borderRadius: "4px", padding: "1px 6px" }}>groq · llama-3.1</div>
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#555", lineHeight: 1.7 }}>
                    Found the bottleneck in{" "}
                    <span style={{ color: "#e8e8e8", background: "#141414", padding: "1px 7px", borderRadius: "4px", fontFamily: "monospace", fontSize: "11.5px" }}>lib/db.ts:47</span>
                    {" "}— an N+1 query inside your product loop. Each request triggers{" "}
                    <span style={{ color: "#f87171", fontWeight: 500 }}>~140 separate DB calls</span>. Here's the fix:
                  </div>
                  <div style={{ marginTop: "12px", background: "#0d0d0d", border: "1px solid #161616", borderRadius: "10px", padding: "12px 16px", fontFamily: "monospace", fontSize: "11px", color: "#555", lineHeight: 1.7 }}>
                    <span style={{ color: "#4ade80" }}>+</span> <span style={{ color: "#fff", opacity: 0.7 }}>const</span> products = await prisma.product.findMany&#40;&#123;<br />
                    <span style={{ color: "#4ade80" }}>+</span> {"  "}include: &#123; variants: true, images: true &#125;<br />
                    <span style={{ color: "#4ade80" }}>+</span> &#125;&#41;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Monitoring section */}
      <section style={{ maxWidth: "1080px", margin: "0 auto 140px", padding: "0 48px" }}>
        <div style={{ display: "flex", gap: "60px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Left: copy */}
          <div style={{ flex: "1 1 300px", minWidth: "260px" }}>
            <p style={{ fontSize: "11px", color: "#aaa", fontWeight: 600, letterSpacing: "0.12em", marginBottom: "14px" }}>MONITORING</p>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, letterSpacing: "-0.04em", margin: "0 0 20px", color: "#0a0a0a", lineHeight: 1.1 }}>
              Every service.<br />Every minute.
            </h2>
            <p style={{ color: "#999", fontSize: "15px", lineHeight: 1.75, margin: "0 0 32px" }}>
              m-ops pings every project you add — Vercel deploys, manual URLs, APIs, whatever you run. The moment something goes wrong you see the status, latency, and how long it's been down.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { label: "Incident toasts", desc: "Real-time alerts the moment a service drops" },
                { label: "Recovery tracking", desc: "Knows when it came back and how long it was down" },
                { label: "Latency history", desc: "Spot slow services before they become incidents" },
              ].map(({ label, desc }) => (
                <div key={label} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "6px", background: "#f5f5f5", border: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0a0a0a" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#0a0a0a", marginBottom: "2px" }}>{label}</div>
                    <div style={{ fontSize: "12.5px", color: "#aaa" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: mock monitoring dashboard */}
          <div style={{ flex: "1 1 420px", minWidth: "340px" }}>
            <div style={{ borderRadius: "16px", border: "1px solid #e8e8e8", overflow: "hidden", background: "#fff", boxShadow: "0 20px 60px rgba(0,0,0,0.06)" }}>
              {/* Header */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#0a0a0a", letterSpacing: "-0.01em" }}>Live status</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80" }} />
                  <span style={{ fontSize: "11px", color: "#888" }}>Checking every 60s</span>
                </div>
              </div>

              {/* Project rows */}
              {[
                { name: "my-saas-app", provider: "Vercel", url: "my-saas-app.vercel.app", ok: true, ms: 142, bars: [1,1,1,1,1,1,1,1,0.8,1,1,1,1,1,1,1,1,1,1,1] },
                { name: "api-server", provider: "Railway", url: "api.railway.app", ok: true, ms: 89, bars: [1,1,1,1,1,0.5,1,1,1,1,1,1,1,1,1,0.9,1,1,1,1] },
                { name: "marketing-site", provider: "Netlify", url: "mysite.netlify.app", ok: false, ms: null, bars: [1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0] },
                { name: "admin-panel", provider: "Manual", url: "admin.example.com", ok: true, ms: 204, bars: [1,1,0.7,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
                { name: "worker-api", provider: "Render", url: "worker.onrender.com", ok: true, ms: 310, bars: [1,1,1,1,1,1,1,1,1,1,1,0.6,1,1,1,1,1,1,1,1] },
              ].map(({ name, provider, url, ok, ms, bars }) => (
                <div key={name} style={{ padding: "14px 20px", borderBottom: "1px solid #f8f8f8", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: ok ? "#4ade80" : "#f87171", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#0a0a0a" }}>{name}</span>
                      <span style={{ fontSize: "10px", color: "#ccc", background: "#f8f8f8", border: "1px solid #eee", borderRadius: "4px", padding: "1px 6px" }}>{provider}</span>
                    </div>
                    <span style={{ fontSize: "10.5px", color: "#ccc" }}>{url}</span>
                  </div>
                  {/* Uptime bars */}
                  <div style={{ display: "flex", gap: "2px", alignItems: "flex-end" }}>
                    {bars.map((h, i) => (
                      <div key={i} style={{ width: "3px", height: `${16 * h}px`, borderRadius: "2px", background: h === 0 ? "#fecaca" : h < 0.9 ? "#fde68a" : "#d1fae5" }} />
                    ))}
                  </div>
                  <div style={{ fontSize: "11.5px", fontWeight: 600, color: ok ? "#0a0a0a" : "#f87171", minWidth: "42px", textAlign: "right" }}>
                    {ok && ms ? `${ms}ms` : ok ? "—" : "down"}
                  </div>
                </div>
              ))}

              {/* Incident banner */}
              <div style={{ padding: "12px 20px", background: "#fff5f5", borderTop: "1px solid #fee2e2", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f87171" }} />
                  <span style={{ fontSize: "11.5px", color: "#ef4444", fontWeight: 500 }}>marketing-site is unreachable · 14m ago</span>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#ef4444", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "6px", padding: "3px 10px", cursor: "pointer" }}>
                  ⚡ Diagnose
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0", margin: "0 0 140px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "56px 48px", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "40px" }}>
          {[
            { val: "< 60s", label: "to connect your first project" },
            { val: "3", label: "AI providers, zero cost" },
            { val: "1 min", label: "monitoring interval" },
          ].map(({ val, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 800, letterSpacing: "-0.05em", color: "#0a0a0a" }}>{val}</div>
              <div style={{ fontSize: "13px", color: "#aaa", marginTop: "6px" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: "1080px", margin: "0 auto 140px", padding: "0 48px" }}>
        <div style={{ textAlign: "center", marginBottom: "72px" }}>
          <p style={{ fontSize: "11px", color: "#aaa", fontWeight: 600, letterSpacing: "0.12em", marginBottom: "14px" }}>CAPABILITIES</p>
          <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.04em", margin: 0, color: "#0a0a0a" }}>
            Everything your projects need.
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "1px", background: "#f0f0f0", borderRadius: "20px", overflow: "hidden", border: "1px solid #f0f0f0" }}>
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} style={{ background: "#fff", padding: "36px 32px", transition: "background 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fafafa" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff" }}
            >
              <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: "#f5f5f5", border: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "18px" }}>
                <Icon size={17} color="#0a0a0a" />
              </div>
              <h3 style={{ fontSize: "14.5px", fontWeight: 700, color: "#0a0a0a", margin: "0 0 8px", letterSpacing: "-0.02em" }}>{title}</h3>
              <p style={{ fontSize: "13px", color: "#999", lineHeight: 1.7, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: "720px", margin: "0 auto 140px", padding: "0 48px" }}>
        <div style={{ textAlign: "center", marginBottom: "72px" }}>
          <p style={{ fontSize: "11px", color: "#aaa", fontWeight: 600, letterSpacing: "0.12em", marginBottom: "14px" }}>HOW IT WORKS</p>
          <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.04em", margin: 0, color: "#0a0a0a" }}>
            Up and running in minutes.
          </h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {STEPS.map(({ n, title, desc }, i) => (
            <div key={n} style={{ display: "flex", gap: "28px", padding: "36px 0", borderBottom: i < STEPS.length - 1 ? "1px solid #f0f0f0" : "none" }}>
              <div style={{ flexShrink: 0, width: "44px", height: "44px", borderRadius: "12px", background: "#f5f5f5", border: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#888", letterSpacing: "0.02em" }}>{n}</span>
              </div>
              <div style={{ paddingTop: "8px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0a0a0a", margin: "0 0 8px", letterSpacing: "-0.02em" }}>{title}</h3>
                <p style={{ fontSize: "14px", color: "#999", lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ maxWidth: "1080px", margin: "0 auto 140px", padding: "0 48px" }}>
        <div style={{ textAlign: "center", marginBottom: "72px" }}>
          <p style={{ fontSize: "11px", color: "#aaa", fontWeight: 600, letterSpacing: "0.12em", marginBottom: "14px" }}>PRICING</p>
          <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.04em", margin: "0 0 16px", color: "#0a0a0a" }}>
            Simple, honest pricing.
          </h2>
          <p style={{ color: "#888", fontSize: "16px", margin: 0 }}>Start free. Scale when you need to.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "24px" }}>
          {[
            {
              name: "Free", price: "$0", period: "/mo", highlight: false,
              desc: "For personal projects and learning.",
              features: ["Up to 3 projects", "5-minute check intervals", "7-day history", "Email alerts", "Community support"],
            },
            {
              name: "Pro", price: "$2", period: "/mo", highlight: true,
              desc: "For teams that need reliability.",
              features: ["Unlimited projects", "30-second intervals", "90-day history", "Slack & PagerDuty", "AI root cause analysis", "Priority support"],
            },
            {
              name: "Team", price: "$5", period: "/mo", highlight: false,
              desc: "For orgs with critical uptime.",
              features: ["Everything in Pro", "5 team seats", "Custom check intervals", "On-call scheduling", "SLA reports", "Dedicated support"],
            },
          ].map(({ name, price, period, highlight, desc, features }) => (
            <div key={name} style={{
              background: highlight ? "#0a0a0a" : "#fff",
              border: highlight ? "none" : "1px solid #f0f0f0",
              borderRadius: "20px",
              padding: "36px",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}>
              {highlight && (
                <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "#fff", color: "#0a0a0a", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", padding: "4px 14px", borderRadius: "100px" }}>
                  MOST POPULAR
                </div>
              )}
              <div style={{ marginBottom: "24px" }}>
                <p style={{ color: highlight ? "#888" : "#aaa", fontSize: "12px", fontWeight: 600, letterSpacing: "0.06em", margin: "0 0 12px" }}>{name.toUpperCase()}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "2px", marginBottom: "10px" }}>
                  <span style={{ color: highlight ? "#fff" : "#0a0a0a", fontSize: "44px", fontWeight: 800, letterSpacing: "-0.04em" }}>{price}</span>
                  <span style={{ color: highlight ? "#555" : "#aaa", fontSize: "14px" }}>{period}</span>
                </div>
                <p style={{ color: highlight ? "#555" : "#888", fontSize: "14px", margin: 0 }}>{desc}</p>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                {features.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: highlight ? "#ccc" : "#555" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={highlight ? "#22c55e" : "#22c55e"} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" style={{
                display: "block", textAlign: "center",
                background: highlight ? "#fff" : "#0a0a0a",
                color: highlight ? "#0a0a0a" : "#fff",
                fontWeight: 700, fontSize: "14px",
                padding: "13px 24px", borderRadius: "12px",
                textDecoration: "none",
              }}>
                {name === "Free" ? "Get started free" : `Start ${name}`}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#0a0a0a", margin: "0 0 0" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "100px 48px", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(32px,5vw,56px)", fontWeight: 800, letterSpacing: "-0.05em", margin: "0 0 20px", color: "#fff" }}>
            Your stack deserves better.
          </h2>
          <p style={{ color: "#555", fontSize: "16px", marginBottom: "44px", lineHeight: 1.7 }}>
            Connect your first project and the AI starts reading it immediately.<br />No setup. No config. No docs.
          </p>
          <Link href="/signup" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "#fff", color: "#0a0a0a",
            fontSize: "14px", fontWeight: 700, padding: "14px 36px", borderRadius: "12px", textDecoration: "none",
          }}>
            Get started free <ArrowRightBigIcon size={14} color="#0a0a0a" />
          </Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", marginTop: "28px", flexWrap: "wrap" }}>
            {["No credit card", "Free for personal use", "Cancel anytime"].map(t => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: "6px", color: "#333", fontSize: "12px" }}>
                <ValidationIcon size={12} color="#555" /> {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #1a1a1a", background: "#0a0a0a", padding: "28px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div style={{ width: "22px", height: "22px", background: "#fff", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CommandIcon size={10} color="#0a0a0a" />
            </div>
            <span style={{ color: "#555", fontSize: "13px", fontWeight: 600, letterSpacing: "-0.02em" }}>m-ops</span>
          </div>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            <Link href="/terms" style={{ color: "#333", fontSize: "12px", textDecoration: "none" }}>Terms</Link>
            <Link href="/privacy" style={{ color: "#333", fontSize: "12px", textDecoration: "none" }}>Privacy</Link>
            <a href="mailto:hello@m-ops.dev" style={{ color: "#333", fontSize: "12px", textDecoration: "none" }}>Contact</a>
          </div>
        </div>
        <p style={{ color: "#222", fontSize: "12px", margin: "16px 0 0" }}>© {new Date().getFullYear()} m-ops. Built for developers who ship.</p>
      </footer>
    </div>
  )
}
