import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notifyEmail: true, notifyIncidents: true, slackWebhookUrl: true, slackChannelName: true, slackTeamName: true, pagerdutyKey: true, customIntervalSec: true, plan: true },
  })
  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const allowed = ["notifyEmail", "notifyIncidents", "slackWebhookUrl", "pagerdutyKey", "customIntervalSec"]
  const data: Record<string, unknown> = {}
  for (const k of allowed) if (k in body) data[k] = body[k]
  const updated = await prisma.user.update({ where: { id: session.user.id }, data })
  return NextResponse.json({ ok: true, updated })
}
