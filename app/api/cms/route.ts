import { NextRequest, NextResponse } from "next/server"

// Proxy to the project's /api/hub-cms endpoint, forwarding the hub secret.
// This keeps the secret server-side and avoids CORS issues.
export async function POST(req: NextRequest) {
  try {
    const { projectUrl, hubSecret, action, payload } = await req.json()
    if (!projectUrl || !hubSecret) {
      return NextResponse.json({ error: "projectUrl and hubSecret required" }, { status: 400 })
    }

    const base = projectUrl.replace(/\/$/, "")
    const url = `${base}/api/hub-cms`

    const res = await fetch(url, {
      method: action === "get" ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-secret": hubSecret,
      },
      body: action === "get" ? undefined : JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })

    const text = await res.text()
    let data: unknown
    try { data = JSON.parse(text) } catch { data = { raw: text } }

    return NextResponse.json({ ok: res.ok, status: res.status, data })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
