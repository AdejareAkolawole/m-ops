"use client"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  SecurityCheckIcon, CodeIcon, FlashIcon, CpuIcon, CloudServerIcon,
  EyeIcon, ValidationIcon, DashboardCircleIcon, ArrowRightBigIcon,
  AiScanIcon, ScanIcon, Alert01Icon, SearchList01Icon, GitBranchIcon, Clock01Icon,
} from "hugeicons-react"

function useInView() {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const fired = useRef(false)
  useEffect(() => {
    const check = () => {
      if (fired.current || !ref.current) return
      const { top, bottom } = ref.current.getBoundingClientRect()
      if (bottom > 0 && top < window.innerHeight + 80) {
        fired.current = true
        setInView(true)
      }
    }
    check()
    window.addEventListener("scroll", check, { passive: true })
    return () => window.removeEventListener("scroll", check)
  }, [])
  return { ref, inView }
}

const FEATURES = [
  { Icon: CpuIcon, title: "AI that reads your code", desc: "Connect GitHub and the AI ingests your actual codebase. Ask anything — it answers from your real stack, not guesswork." },
  { Icon: EyeIcon, title: "Real-time monitoring", desc: "Every service watched every minute. When something breaks, you see it with latency, status code, and the reason." },
  { Icon: AiScanIcon, title: "Instant diagnosis", desc: "Service down? The AI cross-references your code, deploy history, and error logs to pinpoint exactly what broke." },
  { Icon: SecurityCheckIcon, title: "Security scanning", desc: "Scans for hardcoded secrets, unprotected routes, missing validation — with exact file and line references." },
  { Icon: CloudServerIcon, title: "Every hosting provider", desc: "Vercel, Netlify, Railway, Render, Fly.io, Heroku. One dashboard regardless of where your projects live." },
  { Icon: CodeIcon, title: "Fix from here", desc: "When the AI finds an issue, it shows the exact diff. Review and apply without leaving the platform." },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  const monitor  = useInView()
  const stats    = useInView()
  const features = useInView()
  const howit    = useInView()
  const pricing  = useInView()
  const cta      = useInView()

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", color: "#0a0a0a", fontFamily: "'Satoshi', system-ui, sans-serif", overflowX: "hidden" }}>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(36px); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
        @keyframes floatA { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-7px); } }
        @keyframes floatB { 0%,100% { transform:translateY(0); } 50% { transform:translateY(9px);  } }

        .hero-badge   { animation: fadeUp 0.7s cubic-bezier(.22,.68,0,1.2) 0.05s both; }
        .hero-h1      { animation: fadeUp 0.85s cubic-bezier(.22,.68,0,1.2) 0.2s both; }
        .hero-sub     { animation: fadeUp 0.75s cubic-bezier(.22,.68,0,1.2) 0.38s both; }
        .hero-ctas    { animation: fadeUp 0.75s cubic-bezier(.22,.68,0,1.2) 0.54s both; }
        .hero-note    { animation: fadeUp 0.6s cubic-bezier(.22,.68,0,1.2) 0.68s both; }
        .hero-mockup  { animation: fadeUp 1s cubic-bezier(.22,.68,0,1.2) 0.85s both; }

        .reveal {
          opacity: 0;
          transform: translateY(48px);
          filter: blur(6px);
          transition: opacity 0.75s cubic-bezier(.22,.68,0,1.2),
                      transform 0.75s cubic-bezier(.22,.68,0,1.2),
                      filter 0.75s ease;
        }
        .reveal.in { opacity: 1; transform: translateY(0); filter: blur(0); }

        .feat-card { transition: background 0.18s, box-shadow 0.18s, transform 0.18s; }
        .feat-card:hover { background: #f7f7f7 !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }

        .price-card { transition: transform 0.2s, box-shadow 0.2s; }
        .price-card:hover { transform: translateY(-4px); }

        .step-row { transition: background 0.18s; }
        .step-row:hover { background: #fafafa !important; }

        .nav-a { color: #888; font-size: 13px; font-weight: 500; text-decoration: none; transition: color 0.15s; }
        .nav-a:hover { color: #0a0a0a; }

        .cta-primary { transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s; }
        .cta-primary:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(10,10,10,0.18); }

        .cta-sec { transition: background 0.15s, color 0.15s; }
        .cta-sec:hover { background: #f0f0f0 !important; }

        .float-a { animation: floatA 4s ease-in-out infinite; }
        .float-b { animation: floatB 5s ease-in-out infinite; }

        .footer-link { color: #555; font-size: 13px; text-decoration: none; transition: color 0.15s; }
        .footer-link:hover { color: #0a0a0a; }

        @media (max-width: 760px) {
          .hide-mob  { display: none !important; }
          .show-mob  { display: flex !important; }
          .mob-col   { flex-direction: column !important; }
          .mob-full  { width: 100% !important; justify-content: center !important; }
          .feat-grid { grid-template-columns: 1fr !important; }
          .price-grid{ grid-template-columns: 1fr !important; }
          .stats-row { flex-direction: column !important; gap: 32px !important; }
          .hero-h1   { font-size: clamp(40px,10vw,72px) !important; }
          .monitor-wrap { flex-direction: column !important; }
        }
      `}</style>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(20px,4vw,48px)",
        background: scrolled ? "rgba(255,255,255,0.92)" : "#fff",
        backdropFilter: scrolled ? "blur(18px)" : "none",
        borderBottom: "1px solid #f0f0f0",
        transition: "background 0.3s",
      }}>
        <span style={{ fontSize: "17px", fontWeight: 800, letterSpacing: "-0.05em", color: "#0a0a0a" }}>m-ops</span>

        {/* desktop links */}
        <div className="hide-mob" style={{ display: "flex", gap: "28px" }}>
          <a href="#features" className="nav-a">Features</a>
          <a href="#how" className="nav-a">How it works</a>
          <a href="#pricing" className="nav-a">Pricing</a>
        </div>

        <div className="hide-mob" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link href="/login" className="nav-a" style={{ padding: "7px 14px" }}>Sign in</Link>
          <Link href="/signup" className="cta-primary" style={{ background: "#0a0a0a", color: "#fff", fontSize: "13px", fontWeight: 600, padding: "8px 18px", borderRadius: "9px", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
            Get started <ArrowRightBigIcon size={12} color="#fff" />
          </Link>
        </div>

        {/* hamburger */}
        <button onClick={() => setMenuOpen(o => !o)} className="show-mob" style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#0a0a0a" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
          </svg>
        </button>
      </nav>

      {/* mobile drawer */}
      {menuOpen && (
        <div style={{ position: "fixed", top: "60px", left: 0, right: 0, zIndex: 49, background: "#fff", borderBottom: "1px solid #f0f0f0", padding: "16px 24px 24px", animation: "fadeIn 0.15s ease", display: "flex", flexDirection: "column", gap: "2px" }}>
          {[["#features","Features"],["#how","How it works"],["#pricing","Pricing"]].map(([h,l]) => (
            <a key={h} href={h} onClick={() => setMenuOpen(false)} style={{ color: "#555", fontSize: "15px", fontWeight: 500, padding: "12px 0", textDecoration: "none", borderBottom: "1px solid #f5f5f5" }}>{l}</a>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
            <Link href="/login" onClick={() => setMenuOpen(false)} style={{ textAlign: "center", padding: "12px", borderRadius: "10px", border: "1px solid #e8e8e8", color: "#555", textDecoration: "none", fontSize: "14px" }}>Sign in</Link>
            <Link href="/signup" onClick={() => setMenuOpen(false)} style={{ textAlign: "center", padding: "12px", borderRadius: "10px", background: "#0a0a0a", color: "#fff", textDecoration: "none", fontSize: "14px", fontWeight: 700 }}>Get started free</Link>
          </div>
        </div>
      )}

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: "860px", margin: "0 auto", padding: "clamp(80px,10vw,120px) clamp(20px,4vw,48px) 80px", textAlign: "center" }}>
        <h1 className="hero-h1" style={{ fontSize: "clamp(44px,7vw,84px)", fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.055em", margin: "0 0 28px", color: "#0a0a0a" }}>
          Something broke.<br />Do you know why?
        </h1>

        <p className="hero-sub" style={{ color: "#777", fontSize: "clamp(15px,2vw,19px)", lineHeight: 1.75, maxWidth: "580px", margin: "0 auto 48px" }}>
          Most developers find out their app is down when a user complains. m-ops watches your entire stack, and the moment something goes wrong — it tells you exactly what broke, why it broke, and how to fix it.
        </p>

        <div className="hero-ctas mob-col" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          <Link href="/signup" className="cta-primary mob-full" style={{ background: "#0a0a0a", color: "#fff", fontSize: "14.5px", fontWeight: 700, padding: "14px 32px", borderRadius: "11px", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
            Start for free <ArrowRightBigIcon size={15} color="#fff" />
          </Link>
          <Link href="/login" className="cta-sec mob-full" style={{ background: "#f5f5f5", color: "#555", fontSize: "14px", fontWeight: 500, padding: "14px 32px", borderRadius: "11px", textDecoration: "none", border: "1px solid #e8e8e8" }}>
            Sign in
          </Link>
        </div>

        <p className="hero-note" style={{ color: "#ccc", fontSize: "12px", marginTop: "20px" }}>No credit card · Free forever for personal use</p>
      </section>

      {/* ── Product mockup ────────────────────────────────────────────────── */}
      <section className="hero-mockup" style={{ maxWidth: "1080px", margin: "0 auto 160px", padding: "0 clamp(20px,4vw,48px)", position: "relative" }}>
        <div style={{ borderRadius: "20px", border: "1px solid #e8e8e8", overflow: "hidden", background: "#0a0a0a", boxShadow: "0 40px 120px rgba(0,0,0,0.12)" }}>
          <div style={{ background: "#111", borderBottom: "1px solid #1a1a1a", padding: "14px 18px", display: "flex", alignItems: "center", gap: "8px" }}>
            {["#3a3a3a","#3a3a3a","#3a3a3a"].map((c,i) => <div key={i} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />)}
            <div style={{ flex: 1, background: "#1a1a1a", borderRadius: "6px", height: "22px", maxWidth: "220px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#444", fontSize: "10px" }}>m-ops.pro/dashboard</span>
            </div>
          </div>
          <div style={{ display: "flex", height: "400px" }}>
            <div className="hide-mob" style={{ width: "190px", borderRight: "1px solid #141414", padding: "16px 12px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
              {[
                { label: "Overview", Icon: DashboardCircleIcon, active: false },
                { label: "Performance", Icon: EyeIcon, active: false },
                { label: "Incidents", Icon: FlashIcon, active: false },
                { label: "Code Insights", Icon: ScanIcon, active: false },
                { label: "Debug with AI", Icon: AiScanIcon, active: true },
              ].map(({ label, Icon, active }) => (
                <div key={label} style={{ padding: "8px 10px", borderRadius: "8px", fontSize: "11.5px", fontWeight: active ? 600 : 400, background: active ? "#1a1a1a" : "transparent", color: active ? "#fff" : "#2a2a2a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icon size={13} color={active ? "#fff" : "#2a2a2a"} /> {label}
                </div>
              ))}
            </div>
            <div style={{ flex: 1, padding: "20px 28px", display: "flex", flexDirection: "column", gap: "14px", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <div style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.15)", fontSize: "11px", color: "#f87171", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#f87171", animation: "pulse-dot 1.5s ease-in-out infinite" }} /> Service degraded
                </div>
                <div style={{ padding: "4px 10px", borderRadius: "6px", background: "#111", border: "1px solid #1a1a1a", fontSize: "11px", color: "#444" }}>my-saas-app</div>
              </div>
              <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
                {["What's wrong?","Why is it slow?","Security check","Explain this"].map(l => (
                  <div key={l} style={{ padding: "5px 12px", borderRadius: "7px", background: "#111", border: "1px solid #1a1a1a", fontSize: "10.5px", color: "#3a3a3a" }}>{l}</div>
                ))}
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
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
                    Found the bottleneck in <span style={{ color: "#e8e8e8", background: "#141414", padding: "1px 7px", borderRadius: "4px", fontFamily: "monospace", fontSize: "11.5px" }}>lib/db.ts:47</span> — an N+1 query inside your product loop. Each request triggers <span style={{ color: "#f87171", fontWeight: 500 }}>~140 separate DB calls</span>. Here's the fix:
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

      {/* ── The Problem ───────────────────────────────────────────────────── */}
      <section style={{ background: "#fafafa", borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0" }}>
        <div ref={monitor.ref} className={`reveal${monitor.inView ? " in" : ""}`} style={{ maxWidth: "860px", margin: "0 auto", padding: "clamp(80px,10vw,120px) clamp(20px,4vw,48px)", textAlign: "center" }}>
          <p style={{ fontSize: "11px", color: "#bbb", fontWeight: 700, letterSpacing: "0.14em", marginBottom: "20px" }}>SOUND FAMILIAR?</p>
          <h2 style={{ fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#0a0a0a", lineHeight: 1.1, margin: "0 0 24px" }}>
            It's 2am. Something is broken.<br />You have no idea what.
          </h2>
          <p style={{ color: "#888", fontSize: "clamp(14px,2vw,17px)", lineHeight: 1.8, maxWidth: "620px", margin: "0 auto 64px" }}>
            You're SSH-ing into servers, grepping logs, checking Slack, comparing deploys — and 40 minutes later you still don't know if it's your code, your database, your hosting provider, or something else entirely.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1px", background: "#e8e8e8", borderRadius: "16px", overflow: "hidden", border: "1px solid #e8e8e8", textAlign: "left" }}>
            {[
              { Icon: Alert01Icon, problem: "User reports it's down", reality: "You find out from a Slack DM, not an alert" },
              { Icon: SearchList01Icon, problem: "You grep through logs", reality: "Thousands of lines, no clear cause" },
              { Icon: GitBranchIcon, problem: "Was it the last deploy?", reality: "Or the DB? Or a dependency? No way to tell" },
              { Icon: Clock01Icon, problem: "An hour goes by", reality: "You're still debugging instead of fixing" },
            ].map(({ Icon, problem, reality }) => (
              <div key={problem} style={{ background: "#fff", padding: "28px 24px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#fafafa", border: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  <Icon size={18} color="#888" />
                </div>
                <p style={{ fontSize: "13.5px", fontWeight: 700, color: "#0a0a0a", margin: "0 0 6px" }}>{problem}</p>
                <p style={{ fontSize: "12.5px", color: "#aaa", margin: 0, lineHeight: 1.6 }}>{reality}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Answer ────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: "860px", margin: "0 auto", padding: "clamp(80px,10vw,120px) clamp(20px,4vw,48px)", textAlign: "center" }}>
        <div ref={stats.ref} className={`reveal${stats.inView ? " in" : ""}`}>
          <p style={{ fontSize: "11px", color: "#bbb", fontWeight: 700, letterSpacing: "0.14em", marginBottom: "20px" }}>WHAT IF</p>
          <h2 style={{ fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#0a0a0a", lineHeight: 1.1, margin: "0 0 24px" }}>
            Your infrastructure<br />could just tell you.
          </h2>
          <p style={{ color: "#888", fontSize: "clamp(14px,2vw,17px)", lineHeight: 1.8, maxWidth: "620px", margin: "0 auto 64px" }}>
            m-ops reads your GitHub repos, watches your live services, and connects to your hosting providers. So when something goes wrong, you don't have to investigate — you just ask.
          </p>

          {/* Before / After */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", textAlign: "left" }} className="mob-col">
            <div style={{ background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: "16px", padding: "28px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#ddd", letterSpacing: "0.1em", margin: "0 0 20px" }}>BEFORE M-OPS</p>
              {["Find out from a user complaint","Dig through logs manually","No idea if it's code or infra","Fix takes 45+ minutes","Do it all again next time"].map(t => (
                <div key={t} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "12px" }}>
                  <span style={{ color: "#f87171", fontSize: "14px", marginTop: "1px", flexShrink: 0 }}>✗</span>
                  <span style={{ fontSize: "13.5px", color: "#aaa" }}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#f0fdf4", border: "1px solid #d1fae5", borderRadius: "16px", padding: "28px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#86efac", letterSpacing: "0.1em", margin: "0 0 20px" }}>WITH M-OPS</p>
              {["Alerted before your users notice","Ask what broke, get a direct answer","AI pinpoints code, DB, or provider","Fix in minutes with the exact diff","Automated from now on"].map(t => (
                <div key={t} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "12px" }}>
                  <span style={{ color: "#22c55e", fontSize: "14px", marginTop: "1px", flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: "13.5px", color: "#333" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it actually works ─────────────────────────────────────────── */}
      <section id="how" style={{ background: "#0a0a0a" }}>
        <div ref={howit.ref} className={`reveal${howit.inView ? " in" : ""}`} style={{ maxWidth: "1080px", margin: "0 auto", padding: "clamp(80px,10vw,120px) clamp(20px,4vw,48px)" }}>
          <div style={{ textAlign: "center", marginBottom: "72px" }}>
            <p style={{ fontSize: "11px", color: "#444", fontWeight: 700, letterSpacing: "0.14em", marginBottom: "20px" }}>HOW IT WORKS</p>
            <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.1 }}>
              From chaos to clarity<br />in three steps.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "24px" }}>
            {[
              {
                n: "01", color: "#818cf8",
                title: "Connect your entire stack",
                body: "Link your GitHub repos, Vercel, Netlify, Railway, Render, Fly.io, or Heroku. Paste any URL you want monitored. It takes under 60 seconds and nothing needs configuring.",
                detail: "GitHub · Vercel · Netlify · Railway · Render · Fly.io · Heroku"
              },
              {
                n: "02", color: "#4ade80",
                title: "The AI reads everything",
                body: "m-ops ingests your actual codebase — not just logs. It understands your architecture, your data models, your API routes. It builds a live picture of how your stack fits together.",
                detail: "Codebase · Deploy history · Error logs · Uptime data"
              },
              {
                n: "03", color: "#f87171",
                title: "Know before your users do",
                body: "When a service drops or slows down, you get an alert instantly. Open the dashboard, ask what's wrong, and the AI responds with the exact file, the exact line, and the exact fix.",
                detail: "Real-time alerts · Root cause · Code diff · One-click apply"
              },
            ].map(({ n, color, title, body, detail }) => (
              <div key={n} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "20px", padding: "36px 32px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color, letterSpacing: "0.06em", background: `${color}18`, border: `1px solid ${color}30`, borderRadius: "8px", padding: "4px 10px" }}>{n}</span>
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.025em", lineHeight: 1.3 }}>{title}</h3>
                <p style={{ fontSize: "13.5px", color: "#555", lineHeight: 1.75, margin: "0 0 20px" }}>{body}</p>
                <p style={{ fontSize: "11px", color: "#2a2a2a", fontWeight: 600, letterSpacing: "0.06em", borderTop: "1px solid #161616", paddingTop: "16px", margin: 0 }}>{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Monitoring live UI ────────────────────────────────────────────── */}
      <section style={{ maxWidth: "1080px", margin: "0 auto 140px", padding: "clamp(80px,10vw,120px) clamp(20px,4vw,48px) 0" }}>
        <div ref={features.ref} className={`reveal${features.inView ? " in" : ""}`} style={{ display: "flex", gap: "60px", alignItems: "center", flexWrap: "wrap" }} >
          <div style={{ flex: "1 1 300px", minWidth: "260px" }}>
            <p style={{ fontSize: "11px", color: "#bbb", fontWeight: 700, letterSpacing: "0.14em", marginBottom: "20px" }}>MONITORING</p>
            <h2 style={{ fontSize: "clamp(26px,3.5vw,42px)", fontWeight: 800, letterSpacing: "-0.04em", margin: "0 0 20px", color: "#0a0a0a", lineHeight: 1.15 }}>
              You shouldn't have to<br />check if things are up.
            </h2>
            <p style={{ color: "#888", fontSize: "15px", lineHeight: 1.8, margin: "0 0 32px" }}>
              m-ops pings every service you add — every 30 seconds on Pro. The moment something goes down, you get an alert with the status code, response time, and how long it's been down. Not a generic "it's broken." Actual detail.
            </p>
            {[
              ["Instant alerts", "Email, Slack, or PagerDuty the moment a service drops"],
              ["Recovery tracking", "Automatically knows when it came back and for how long"],
              ["Latency trends", "Spot services slowing down before they become incidents"],
            ].map(([label, desc]) => (
              <div key={label} style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "18px" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "6px", background: "#f5f5f5", border: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0a0a0a" }} />
                </div>
                <div>
                  <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#0a0a0a", marginBottom: "3px" }}>{label}</div>
                  <div style={{ fontSize: "12.5px", color: "#aaa", lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ flex: "1 1 420px", minWidth: "300px" }}>
            <div style={{ borderRadius: "16px", border: "1px solid #e8e8e8", overflow: "hidden", background: "#fff", boxShadow: "0 20px 60px rgba(0,0,0,0.06)" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#0a0a0a" }}>Live status</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", animation: "pulse-dot 2s ease-in-out infinite" }} />
                  <span style={{ fontSize: "11px", color: "#888" }}>Checking every 30s</span>
                </div>
              </div>
              {[
                { name: "my-saas-app", provider: "Vercel", ok: true, ms: 142, bars: [1,1,1,1,1,1,1,1,0.8,1,1,1,1,1,1,1,1,1,1,1] },
                { name: "api-server", provider: "Railway", ok: true, ms: 89, bars: [1,1,1,1,1,0.5,1,1,1,1,1,1,1,1,1,0.9,1,1,1,1] },
                { name: "marketing-site", provider: "Netlify", ok: false, ms: null, bars: [1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0] },
                { name: "admin-panel", provider: "Fly.io", ok: true, ms: 204, bars: [1,1,0.7,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
              ].map(({ name, provider, ok, ms, bars }) => (
                <div key={name} style={{ padding: "13px 20px", borderBottom: "1px solid #f8f8f8", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: ok ? "#4ade80" : "#f87171", flexShrink: 0, animation: !ok ? "pulse-dot 1.5s ease-in-out infinite" : "none" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#0a0a0a" }}>{name}</span>
                      <span style={{ fontSize: "10px", color: "#ccc", background: "#f8f8f8", border: "1px solid #eee", borderRadius: "4px", padding: "1px 6px" }}>{provider}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "2px", alignItems: "flex-end" }}>
                    {bars.map((h, i) => (
                      <div key={i} style={{ width: "3px", height: `${16*h}px`, borderRadius: "2px", background: h===0 ? "#fecaca" : h<0.9 ? "#fde68a" : "#d1fae5" }} />
                    ))}
                  </div>
                  <div style={{ fontSize: "11.5px", fontWeight: 600, color: ok ? "#0a0a0a" : "#f87171", minWidth: "42px", textAlign: "right" }}>
                    {ok && ms ? `${ms}ms` : ok ? "—" : "down"}
                  </div>
                </div>
              ))}
              <div style={{ padding: "12px 20px", background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f87171", animation: "pulse-dot 1s ease-in-out infinite" }} />
                  <span style={{ fontSize: "11.5px", color: "#ef4444", fontWeight: 500 }}>marketing-site down · 14m ago</span>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#ef4444", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "6px", padding: "3px 10px" }}>⚡ Diagnose</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who is this for ───────────────────────────────────────────────── */}
      <section id="features" style={{ background: "#fafafa", borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0", margin: "140px 0 0" }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "clamp(80px,10vw,100px) clamp(20px,4vw,48px)" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <p style={{ fontSize: "11px", color: "#bbb", fontWeight: 700, letterSpacing: "0.14em", marginBottom: "20px" }}>WHO IT'S FOR</p>
            <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#0a0a0a", margin: 0 }}>
              Built for developers who ship.
            </h2>
          </div>
          <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "1px", background: "#e8e8e8", borderRadius: "20px", overflow: "hidden", border: "1px solid #e8e8e8" }}>
            {FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} className="feat-card" style={{ background: "#fff", padding: "36px 32px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: "#f5f5f5", border: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "18px" }}>
                  <Icon size={17} color="#0a0a0a" />
                </div>
                <h3 style={{ fontSize: "14.5px", fontWeight: 700, color: "#0a0a0a", margin: "0 0 8px", letterSpacing: "-0.02em" }}>{title}</h3>
                <p style={{ fontSize: "13px", color: "#999", lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ maxWidth: "1080px", margin: "0 auto 140px", padding: "0 clamp(20px,4vw,48px)" }}>
        <div ref={pricing.ref} className={`reveal${pricing.inView ? " in" : ""}`}>
          <div style={{ textAlign: "center", marginBottom: "72px" }}>
            <p style={{ fontSize: "11px", color: "#aaa", fontWeight: 600, letterSpacing: "0.12em", marginBottom: "14px" }}>PRICING</p>
            <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.04em", margin: "0 0 16px", color: "#0a0a0a" }}>Simple, honest pricing.</h2>
            <p style={{ color: "#888", fontSize: "16px" }}>Start free. Scale when you need to.</p>
          </div>
          <div className="price-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "24px" }}>
            {[
              { name: "Free", price: "$0", period: "/mo", highlight: false, desc: "For personal projects and learning.", features: ["Up to 3 projects","5-minute check intervals","7-day history","Email alerts","Community support"] },
              { name: "Pro", price: "$2", period: "/mo", highlight: true, desc: "For teams that need reliability.", features: ["Unlimited projects","30-second intervals","90-day history","Slack & PagerDuty","AI root cause analysis","Priority support"] },
              { name: "Team", price: "$5", period: "/mo", highlight: false, desc: "For orgs with critical uptime.", features: ["Everything in Pro","5 team seats","Custom check intervals","On-call scheduling","SLA reports","Dedicated support"] },
            ].map(({ name, price, period, highlight, desc, features }) => (
              <div key={name} className="price-card" style={{ background: highlight ? "#0a0a0a" : "#fff", border: highlight ? "none" : "1px solid #f0f0f0", borderRadius: "20px", padding: "36px", display: "flex", flexDirection: "column", position: "relative", boxShadow: highlight ? "0 24px 60px rgba(0,0,0,0.15)" : "none" }}>
                {highlight && <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "#fff", color: "#0a0a0a", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", padding: "4px 14px", borderRadius: "100px" }}>MOST POPULAR</div>}
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
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" style={{ display: "block", textAlign: "center", background: highlight ? "#fff" : "#0a0a0a", color: highlight ? "#0a0a0a" : "#fff", fontWeight: 700, fontSize: "14px", padding: "13px 24px", borderRadius: "12px", textDecoration: "none" }}>
                  {name === "Free" ? "Get started free" : `Start ${name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section ref={cta.ref} className={`reveal${cta.inView ? " in" : ""}`} style={{ background: "#0a0a0a" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", padding: "clamp(80px,10vw,120px) clamp(20px,4vw,48px)", textAlign: "center" }}>
          <p style={{ fontSize: "11px", color: "#333", fontWeight: 700, letterSpacing: "0.14em", marginBottom: "20px" }}>GET STARTED</p>
          <h2 style={{ fontSize: "clamp(32px,5vw,56px)", fontWeight: 800, letterSpacing: "-0.05em", margin: "0 0 20px", color: "#fff", lineHeight: 1.1 }}>
            Stop debugging in the dark.
          </h2>
          <p style={{ color: "#555", fontSize: "clamp(14px,2vw,17px)", marginBottom: "48px", lineHeight: 1.8, maxWidth: "540px", margin: "0 auto 48px" }}>
            Connect your first project and m-ops starts watching it immediately — no setup, no config, no docs. Free forever for personal use.
          </p>
          <Link href="/signup" className="cta-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#fff", color: "#0a0a0a", fontSize: "14px", fontWeight: 700, padding: "14px 36px", borderRadius: "12px", textDecoration: "none" }}>
            Start for free <ArrowRightBigIcon size={14} color="#0a0a0a" />
          </Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", marginTop: "28px", flexWrap: "wrap" }}>
            {["No credit card", "Free for personal use", "Cancel anytime"].map(t => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: "6px", color: "#333", fontSize: "12px" }}>
                <ValidationIcon size={12} color="#333" /> {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#0a0a0a", borderTop: "1px solid #1a1a1a", padding: "48px clamp(20px,4vw,48px) 32px" }}>
        <div className="footer-inner" style={{ maxWidth: "1080px", margin: "0 auto", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "40px", marginBottom: "48px" }}>
          <div>
            <span style={{ color: "#fff", fontSize: "17px", fontWeight: 800, letterSpacing: "-0.05em", display: "block", marginBottom: "10px" }}>m-ops</span>
            <p style={{ color: "#444", fontSize: "13px", maxWidth: "200px", lineHeight: 1.6 }}>AI-powered monitoring for developers who ship.</p>
          </div>
          <div style={{ display: "flex", gap: "48px", flexWrap: "wrap" }}>
            {[
              { heading: "PRODUCT", links: [["#features","Features"],["#how","How it works"],["#pricing","Pricing"]] },
              { heading: "LEGAL", links: [["/terms","Terms"],["/privacy","Privacy"]] },
              { heading: "CONTACT", links: [["mailto:hello@m-ops.pro","hello@m-ops.pro"]] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <p style={{ color: "#333", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "16px" }}>{heading}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {links.map(([h,l]) => (
                    <a key={h} href={h} className="footer-link">{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: "1080px", margin: "0 auto", paddingTop: "24px", borderTop: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <p style={{ color: "#333", fontSize: "12px" }}>© {new Date().getFullYear()} m-ops · Built for developers who ship.</p>
          <div style={{ display: "flex", gap: "16px" }}>
            <a href="/status" className="footer-link" style={{ fontSize: "12px", color: "#333" }}>Status</a>
            <a href="/docs" className="footer-link" style={{ fontSize: "12px", color: "#333" }}>Docs</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
