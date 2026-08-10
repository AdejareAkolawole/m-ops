import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/admin"

async function guard() {
  const session = await auth()
  if (!session?.user?.email || !isAdmin(session.user.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  return null
}

export async function GET() {
  const denied = await guard(); if (denied) return denied
  const sessions = await prisma.session.findMany({
    orderBy: { expires: "desc" },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  })
  return NextResponse.json(sessions)
}

export async function DELETE(req: NextRequest) {
  const denied = await guard(); if (denied) return denied
  const { id, userId } = await req.json()
  if (userId) {
    await prisma.session.deleteMany({ where: { userId } })
  } else if (id) {
    await prisma.session.delete({ where: { id } })
  } else {
    return NextResponse.json({ error: "id or userId required" }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
