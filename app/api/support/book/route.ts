import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { planConfig } from "@/lib/plans"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const isAdmin = session.user.email === "adejare.akolawole@gmail.com"
  const calls = await prisma.supportCall.findMany({
    where: isAdmin ? undefined : { userId: session.user.id },
    orderBy: { preferredAt: "asc" },
  })
  return NextResponse.json(calls)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, name: true, email: true },
  })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const cfg = planConfig(user.plan)
  if (!cfg.onCallScheduling) {
    return NextResponse.json({ error: "plan_required", message: "Support call booking requires a Team plan." }, { status: 403 })
  }

  const { topic, description, preferredAt, timezone } = await req.json()
  if (!topic || !preferredAt) return NextResponse.json({ error: "topic and preferredAt required" }, { status: 400 })

  const call = await prisma.supportCall.create({
    data: {
      userId: session.user.id,
      name: user.name ?? "Unknown",
      email: user.email,
      topic,
      description: description || null,
      preferredAt: new Date(preferredAt),
      timezone: timezone ?? "UTC",
    },
  })

  // Notify support via email
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    const dt = new Date(preferredAt).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: "m-ops bookings <alerts@m-ops.pro>",
        to: ["adejare.akolawole@gmail.com"],
        reply_to: user.email,
        subject: `New support call request: ${topic}`,
        html: `<div style="font-family:sans-serif;max-width:500px">
          <h2>New support call booked</h2>
          <p><strong>From:</strong> ${user.name} (${user.email})</p>
          <p><strong>Topic:</strong> ${topic}</p>
          <p><strong>Preferred time:</strong> ${dt} (${timezone ?? "UTC"})</p>
          ${description ? `<p><strong>Details:</strong> ${description}</p>` : ""}
          <p>Reply to this email to confirm or reschedule.</p>
        </div>`,
      }),
    }).catch(() => {})

    // Confirmation to user
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: "m-ops support <alerts@m-ops.pro>",
        to: [user.email],
        subject: "Support call request received",
        html: `<div style="font-family:sans-serif;max-width:500px">
          <h2>We received your call request</h2>
          <p>Hi ${user.name},</p>
          <p>Your support call request has been received. We'll confirm your slot shortly.</p>
          <p><strong>Topic:</strong> ${topic}</p>
          <p><strong>Preferred time:</strong> ${dt}</p>
          <hr/>
          <p style="color:#888;font-size:12px">m-ops · Team plan dedicated support</p>
        </div>`,
      }),
    }).catch(() => {})
  }

  return NextResponse.json(call)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  await prisma.supportCall.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ ok: true })
}
