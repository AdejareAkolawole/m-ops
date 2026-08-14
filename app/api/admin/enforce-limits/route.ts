import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendProjectsRemovedEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const FREE_LIMIT = 3

  const freeUsers = await prisma.user.findMany({
    where: { plan: "free" },
    include: {
      projects: { orderBy: { createdAt: "asc" } },
    },
  })

  const results: { userId: string; email: string; kept: number; removed: number }[] = []

  for (const user of freeUsers) {
    if (user.projects.length <= FREE_LIMIT) continue

    const toKeep = user.projects.slice(0, FREE_LIMIT)
    const toRemove = user.projects.slice(FREE_LIMIT)
    const toRemoveIds = toRemove.map(p => p.id)

    await prisma.project.deleteMany({ where: { id: { in: toRemoveIds } } })

    if (user.email) {
      await sendProjectsRemovedEmail(
        user.email,
        user.name ?? "there",
        toKeep.map(p => p.name),
        toRemove.map(p => p.name),
      ).catch(() => {})
    }

    results.push({ userId: user.id, email: user.email!, kept: toKeep.length, removed: toRemove.length })
  }

  return NextResponse.json({ ok: true, affected: results.length, results })
}
