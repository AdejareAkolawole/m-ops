// Multi-provider AI router: Groq → Gemini → OpenRouter
// One function, automatic fallback, caller never thinks about providers

export interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

export interface AIResponse {
  content: string
  provider: string
  model: string
}

// ── Groq ─────────────────────────────────────────────────────────────────────

async function tryGroq(messages: Message[], systemPrompt: string): Promise<AIResponse> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error("no key")

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      max_tokens: 2048,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq ${res.status}: ${err}`)
  }

  const data = await res.json()
  return {
    content: data.choices[0].message.content.trim(),
    provider: "groq",
    model: "llama-3.1-8b-instant",
  }
}

// ── Gemini ────────────────────────────────────────────────────────────────────

async function tryGemini(messages: Message[], systemPrompt: string): Promise<AIResponse> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error("no key")

  // Convert messages to Gemini format
  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 2048, temperature: 0.3 },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini ${res.status}: ${err}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("Gemini: empty response")

  return { content: text.trim(), provider: "gemini", model: "gemini-1.5-flash" }
}

// ── OpenRouter ────────────────────────────────────────────────────────────────

async function tryOpenRouter(messages: Message[], systemPrompt: string): Promise<AIResponse> {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw new Error("no key")

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": "https://m-ops.pro",
      "X-Title": "m-ops",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.1-8b-instruct:free",
      max_tokens: 2048,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter ${res.status}: ${err}`)
  }

  const data = await res.json()
  return {
    content: data.choices[0].message.content.trim(),
    provider: "openrouter",
    model: "llama-3.1-8b-instruct",
  }
}

// ── Router ────────────────────────────────────────────────────────────────────

export async function askAI(messages: Message[], systemPrompt: string): Promise<AIResponse> {
  const providers = [
    { name: "groq", fn: () => tryGroq(messages, systemPrompt) },
    { name: "gemini", fn: () => tryGemini(messages, systemPrompt) },
    { name: "openrouter", fn: () => tryOpenRouter(messages, systemPrompt) },
  ]

  let lastError = ""
  for (const provider of providers) {
    try {
      return await provider.fn()
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e)
      console.warn(`[ai-router] ${provider.name} failed:`, lastError)
      continue
    }
  }

  throw new Error(`All AI providers failed. Last error: ${lastError}`)
}
