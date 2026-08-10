import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/admin"

export async function GET() {
  const session = await auth()
  if (!session?.user?.email || !isAdmin(session.user.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const [totalUsers, totalSessions, totalAccounts, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.session.count(),
    prisma.account.count(),
    prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
  ])

  return NextResponse.json({ totalUsers, totalSessions, totalAccounts, recentUsers })
}
