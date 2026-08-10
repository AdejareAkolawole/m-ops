import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { name, url, type } = await req.json()
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project || project.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  const updated = await prisma.project.update({ where: { id }, data: { name, url, type } })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project || project.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.project.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
