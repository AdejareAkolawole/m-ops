import type { Metadata } from "next"
import "./globals.css"
import { SessionProvider } from "next-auth/react"

export const metadata: Metadata = {
  title: { default: "m-ops — Uptime Monitoring & AI Project Insights", template: "%s — m-ops" },
  description: "Monitor your web services, catch incidents instantly, and get AI-powered insights into your stack. Built for developers who ship.",
  keywords: ["uptime monitoring", "status page", "incident management", "developer tools", "website monitoring"],
  authors: [{ name: "m-ops" }],
  openGraph: {
    type: "website",
    siteName: "m-ops",
    title: "m-ops — Uptime Monitoring & AI Project Insights",
    description: "Monitor your web services, catch incidents instantly, and get AI-powered insights into your stack.",
  },
  twitter: { card: "summary_large_image", title: "m-ops", description: "Uptime monitoring & AI project insights for developers." },
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
