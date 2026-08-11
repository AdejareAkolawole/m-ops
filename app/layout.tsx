import type { Metadata } from "next"
import "./globals.css"
import { SessionProvider } from "next-auth/react"

export const metadata: Metadata = {
  title: { default: "m-ops — Full-Stack Developer Ops", template: "%s — m-ops" },
  description: "Monitor deployments, debug with AI, track SLA, get Slack alerts. The ops platform built for developers who ship.",
  keywords: ["uptime monitoring", "ai debugging", "developer ops", "sla reports", "code insights", "incident management"],
  authors: [{ name: "m-ops" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "m-ops",
    title: "m-ops — Full-Stack Developer Ops",
    description: "Monitor deployments, debug with AI, track SLA, get Slack alerts. The ops platform built for developers who ship.",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "m-ops — Full-Stack Developer Ops" }],
    url: "https://m-ops.pro",
  },
  twitter: {
    card: "summary_large_image",
    site: "@mopspro",
    title: "m-ops — Full-Stack Developer Ops",
    description: "Monitor deployments. Debug with AI. Track SLA. Get Slack alerts. Built for developers who ship fast.",
    images: ["/api/og"],
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3005"),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Satoshi', sans-serif" }}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
