import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 })

  const res = await fetch("https://api.heroku.com/apps", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.heroku+json; version=3",
    },
  })
  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: text || "Invalid token or API error" }, { status: res.status })
  }
  const apps = await res.json()
  return NextResponse.json(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apps.map((a: any) => ({
      id: a.id,
      provider: "heroku",
      name: a.name,
      url: a.web_url ?? null,
      status: a.state ?? null,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    }))
  )
}
