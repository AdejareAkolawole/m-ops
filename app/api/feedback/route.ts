import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendFeedbackAlert } from "@/lib/email"

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

  sendFeedbackAlert(type, title, description || null, session?.user?.email ?? null).catch(() => {})

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
