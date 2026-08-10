import { NextRequest, NextResponse } from "next/server"
import { listProjects, getProductionUrl } from "@/lib/vercel"

export async function POST(req: NextRequest) {
  const { token, teamId } = await req.json()
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 })
  try {
    const projects = await listProjects(token, teamId || undefined)
    return NextResponse.json(projects.map((p) => ({
      id: p.id,
      name: p.name,
      framework: p.framework,
      productionUrl: getProductionUrl(p),
      latestDeployment: p.latestDeployments?.[0] ?? null,
      updatedAt: p.updatedAt,
    })))
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
