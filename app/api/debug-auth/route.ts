import { NextResponse } from "next/server"

export async function GET() {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN
  const authSecret = process.env.AUTH_SECRET
  const githubId = process.env.GITHUB_CLIENT_ID

  let dbResult = "not tested"
  if (tursoUrl && tursoToken) {
    try {
      const { createClient } = await import("@libsql/client")
      const db = createClient({ url: tursoUrl, authToken: tursoToken })
      const r = await db.execute("SELECT COUNT(*) as c FROM User")
      dbResult = `ok, users: ${r.rows[0].c}`
    } catch (e: any) {
      dbResult = `error: ${e.message}`
    }
  }

  return NextResponse.json({
    tursoUrl: tursoUrl ? tursoUrl.slice(0, 40) + "..." : "MISSING",
    tursoToken: tursoToken ? "SET (" + tursoToken.length + " chars)" : "MISSING",
    authSecret: authSecret ? "SET" : "MISSING",
    githubId: githubId ?? "MISSING",
    dbResult,
  })
}
