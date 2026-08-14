import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const project = await prisma.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const incidents = await prisma.incident.findMany({
    where: { projectId: id },
    orderBy: { startedAt: "desc" },
    take: 50,
  })

  return NextResponse.json(incidents)
}
