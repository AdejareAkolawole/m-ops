import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  const base = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? ""

  if (error || !code || !state) {
    return NextResponse.redirect(`${base}/settings?tab=alerts&slack=error`)
  }

  let userId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString())
    userId = decoded.userId
    if (!userId) throw new Error("no userId")
  } catch {
    return NextResponse.redirect(`${base}/settings?tab=alerts&slack=error`)
  }

  const clientId = process.env.SLACK_CLIENT_ID!
  const clientSecret = process.env.SLACK_CLIENT_SECRET!
  const redirectUri = `${base}/api/auth/slack/callback`

  const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri }),
  })
  const data = await tokenRes.json()

  if (!data.ok || !data.incoming_webhook?.url) {
    return NextResponse.redirect(`${base}/settings?tab=alerts&slack=error`)
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      slackWebhookUrl: data.incoming_webhook.url,
      slackChannelName: data.incoming_webhook.channel,
      slackTeamName: data.team?.name ?? null,
    },
  })

  return NextResponse.redirect(`${base}/settings?tab=alerts&slack=connected`)
}
