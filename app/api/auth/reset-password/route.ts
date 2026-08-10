import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password) return NextResponse.json({ error: "token and password required" }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })

  const record = await prisma.passwordResetToken.findUnique({ where: { token } })
  if (!record || record.used || record.expires < new Date())
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 })

  const hashed = await bcrypt.hash(password, 12)
  await prisma.user.update({ where: { id: record.userId }, data: { password: hashed } })
  await prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } })

  // Invalidate all sessions for this user
  await prisma.session.deleteMany({ where: { userId: record.userId } })

  return NextResponse.json({ ok: true })
}
