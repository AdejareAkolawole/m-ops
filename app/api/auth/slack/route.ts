import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const clientId = process.env.SLACK_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: "Slack not configured" }, { status: 503 })

  const redirectUri = `${process.env.AUTH_URL ?? process.env.NEXTAUTH_URL}/api/auth/slack/callback`
  const state = Buffer.from(JSON.stringify({ userId: session.user.id, ts: Date.now() })).toString("base64url")

  const url = new URL("https://slack.com/oauth/v2/authorize")
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("scope", "incoming-webhook")
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("state", state)

  return NextResponse.redirect(url.toString())
}
