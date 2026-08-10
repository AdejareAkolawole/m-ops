import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, email } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })
  if (!email?.trim()) return NextResponse.json({ error: "Email is required" }, { status: 400 })

  // Check if email taken by another user
  if (email !== session.user.email) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 })
  }

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: { name: name.trim(), email: email.trim() },
  })

  return NextResponse.json({ id: user.id, name: user.name, email: user.email })
}
