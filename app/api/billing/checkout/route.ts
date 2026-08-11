import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const PLANS: Record<string, { productId: string; name: string }> = {
  pro: { productId: process.env.BACHS_PRO_PRODUCT_ID || "", name: "Pro" },
  team: { productId: process.env.BACHS_TEAM_PRODUCT_ID || "", name: "Team" },
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || !session.user.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { plan } = await req.json()
  const planConfig = PLANS[plan]
  if (!planConfig) return NextResponse.json({ error: "Invalid plan" }, { status: 400 })

  const apiKey = process.env.BACHS_SECRET_KEY
  if (!apiKey) return NextResponse.json({ error: "Billing not configured" }, { status: 503 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const origin = process.env.NEXTAUTH_URL?.startsWith("http://localhost") ? "https://m-ops.pro" : (process.env.NEXTAUTH_URL || "https://m-ops.pro")

  const res = await fetch("https://api.bachs.io/v1/checkout-sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      product_cart: [{ product_id: planConfig.productId, quantity: 1 }],
      customer: { email: session.user.email, name: user.name || undefined },
      billing_currency: "USD",
      success_url: `${origin}/settings?plan=upgraded`,
      cancel_url: `${origin}/settings?plan=cancelled`,
      metadata: { userId: session.user.id, plan },
    }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    console.error("Bachs checkout error:", JSON.stringify(data))
    return NextResponse.json({ error: data.detail || data.message || "Failed to create checkout" }, { status: 502 })
  }

  if (!data.checkout_url) {
    console.error("Bachs returned no checkout_url:", JSON.stringify(data))
    return NextResponse.json({ error: "No checkout URL returned" }, { status: 502 })
  }

  return NextResponse.json({ url: data.checkout_url })
}
