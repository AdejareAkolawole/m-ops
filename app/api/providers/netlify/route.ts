import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 })

  const res = await fetch("https://api.netlify.com/api/v1/sites?per_page=100", {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: text || "Invalid token or API error" }, { status: res.status })
  }
  const sites = await res.json()
  return NextResponse.json(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sites.map((s: any) => ({
      id: s.id,
      provider: "netlify",
      name: s.name,
      url: s.ssl_url || s.url || null,
      status: s.published_deploy?.state ?? null,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }))
  )
}
