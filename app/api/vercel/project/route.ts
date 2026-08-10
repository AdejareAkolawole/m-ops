import { NextRequest, NextResponse } from "next/server"
import { listDeployments, listDomains, listEnvVars } from "@/lib/vercel"

export async function POST(req: NextRequest) {
  const { token, teamId, projectId } = await req.json()
  if (!token || !projectId) return NextResponse.json({ error: "token and projectId required" }, { status: 400 })

  try {
    const [deployments, domains, envVars] = await Promise.all([
      listDeployments(token, projectId, teamId || undefined, 5),
      listDomains(token, projectId, teamId || undefined),
      listEnvVars(token, projectId, teamId || undefined),
    ])

    // Check if DATABASE_URL exists (don't expose value)
    const hasDbUrl = envVars.some((e) => e.key === "DATABASE_URL" || e.key === "POSTGRES_URL" || e.key === "MONGODB_URI" || e.key === "DATABASE_URI")
    const dbKey = envVars.find((e) => ["DATABASE_URL", "POSTGRES_URL", "MONGODB_URI", "DATABASE_URI"].includes(e.key))?.key ?? null

    // Env var keys only (no values for security)
    const envKeys = envVars.map((e) => ({ key: e.key, target: e.target }))

    return NextResponse.json({ deployments, domains, hasDbUrl, dbKey, envKeys })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
