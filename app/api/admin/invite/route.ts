import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/admin"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email || !isAdmin(session.user.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { name, email, password } = await req.json()
  if (!email || !password) return NextResponse.json({ error: "email and password required" }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 chars" }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 })

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name: name?.trim() || null, email: email.trim(), password: hashed },
    select: { id: true, name: true, email: true, createdAt: true },
  })
  return NextResponse.json(user)
}
