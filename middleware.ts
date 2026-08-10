import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// In-memory rate limiter (resets on cold start — fine for edge/serverless)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

const RATE_LIMITED_PATHS = [
  "/api/auth/signin",
  "/api/auth/signup",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"

  // Rate limit sensitive auth endpoints
  if (RATE_LIMITED_PATHS.some(p => pathname.startsWith(p))) {
    const allowed = rateLimit(`${ip}:${pathname}`, 10, 60_000) // 10 req/min
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 })
    }
  }

  // Auth guard for dashboard
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/settings") || pathname.startsWith("/admin")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/api/auth/signin",
    "/api/auth/signup",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
  ],
}
