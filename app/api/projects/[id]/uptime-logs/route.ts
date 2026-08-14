import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const days = Math.min(parseInt(searchParams.get("days") || "7"), 90)

  const project = await prisma.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const since = new Date(Date.now() - days * 86_400_000)
  const logs = await prisma.uptimeLog.findMany({
    where: { projectId: id, checkedAt: { gte: since } },
    orderBy: { checkedAt: "asc" },
    select: { ok: true, responseMs: true, checkedAt: true, region: true },
  })

  const total = logs.length
  const uptime = total ? (logs.filter(l => l.ok).length / total) * 100 : 100
  const responseTimes = logs.filter(l => l.responseMs != null).map(l => l.responseMs!)
  const avgMs = responseTimes.length ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : null
  const p99 = responseTimes.length ? responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.99)] : null

  return NextResponse.json({ logs, uptime, avgMs, p99, total })
}
