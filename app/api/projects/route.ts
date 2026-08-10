import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, url, type, provider, externalId, metadata } = await req.json()
  if (!name || !url) return NextResponse.json({ error: "name and url required" }, { status: 400 })
  const project = await prisma.project.create({
    data: { userId: session.user.id, name, url, type: type || "manual", provider, externalId, metadata },
  })
  return NextResponse.json(project)
}
