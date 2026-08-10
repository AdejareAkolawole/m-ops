import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const error = req.nextUrl.searchParams.get("error")
  const origin = req.nextUrl.origin

  if (error || !code) {
    return NextResponse.redirect(`${origin}/?gh_error=${encodeURIComponent(error || "Authorization denied")}`)
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })
    const tokenData = await tokenRes.json()
    if (tokenData.error || !tokenData.access_token) {
      throw new Error(tokenData.error_description || "Failed to get access token")
    }

    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: "application/vnd.github+json" },
    })
    const user = await userRes.json()

    const params = new URLSearchParams({
      gh_token: tokenData.access_token,
      gh_login: user.login,
      gh_avatar: user.avatar_url || "",
    })
    return NextResponse.redirect(`${origin}/?${params.toString()}`)
  } catch (e: unknown) {
    return NextResponse.redirect(`${origin}/?gh_error=${encodeURIComponent(e instanceof Error ? e.message : "OAuth failed")}`)
  }
}
