import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (session?.user?.email !== "adejare.akolawole@gmail.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const items = await prisma.feedback.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const { type, title, description } = await req.json()
  if (!title || !type) return NextResponse.json({ error: "title and type required" }, { status: 400 })

  const item = await prisma.feedback.create({
    data: {
      userId: session?.user?.id ?? null,
      name: session?.user?.name ?? null,
      email: session?.user?.email ?? null,
      type,
      title,
      description: description || null,
    },
  })

  // Email notification (non-blocking)
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    const from = session?.user?.email ?? "anonymous"
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: "m-ops feedback <alerts@m-ops.pro>",
        to: ["adejare.akolawole@gmail.com"],
        reply_to: session?.user?.email ?? undefined,
        subject: `[m-ops ${type}] ${title}`,
        html: `<div style="font-family:sans-serif;max-width:500px">
          <h2>New ${type} report</h2>
          <p><strong>From:</strong> ${from}</p>
          <p><strong>Title:</strong> ${title}</p>
          ${description ? `<p><strong>Details:</strong></p><p style="color:#555">${description}</p>` : ""}
          <p style="color:#aaa;font-size:12px">View all feedback at m-ops.pro/admin</p>
        </div>`,
      }),
    }).catch(() => {})
  }

  return NextResponse.json(item)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (session?.user?.email !== "adejare.akolawole@gmail.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id, status } = await req.json()
  const item = await prisma.feedback.update({ where: { id }, data: { status } })
  return NextResponse.json(item)
}
