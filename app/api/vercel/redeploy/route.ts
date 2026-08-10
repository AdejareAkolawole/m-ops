import { NextRequest, NextResponse } from "next/server"
import { triggerRedeploy } from "@/lib/vercel"

export async function POST(req: NextRequest) {
  const { token, teamId, deploymentUrl } = await req.json()
  if (!token || !deploymentUrl) return NextResponse.json({ error: "token and deploymentUrl required" }, { status: 400 })
  try {
    const result = await triggerRedeploy(token, deploymentUrl, teamId || undefined)
    return NextResponse.json(result)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
