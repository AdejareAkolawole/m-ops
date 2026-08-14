import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const project = await prisma.project.findFirst({ where: { id, userId: session.user.id }, include: { statusPage: true } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(project.statusPage)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { title } = await req.json()

  const project = await prisma.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + id.slice(-4)

  const page = await prisma.statusPage.upsert({
    where: { projectId: id },
    create: { projectId: id, slug, title: title || `${project.name} Status` },
    update: { title: title || `${project.name} Status` },
  })

  return NextResponse.json(page)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const project = await prisma.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.statusPage.deleteMany({ where: { projectId: id } })
  return NextResponse.json({ ok: true })
}
