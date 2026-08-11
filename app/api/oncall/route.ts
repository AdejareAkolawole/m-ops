import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { planConfig } from "@/lib/plans"

async function guard() {
  const session = await auth()
  if (!session?.user?.id) return null
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, plan: true } })
  if (!user || !planConfig(user.plan).onCallScheduling) return null
  return user
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const schedules = await prisma.onCallSchedule.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" } })
  return NextResponse.json(schedules)
}

export async function POST(req: NextRequest) {
  const user = await guard()
  if (!user) return NextResponse.json({ error: "plan_required", message: "On-call scheduling requires a Team plan." }, { status: 403 })
  const { name, email, startHour, endHour, days, timezone } = await req.json()
  if (!name || !email) return NextResponse.json({ error: "name and email required" }, { status: 400 })
  const s = await prisma.onCallSchedule.create({
    data: { userId: user.id, name, email, startHour: startHour ?? 0, endHour: endHour ?? 23, days: days ?? "0,1,2,3,4,5,6", timezone: timezone ?? "UTC" },
  })
  return NextResponse.json(s)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  await prisma.onCallSchedule.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ ok: true })
}
