import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendWelcomeEmail } from "@/lib/email"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) return NextResponse.redirect(new URL("/login?error=invalid_token", req.url))

  const record = await prisma.verificationToken.findUnique({ where: { token } })
  if (!record || record.expires < new Date()) {
    return NextResponse.redirect(new URL("/login?error=token_expired", req.url))
  }

  // Mark email as verified
  await prisma.user.updateMany({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
  })
  await prisma.verificationToken.delete({ where: { token } })

  // Send welcome email now that they're verified
  const user = await prisma.user.findUnique({ where: { email: record.identifier } })
  if (user) sendWelcomeEmail(user.email!, user.name ?? null).catch(() => {})

  return NextResponse.redirect(new URL("/login?verified=1", req.url))
}
