import { NextRequest, NextResponse } from "next/server"
import { CheckResult } from "@/lib/types"
import dns from "dns/promises"

export async function POST(req: NextRequest) {
  const { url, hubSecret, healthEndpoint } = await req.json()
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 })

  let hostname: string
  try { hostname = new URL(url).hostname } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 })
  }

  const check: CheckResult = {
    timestamp: new Date().toISOString(),
    status: "unknown",
    dns: { ok: false },
    ssl: { ok: false },
    http: { ok: false },
  }

  // DNS
  try {
    const records = await dns.resolve4(hostname)
    check.dns = { ok: true, resolvedIp: records[0] }
  } catch (e: unknown) {
    check.dns = { ok: false, error: e instanceof Error ? e.message : "DNS resolution failed" }
  }

  // HTTP baseline
  const start = Date.now()
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 10000)
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "ProjectHub/1.0" } })
    clearTimeout(t)
    check.responseMs = Date.now() - start
    check.http = { ok: res.ok || res.status < 500, statusCode: res.status }
    if (url.startsWith("https://")) check.ssl = { ok: true }
  } catch (e: unknown) {
    check.http = { ok: false, error: e instanceof Error ? e.message : "Request failed" }
  }

  // Rich health endpoint
  if (hubSecret && healthEndpoint) {
    const healthUrl = healthEndpoint.startsWith("http") ? healthEndpoint : `${url.replace(/\/$/, "")}${healthEndpoint}`
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 12000)
      const hRes = await fetch(healthUrl, {
        signal: ctrl.signal,
        headers: { "x-hub-secret": hubSecret, "User-Agent": "ProjectHub/1.0" },
        cache: "no-store",
      })
      clearTimeout(t)
      if (hRes.ok) {
        const raw = await hRes.json()
        // normalise — try to map common shapes
        const health = normaliseHealth(raw)
        check.health = health
        if (health.db) check.health!.db = health.db
      } else {
        check.health = { status: "error", raw: { httpStatus: hRes.status } }
      }
    } catch (e: unknown) {
      check.health = { status: "error", raw: { error: e instanceof Error ? e.message : "health fetch failed" } }
    }
  }

  // Overall status
  if (!check.dns?.ok) check.status = "offline"
  else if (!check.http?.ok) check.status = "offline"
  else if (check.health?.status === "error") check.status = "degraded"
  else if ((check.responseMs ?? 0) > 3000) check.status = "degraded"
  else check.status = "online"

  return NextResponse.json(check)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseHealth(raw: any) {
  // Chavica shape: raw.dbCounts, raw.services, raw.traffic, raw.growth, raw.payments etc
  // Generic shape: raw.status, raw.db, raw.services etc
  const out: import("@/lib/types").HubHealthResponse = { status: "ok" }

  // DB
  if (raw.services?.database) out.db = { ok: raw.services.database.up, latencyMs: raw.services.database.latencyMs }
  else if (raw.db) out.db = raw.db

  // Services
  if (raw.services) out.services = raw.services

  // Stats — from dbCounts (chavica) or raw.stats
  if (raw.dbCounts) {
    out.stats = {
      users: raw.dbCounts.users,
      sites: raw.dbCounts.sites,
      pageViews: raw.dbCounts.pageViews,
      domains: raw.dbCounts.domains,
      subscriptions: raw.dbCounts.subscriptions,
      payments: raw.dbCounts.payments,
    }
  } else if (raw.stats) out.stats = raw.stats

  // Traffic
  if (raw.traffic) out.traffic = { today: raw.traffic.today, yesterday: raw.traffic.yesterday, byDay: raw.traffic.byDay }

  // Growth
  if (raw.growth) out.growth = raw.growth

  // Payments
  if (raw.payments) out.payments = { todayCount: raw.payments.todayCount, todayAmount: raw.payments.todayNGN ?? raw.payments.todayAmount, currency: raw.payments.currency ?? "NGN" }

  // Recent activity
  if (raw.activity?.recentSignups) out.recentSignups = raw.activity.recentSignups
  if (raw.activity?.recentPayments) out.recentPayments = raw.activity.recentPayments

  // Deploy
  if (raw.deploy !== undefined) out.deploy = raw.deploy

  out.fetchedAt = raw.fetchedAt
  out.raw = raw
  return out
}
