import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })

  // Always return ok to prevent email enumeration
  if (!user || !user.password) return NextResponse.json({ ok: true })

  const token = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

  await prisma.passwordResetToken.create({ data: { userId: user.id, token, expires } })

  const { sendPasswordResetEmail } = await import("@/lib/email")
  await sendPasswordResetEmail(user.email!, token).catch(() => {
    console.log(`[forgot-password] reset token: ${token}`)
  })

  return NextResponse.json({ ok: true })
}
