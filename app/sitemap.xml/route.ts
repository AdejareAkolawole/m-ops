import { NextResponse } from "next/server"

export function GET() {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3005"
  const pages = [
    { url: "/", priority: "1.0", changefreq: "weekly" },
    { url: "/login", priority: "0.8", changefreq: "monthly" },
    { url: "/signup", priority: "0.8", changefreq: "monthly" },
    { url: "/terms", priority: "0.3", changefreq: "yearly" },
    { url: "/privacy", priority: "0.3", changefreq: "yearly" },
  ]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${base}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join("\n")}
</urlset>`
  return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } })
}
