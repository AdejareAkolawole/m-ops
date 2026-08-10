import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("bachs-signature") || ""
  const webhookSecret = process.env.BACHS_WEBHOOK_SECRET

  if (webhookSecret) {
    // Verify HMAC-SHA256 signature
    const crypto = await import("crypto")
    const expected = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex")
    if (sig !== expected) return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const event = JSON.parse(body)

  if (event.type === "collection.succeeded") {
    const { checkout_id } = event.data
    // Fetch the checkout to get metadata
    const apiKey = process.env.BACHS_SECRET_KEY
    if (apiKey) {
      const res = await fetch(`https://sandbox-api.bachs.io/v1/checkout-sessions/${checkout_id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      if (res.ok) {
        const checkout = await res.json()
        const { userId, plan } = checkout.metadata || {}
        if (userId && plan) {
          await prisma.user.update({
            where: { id: userId },
            data: { plan, bachsCustomerId: checkout.customer?.id },
          })
        }
      }
    }
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const sub = event.data
    const userId = sub.metadata?.userId
    const plan = sub.metadata?.plan
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: sub.status === "active" || sub.status === "trialing" ? (plan || "pro") : "free",
          bachsSubscriptionId: sub.id,
        },
      })
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data
    const userId = sub.metadata?.userId
    if (userId) {
      await prisma.user.update({ where: { id: userId }, data: { plan: "free", bachsSubscriptionId: null } })
    }
  }

  return NextResponse.json({ ok: true })
}
