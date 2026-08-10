import { NextRequest, NextResponse } from "next/server"
import { askAI, Message } from "@/lib/ai-router"
import { buildProjectContext, buildSystemPrompt, ProjectContext } from "@/lib/context-engine"

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json() as {
    messages: Message[]
    context?: ProjectContext
  }

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 })
  }

  // Build project context string for the system prompt
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
