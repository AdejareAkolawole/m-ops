import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  // Try JWT first (populated on sign-in), fall back to DB (works for existing sessions)
  let githubToken = (session as any)?.githubToken

  if (!githubToken) {
    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, provider: "github" },
      select: { access_token: true },
    })
    githubToken = account?.access_token ?? null
  }

  if (!githubToken) {
    return NextResponse.json({ error: "No GitHub token. Sign in with GitHub to use Code Insights." }, { status: 401 })
  }

  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${githubToken}`, Accept: "application/vnd.github+json" },
  })
  const user = await userRes.json()

  return NextResponse.json({ token: githubToken, login: user.login, avatar: user.avatar_url })
}
