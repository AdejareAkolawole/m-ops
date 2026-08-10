import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 })

  const start = Date.now()
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 10000)
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "ProjectHub/1.0" },
      redirect: "follow",
    })
    clearTimeout(t)
    const ms = Date.now() - start
    return NextResponse.json({
      ok: res.status < 500,
      statusCode: res.status,
      responseMs: ms,
      timestamp: new Date().toISOString(),
    })
  } catch (e: unknown) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "unreachable",
      responseMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    })
  }
}
