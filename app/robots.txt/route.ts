import { NextResponse } from "next/server"

export function GET() {
  return new NextResponse(
    `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /settings
Disallow: /admin
Disallow: /api/

Sitemap: ${process.env.NEXTAUTH_URL || "http://localhost:3005"}/sitemap.xml`,
    { headers: { "Content-Type": "text/plain" } }
  )
}
