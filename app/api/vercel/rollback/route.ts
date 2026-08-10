import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { token, teamId, projectId, deploymentId } = await req.json()
  if (!token || !projectId || !deploymentId) {
    return NextResponse.json({ error: "token, projectId, deploymentId required" }, { status: 400 })
  }

  // Vercel promote (rollback) endpoint — promotes a deployment to production
  const url = teamId
    ? `https://api.vercel.com/v10/projects/${projectId}/promote/${deploymentId}?teamId=${teamId}`
    : `https://api.vercel.com/v10/projects/${projectId}/promote/${deploymentId}`

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    return NextResponse.json({ error: data.error?.message ?? "Rollback failed" }, { status: res.status })
  }
  return NextResponse.json({ ok: true })
}
