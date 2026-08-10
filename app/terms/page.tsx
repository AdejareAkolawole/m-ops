import Link from "next/link"

export const metadata = { title: "Terms of Service" }

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", color: "#0a0a0a" }}>
      <nav style={{ borderBottom: "1px solid #f0f0f0", padding: "0 48px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: "15px", color: "#0a0a0a", textDecoration: "none", letterSpacing: "-0.04em" }}>m-ops</Link>
        <Link href="/privacy" style={{ fontSize: "13px", color: "#888", textDecoration: "none" }}>Privacy Policy</Link>
      </nav>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "64px 48px" }}>
        <p style={{ fontSize: "11px", color: "#aaa", fontWeight: 600, letterSpacing: "0.1em", marginBottom: "12px" }}>LEGAL</p>
        <h1 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: "8px" }}>Terms of Service</h1>
        <p style={{ color: "#888", marginBottom: "48px", fontSize: "14px" }}>Last updated: August 10, 2026</p>

        {[
          {
            title: "1. Acceptance of Terms",
            body: "By accessing or using m-ops (\"Service\"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. We may update these terms at any time; continued use after changes constitutes acceptance.",
          },
          {
            title: "2. Description of Service",
            body: "m-ops provides uptime monitoring, performance analytics, and AI-assisted project insights for web services and applications. The Service is provided on an \"as is\" and \"as available\" basis.",
          },
          {
            title: "3. Accounts",
            body: "You must provide accurate information when creating an account. You are responsible for maintaining the security of your credentials and for all activity under your account. Notify us immediately of any unauthorized access.",
          },
          {
            title: "4. Acceptable Use",
            body: "You may not use the Service to: (a) violate any applicable law or regulation; (b) monitor services you do not own or have permission to monitor; (c) scrape, reverse-engineer, or attempt to extract source code; (d) disrupt or overload our infrastructure; (e) transmit malware or harmful code.",
          },
          {
            title: "5. Payments and Billing",
            body: "Paid plans are billed on a recurring basis through our payment processor (Bachs). You authorize us to charge your payment method on the applicable cycle. Refunds are handled on a case-by-case basis — contact us at support@m-ops.dev within 7 days of a charge.",
          },
          {
            title: "6. Free Plan Limitations",
            body: "The free plan is limited to 3 monitored projects and 5-minute check intervals. We reserve the right to modify free plan limits at any time with reasonable notice.",
          },
          {
            title: "7. Data and Privacy",
            body: "Our collection and use of personal data is governed by our Privacy Policy, which is incorporated into these Terms by reference.",
          },
          {
            title: "8. Termination",
            body: "We may suspend or terminate your account at any time for breach of these Terms. You may cancel your account at any time from Settings. Upon termination, your data will be deleted within 30 days.",
          },
          {
            title: "9. Disclaimer of Warranties",
            body: "THE SERVICE IS PROVIDED WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT GUARANTEE 100% UPTIME OF OUR OWN PLATFORM.",
          },
          {
            title: "10. Limitation of Liability",
            body: "TO THE FULLEST EXTENT PERMITTED BY LAW, m-ops SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM USE OF THE SERVICE. OUR AGGREGATE LIABILITY SHALL NOT EXCEED THE AMOUNTS PAID BY YOU IN THE 12 MONTHS PRECEDING THE CLAIM.",
          },
          {
            title: "11. Contact",
            body: "For questions about these Terms, contact us at legal@m-ops.dev.",
          },
        ].map(({ title, body }) => (
          <div key={title} style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "10px" }}>{title}</h2>
            <p style={{ color: "#555", lineHeight: 1.8, fontSize: "14px", margin: 0 }}>{body}</p>
          </div>
        ))}
      </div>
      <footer style={{ borderTop: "1px solid #f0f0f0", padding: "28px 48px", display: "flex", gap: "24px", justifyContent: "center" }}>
        <Link href="/" style={{ color: "#888", fontSize: "13px", textDecoration: "none" }}>Home</Link>
        <Link href="/privacy" style={{ color: "#888", fontSize: "13px", textDecoration: "none" }}>Privacy Policy</Link>
        <a href="mailto:legal@m-ops.dev" style={{ color: "#888", fontSize: "13px", textDecoration: "none" }}>Contact</a>
      </footer>
    </div>
  )
}
