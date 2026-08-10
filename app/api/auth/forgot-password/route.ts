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

  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3005"}/reset-password/${token}`

  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import("resend")
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: "m-ops <noreply@m-ops.dev>",
      to: email,
      subject: "Reset your m-ops password",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#0f172a">Reset your password</h2>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
          <p style="color:#94a3b8;font-size:13px;margin-top:24px">If you didn't request this, ignore this email.</p>
        </div>
      `,
    })
  } else {
    // Dev fallback: log the link
    console.log(`[forgot-password] reset link: ${resetUrl}`)
  }

  return NextResponse.json({ ok: true })
}
