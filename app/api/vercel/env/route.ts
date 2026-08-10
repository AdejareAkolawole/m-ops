import { NextRequest, NextResponse } from "next/server"

// Add an env var to a Vercel project
export async function POST(req: NextRequest) {
  const { token, teamId, projectId, key, value, targets } = await req.json()
  if (!token || !projectId || !key || value === undefined) {
    return NextResponse.json({ error: "token, projectId, key, value required" }, { status: 400 })
  }

  const url = teamId
    ? `https://api.vercel.com/v10/projects/${projectId}/env?teamId=${teamId}`
    : `https://api.vercel.com/v10/projects/${projectId}/env`

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      key,
      value,
      type: "encrypted",
      target: targets ?? ["production", "preview", "development"],
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data.error?.message ?? "Failed to add env var" }, { status: res.status })
  return NextResponse.json({ ok: true, env: data })
}

// Delete an env var from a Vercel project
export async function DELETE(req: NextRequest) {
  const { token, teamId, projectId, envId } = await req.json()
  if (!token || !projectId || !envId) {
    return NextResponse.json({ error: "token, projectId, envId required" }, { status: 400 })
  }

  const url = teamId
    ? `https://api.vercel.com/v10/projects/${projectId}/env/${envId}?teamId=${teamId}`
    : `https://api.vercel.com/v10/projects/${projectId}/env/${envId}`

  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    return NextResponse.json({ error: data.error?.message ?? "Failed to delete env var" }, { status: res.status })
  }
  return NextResponse.json({ ok: true })
}

// Update (edit) an env var
export async function PATCH(req: NextRequest) {
  const { token, teamId, projectId, envId, value, targets } = await req.json()
  if (!token || !projectId || !envId || value === undefined) {
    return NextResponse.json({ error: "token, projectId, envId, value required" }, { status: 400 })
  }

  const url = teamId
    ? `https://api.vercel.com/v10/projects/${projectId}/env/${envId}?teamId=${teamId}`
    : `https://api.vercel.com/v10/projects/${projectId}/env/${envId}`

  const res = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      value,
      type: "encrypted",
      target: targets ?? ["production", "preview", "development"],
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data.error?.message ?? "Failed to update env var" }, { status: res.status })
  return NextResponse.json({ ok: true, env: data })
}
