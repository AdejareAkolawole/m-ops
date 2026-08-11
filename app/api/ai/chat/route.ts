import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasAI } from "@/lib/plans"
import { askAI, Message } from "@/lib/ai-router"
import { buildProjectContext, buildSystemPrompt, ProjectContext } from "@/lib/context-engine"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  })
  if (!user || !hasAI(user.plan)) {
    return NextResponse.json(
      { error: "plan_required", message: "AI debugging requires a Pro or Team plan. Upgrade in Settings → Billing." },
      { status: 403 }
    )
  }

  const { messages, context } = await req.json() as {
    messages: Message[]
    context?: ProjectContext
  }

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 })
  }

  const contextBlock = context
    ? await buildProjectContext(context)
    : "No project context provided — answering as a general developer assistant."

  const systemPrompt = buildSystemPrompt(contextBlock)

  try {
    const response = await askAI(messages, systemPrompt)
    return NextResponse.json(response)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI request failed"
    return NextResponse.json({ error: msg }, { status: 503 })
  }
}
