import { ImageResponse } from "@vercel/og"

export const runtime = "edge"

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top nav bar */}
        <div style={{ display: "flex", alignItems: "center", padding: "32px 64px", borderBottom: "1px solid #f0f0f0" }}>
          <span style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.05em", color: "#0a0a0a" }}>m-ops</span>
        </div>

        {/* Hero content */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "0 64px", textAlign: "center" }}>
          {/* Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f5f5f5", border: "1px solid #e8e8e8", borderRadius: "99px", padding: "6px 18px", fontSize: "13px", color: "#555", marginBottom: "36px", fontWeight: 500 }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            All systems operational · m-ops.pro
          </div>

          {/* Headline */}
          <div style={{ fontSize: "80px", fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.055em", color: "#0a0a0a", marginBottom: "28px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span>Your projects deserve</span>
            <span>a brain.</span>
          </div>

          {/* Subtext */}
          <div style={{ color: "#888", fontSize: "20px", lineHeight: 1.6, maxWidth: "580px", marginBottom: "44px" }}>
            Connect GitHub, Vercel, and your hosting providers — then get an AI that knows your stack and tells you what broke, why, and how to fix it.
          </div>

          {/* Pills */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { label: "AI debugging", color: "#7c3aed", bg: "#f5f0ff" },
              { label: "Uptime monitoring", color: "#16a34a", bg: "#f0fdf4" },
              { label: "SLA reports", color: "#1d4ed8", bg: "#eff6ff" },
              { label: "Slack alerts", color: "#b45309", bg: "#fffbeb" },
              { label: "Code insights", color: "#0f766e", bg: "#f0fdfa" },
            ].map(p => (
              <div key={p.label} style={{ background: p.bg, color: p.color, border: `1px solid ${p.color}22`, borderRadius: "8px", padding: "7px 16px", fontSize: "14px", fontWeight: 600 }}>
                {p.label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 64px", borderTop: "1px solid #f0f0f0" }}>
          <span style={{ fontSize: "14px", color: "#aaa" }}>m-ops.pro · Free to start</span>
          <span style={{ fontSize: "14px", color: "#aaa" }}>Monitor · Debug · Ship</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
