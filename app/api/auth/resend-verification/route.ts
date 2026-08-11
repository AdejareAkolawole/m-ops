import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendVerificationEmail } from "@/lib/email"
import crypto from "crypto"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { emailVerified: true } })
  if (user?.emailVerified) {
    return NextResponse.json({ error: "Already verified" }, { status: 400 })
  }

  // Delete existing tokens for this email
  await prisma.verificationToken.deleteMany({ where: { identifier: session.user.email } })

  const token = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24) // 24 hours

  await prisma.verificationToken.create({
    data: { identifier: session.user.email, token, expires },
  })

  await sendVerificationEmail(session.user.email, token).catch(() => {})

  return NextResponse.json({ ok: true })
}
