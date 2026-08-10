import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notifyEmail: true, notifyIncidents: true, notifyWeeklyReport: true },
  })
  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { notifyEmail, notifyIncidents, notifyWeeklyReport } = await req.json()
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { notifyEmail, notifyIncidents, notifyWeeklyReport },
    select: { notifyEmail: true, notifyIncidents: true, notifyWeeklyReport: true },
  })
  return NextResponse.json(user)
}
