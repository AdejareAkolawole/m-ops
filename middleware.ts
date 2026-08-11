import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

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

  if (RATE_LIMITED_PATHS.some(p => pathname.startsWith(p))) {
    const allowed = rateLimit(`${ip}:${pathname}`, 10, 60_000)
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 })
    }
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/settings") || pathname.startsWith("/admin")) {
    const session = await auth()
    if (!session) {
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
