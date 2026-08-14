import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { vercelToken: true, vercelTeamId: true, vercelSelectedIds: true },
  })
  if (!user?.vercelToken) return NextResponse.json(null)
  return NextResponse.json({
    token: user.vercelToken,
    teamId: user.vercelTeamId,
    selectedIds: user.vercelSelectedIds ? JSON.parse(user.vercelSelectedIds) : null,
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { token, teamId, selectedIds } = await req.json()
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      vercelToken: token ?? undefined,
      vercelTeamId: teamId ?? null,
      vercelSelectedIds: selectedIds !== undefined ? JSON.stringify(selectedIds) : undefined,
    },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await prisma.user.update({
    where: { id: session.user.id },
    data: { vercelToken: null, vercelTeamId: null, vercelSelectedIds: null },
  })
  return NextResponse.json({ ok: true })
}
