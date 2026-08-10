import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 })

  const res = await fetch("https://api.render.com/v1/services?limit=100", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  })
  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: text || "Invalid token or API error" }, { status: res.status })
  }
  const json = await res.json()
  // Render returns [{ service: {...}, cursor: "..." }]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const services = Array.isArray(json) ? json.map((item: any) => item.service ?? item) : json.services ?? []
  return NextResponse.json(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    services.map((s: any) => ({
      id: s.id,
      provider: "render",
      name: s.name,
      url: s.serviceDetails?.url ?? null,
      status: s.suspended ?? null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }))
  )
}
