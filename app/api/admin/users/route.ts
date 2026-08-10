import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/admin"
import bcrypt from "bcryptjs"

async function guard() {
  const session = await auth()
  if (!session?.user?.email || !isAdmin(session.user.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  return null
}

export async function GET() {
  const denied = await guard(); if (denied) return denied
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, image: true,
      emailVerified: true, createdAt: true, updatedAt: true,
      accounts: { select: { provider: true, type: true } },
      sessions: { select: { id: true, expires: true }, orderBy: { expires: "desc" } },
      _count: { select: { sessions: true, accounts: true } },
    },
  })
  return NextResponse.json(users)
}

export async function PATCH(req: NextRequest) {
  const denied = await guard(); if (denied) return denied
  const { id, name, email, password } = await req.json()
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name || null
  if (email) data.email = email

  if (password) {
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 chars" }, { status: 400 })
    data.password = await bcrypt.hash(password, 12)
  }

  const user = await prisma.user.update({ where: { id }, data, select: { id: true, name: true, email: true } })
  return NextResponse.json(user)
}

export async function DELETE(req: NextRequest) {
  const denied = await guard(); if (denied) return denied
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
