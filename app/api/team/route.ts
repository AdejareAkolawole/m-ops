import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { planConfig } from "@/lib/plans"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const members = await prisma.teamMember.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(members)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const cfg = planConfig(user.plan)
  if (cfg.teamSeats <= 1) return NextResponse.json({ error: "plan_required", message: "Team seats require a Team plan." }, { status: 403 })

  const count = await prisma.teamMember.count({ where: { ownerId: session.user.id } })
  if (count >= cfg.teamSeats - 1) return NextResponse.json({ error: "seat_limit", message: `Team plan allows ${cfg.teamSeats} seats total (including you).` }, { status: 403 })

  const { email, name } = await req.json()
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

  const member = await prisma.teamMember.create({
    data: { ownerId: session.user.id, email, name: name || null },
  })
  return NextResponse.json(member)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  await prisma.teamMember.deleteMany({ where: { id, ownerId: session.user.id } })
  return NextResponse.json({ ok: true })
}
