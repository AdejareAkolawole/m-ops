import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendProjectDownAlert, sendProjectUpAlert } from "@/lib/email"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const projects = await prisma.project.findMany({
    include: {
      user: {
        select: { email: true, notifyEmail: true, notifyIncidents: true },
      },
    },
  })

  const results: { id: string; name: string; ok: boolean; ms?: number; error?: string }[] = []

  await Promise.allSettled(
    projects.map(async (project) => {
      const start = Date.now()
      let ok = false
      let error: string | undefined
      let responseMs: number | undefined

      try {
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 10000)
        const res = await fetch(project.url, {
          signal: ctrl.signal,
          headers: { "User-Agent": "m-ops-uptime/1.0" },
          redirect: "follow",
        })
        clearTimeout(t)
        responseMs = Date.now() - start
        ok = res.status < 500
        if (!ok) error = `HTTP ${res.status}`
      } catch (e) {
        responseMs = Date.now() - start
        ok = false
        error = e instanceof Error ? e.message : "unreachable"
      }

      results.push({ id: project.id, name: project.name, ok, ms: responseMs, error })

      // Read last status from DB metadata to survive cold starts
      const meta = (project.metadata as Record<string, unknown> | null) ?? {}
      const lastStatusOk: boolean | undefined = typeof meta.lastStatusOk === "boolean" ? meta.lastStatusOk : undefined

      const justWentDown = !ok && lastStatusOk !== false
      const justCameBack = ok && lastStatusOk === false

      // Persist new status back to metadata
      await prisma.project.update({
        where: { id: project.id },
        data: { metadata: { ...meta, lastStatusOk: ok } },
      })

      // Only alert on state transitions to avoid spam
      if (!project.user?.notifyEmail || !project.user?.notifyIncidents) return
      if (!project.user.email) return

      if (justWentDown && !ok) {
        await sendProjectDownAlert(project.user.email, project.name, project.url, error || null).catch(() => {})
      } else if (justCameBack) {
        await sendProjectUpAlert(project.user.email, project.name, project.url, responseMs ?? null).catch(() => {})
      }
    })
  )

  return NextResponse.json({ ok: true, checked: results.length, results })
}
