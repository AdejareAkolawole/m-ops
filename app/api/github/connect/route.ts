import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 })

  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  })
  if (!res.ok) return NextResponse.json({ error: "Invalid token or GitHub API error" }, { status: res.status })

  const user = await res.json()
  return NextResponse.json({ login: user.login, avatar_url: user.avatar_url, name: user.name })
}
