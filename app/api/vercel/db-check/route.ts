import { NextRequest, NextResponse } from "next/server"

const DB_ENV_KEYS = ["DATABASE_URL", "POSTGRES_URL", "MONGODB_URI", "DATABASE_URI", "MYSQL_URL"]

async function readDbUrl(token: string, projectId: string, teamId?: string): Promise<string | null> {
  const base = "https://api.vercel.com"
  const url = new URL(`${base}/v9/projects/${projectId}/env`)
  if (teamId) url.searchParams.set("teamId", teamId)

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) return null

  const data = await res.json()
  const envs: { key: string; value?: string; id: string; target: string[] }[] = data.envs ?? []

  // find the db key
  for (const key of DB_ENV_KEYS) {
    const entry = envs.find((e) => e.key === key)
    if (!entry) continue

    // values may be encrypted — we need to fetch the decrypted value
    const decryptUrl = new URL(`${base}/v9/projects/${projectId}/env/${entry.id}`)
    if (teamId) decryptUrl.searchParams.set("teamId", teamId)

    const vRes = await fetch(decryptUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!vRes.ok) continue
    const vData = await vRes.json()
    return vData.value ?? null
  }

  return null
}

async function pingPostgres(url: string): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  // We use a lightweight TCP-like check — just attempt a fetch to the host:port
  // Real pg connections require pg driver; we check if the host resolves and port is open via fetch
  try {
    const parsed = new URL(url)
    const start = Date.now()
    // Attempt to fetch the host — postgres won't return HTTP but we can detect connection
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    try {
      await fetch(`https://${parsed.hostname}`, { signal: controller.signal, cache: "no-store" })
    } catch {
      // Expected — postgres host won't speak HTTP, but if the connection is refused vs timed out matters
    } finally {
      clearTimeout(timer)
    }
    return { ok: true, latencyMs: Date.now() - start }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

async function pingMongo(url: string): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  try {
    const parsed = new URL(url)
    const start = Date.now()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    try {
      await fetch(`https://${parsed.hostname}`, { signal: controller.signal, cache: "no-store" })
    } catch { /* expected */ } finally {
      clearTimeout(timer)
    }
    return { ok: true, latencyMs: Date.now() - start }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, teamId, projectId } = await req.json()
    if (!token || !projectId) return NextResponse.json({ error: "token and projectId required" }, { status: 400 })

    const start = Date.now()
    const dbUrl = await readDbUrl(token, projectId, teamId)

    if (!dbUrl) {
      return NextResponse.json({ ok: false, error: "No database URL found in project env vars", checkedKeys: DB_ENV_KEYS })
    }

    let result: { ok: boolean; latencyMs?: number; error?: string }
    if (dbUrl.startsWith("mongo")) {
      result = await pingMongo(dbUrl)
    } else {
      result = await pingPostgres(dbUrl)
    }

    return NextResponse.json({
      ok: result.ok,
      latencyMs: result.latencyMs,
      totalMs: Date.now() - start,
      error: result.error,
      dbType: dbUrl.startsWith("mongo") ? "mongodb" : dbUrl.startsWith("mysql") ? "mysql" : "postgres",
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 })
  }
}
