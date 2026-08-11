import { NextResponse } from "next/server"
import { auth } from "@/auth"

// Returns the GitHub token from the NextAuth session (stored when user signed in with GitHub).
// This avoids needing a second OAuth app callback URL.
export async function GET() {
  const session = await auth()
  const githubToken = (session as any)?.githubToken

  if (!githubToken) {
    return NextResponse.json({ error: "No GitHub token. Sign in with GitHub to use Code Insights." }, { status: 401 })
  }

  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${githubToken}`, Accept: "application/vnd.github+json" },
  })
  const user = await userRes.json()

  return NextResponse.json({ token: githubToken, login: user.login, avatar: user.avatar_url })
}
