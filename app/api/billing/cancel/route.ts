import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bachsSubscriptionId: true, plan: true },
  })

  if (!user?.bachsSubscriptionId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 })
  }

  const res = await fetch(`https://api.bachs.io/subscriptions/${user.bachsSubscriptionId}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.BACHS_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    const body = await res.text()
    console.error("[billing/cancel] Bachs error:", res.status, body)
    return NextResponse.json({ error: "Failed to cancel with payment provider" }, { status: 502 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { plan: "free", bachsSubscriptionId: null },
  })

  return NextResponse.json({ ok: true })
}
