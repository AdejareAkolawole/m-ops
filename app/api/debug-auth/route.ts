import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const userCount = await prisma.user.count()
    return NextResponse.json({
      db: "ok",
      userCount,
      env: {
        hasAuthSecret: !!process.env.AUTH_SECRET,
        hasNextauthSecret: !!process.env.NEXTAUTH_SECRET,
        hasGithubClientId: !!process.env.GITHUB_CLIENT_ID,
        hasGithubClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
        authUrl: process.env.AUTH_URL,
        tursoUrl: process.env.TURSO_DATABASE_URL?.slice(0, 30),
      }
    })
  } catch (e: any) {
    return NextResponse.json({ db: "error", error: e.message }, { status: 500 })
  }
}
