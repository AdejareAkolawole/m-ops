import { NextRequest, NextResponse } from "next/server"

// Proxy to the project's admin API endpoint.
// Keeps the bearer token server-side, avoids CORS issues.
export async function POST(req: NextRequest) {
  try {
    const { apiUrl, apiToken } = await req.json()
    if (!apiUrl) return NextResponse.json({ error: "apiUrl required" }, { status: 400 })

    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (apiToken) {
      headers["Authorization"] = `Bearer ${apiToken}`
      headers["x-hub-key"] = apiToken
    }

    const res = await fetch(apiUrl, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(10_000),
    })

    const text = await res.text()
    let data: unknown
    try { data = JSON.parse(text) } catch { data = { raw: text } }

    if (!res.ok) return NextResponse.json({ ok: false, status: res.status, error: `HTTP ${res.status} from ${apiUrl}`, data })
    return NextResponse.json({ ok: res.ok, status: res.status, data })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
