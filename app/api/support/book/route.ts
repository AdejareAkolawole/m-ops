import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { planConfig } from "@/lib/plans"
import { sendSupportCallAlert, sendCallConfirmationEmail } from "@/lib/email"

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

  const dt = new Date(preferredAt).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })
  const [datePart, timePart] = dt.split(", ")
  sendSupportCallAlert(user.name ?? null, user.email ?? null, topic, datePart ?? null, timePart ?? null).catch(() => {})
  if (user.email) sendCallConfirmationEmail(user.email, user.name ?? null, topic, dt).catch(() => {})

  return NextResponse.json(call)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  await prisma.supportCall.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ ok: true })
}
