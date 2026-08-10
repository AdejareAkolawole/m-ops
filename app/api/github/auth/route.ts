import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "GITHUB_CLIENT_ID not set" }, { status: 500 })
  }

  const origin = req.nextUrl.origin
  const callbackUrl = `${origin}/api/github/callback`
  const state = Math.random().toString(36).slice(2)

  const url = new URL("https://github.com/login/oauth/authorize")
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("redirect_uri", callbackUrl)
  url.searchParams.set("scope", "repo read:user")
  url.searchParams.set("state", state)

  return NextResponse.redirect(url.toString())
}
