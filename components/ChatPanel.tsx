"use client"
import { useState, useRef, useEffect } from "react"
import { ProjectContext } from "@/lib/context-engine"
import { Message } from "@/lib/ai-router"

interface ChatMessage extends Message {
  id: string
  provider?: string
  loading?: boolean
  error?: boolean
}

interface Props {
  context?: ProjectContext
  placeholder?: string
}

const SUGGESTIONS = [
  "What's wrong with this project?",
  "Walk me through the codebase",
  "What could cause a deployment failure?",
  "Are there any security issues?",
  "Explain what this project does",
]

export function ChatPanel({ context, placeholder = "Ask anything about your project..." }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return
    setInput("")

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content }
    const loadingMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: "", loading: true }

    setMessages(prev => [...prev, userMsg, loadingMsg])
    setLoading(true)

    try {
      const history: Message[] = [...messages.filter(m => !m.loading), userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, context }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Request failed")

      setMessages(prev => prev.map(m =>
        m.loading ? { ...m, content: data.content, loading: false, provider: data.provider } : m
      ))
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong"
      setMessages(prev => prev.map(m =>
        m.loading ? { ...m, content: msg, loading: false, error: true } : m
      ))
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const empty = messages.length === 0

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#080808" }}>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 0" }}>
        {empty ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "32px", padding: "0 24px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>⚡</div>
              <p style={{ color: "#fff", fontSize: "16px", fontWeight: 600, margin: 0 }}>Ask anything about your project</p>
              <p style={{ color: "#444", fontSize: "13px", margin: "6px 0 0" }}>
                {context?.repoInfo ? `Connected to ${context.repoInfo.owner}/${context.repoInfo.repo}` : "No project context — connect GitHub for smarter answers"}
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", maxWidth: "480px" }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  style={{ padding: "7px 14px", borderRadius: "99px", fontSize: "12px", background: "#111", border: "1px solid #1e1e1e", color: "#666", cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#aaa" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e1e"; e.currentTarget.style.color = "#666" }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0px", maxWidth: "760px", margin: "0 auto", padding: "0 24px" }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "14px 0", borderBottom: "1px solid #111" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{
                    fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                    color: msg.role === "user" ? "#60a5fa" : msg.error ? "#f87171" : "#4ade80",
                  }}>
                    {msg.role === "user" ? "You" : msg.error ? "Error" : "AI"}
                  </span>
                  {msg.provider && (
                    <span style={{ fontSize: "10px", color: "#2a2a2a", background: "#111", border: "1px solid #1a1a1a", borderRadius: "4px", padding: "1px 6px" }}>
                      via {msg.provider}
                    </span>
                  )}
                </div>
                {msg.loading ? (
                  <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "4px 0" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: "6px", height: "6px", borderRadius: "50%", background: "#333",
                        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                ) : (
                  <MessageContent content={msg.content} error={msg.error} />
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: "16px 24px 20px", borderTop: "1px solid #111", background: "#080808" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", position: "relative" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={loading}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: "12px",
              padding: "12px 48px 12px 16px", fontSize: "13.5px", color: "#e8e8e8",
              resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5,
              transition: "border-color 0.15s",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "#333" }}
            onBlur={e => { e.currentTarget.style.borderColor = "#1e1e1e" }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
              width: "28px", height: "28px", borderRadius: "7px", border: "none",
              background: input.trim() && !loading ? "#60a5fa" : "#181818",
              color: input.trim() && !loading ? "#000" : "#333",
              cursor: input.trim() && !loading ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s, color 0.15s", fontSize: "14px",
            }}
          >
            ↑
          </button>
        </div>
        <p style={{ color: "#222", fontSize: "11px", textAlign: "center", margin: "8px 0 0" }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

// Renders markdown-ish content: code blocks, inline code, bold
function MessageContent({ content, error }: { content: string; error?: boolean }) {
  if (error) {
    return <p style={{ color: "#f87171", fontSize: "13.5px", margin: 0, lineHeight: 1.6 }}>{content}</p>
  }

  const parts = content.split(/(```[\s\S]*?```)/g)

  return (
    <div style={{ fontSize: "13.5px", color: "#c8c8c8", lineHeight: 1.7, margin: 0 }}>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const lines = part.slice(3).split("\n")
          const lang = lines[0].trim()
          const code = lines.slice(1).join("\n").replace(/```$/, "").trim()
          return (
            <div key={i} style={{ margin: "10px 0", borderRadius: "10px", overflow: "hidden", border: "1px solid #1e1e1e" }}>
              {lang && (
                <div style={{ background: "#111", padding: "6px 14px", fontSize: "11px", color: "#444", borderBottom: "1px solid #1a1a1a" }}>
                  {lang}
                </div>
              )}
              <pre style={{ margin: 0, padding: "14px", background: "#0a0a0a", overflowX: "auto", fontSize: "12.5px", color: "#e8e8e8", fontFamily: "monospace", lineHeight: 1.6 }}>
                <code>{code}</code>
              </pre>
            </div>
          )
        }
        // Render inline code and bold within plain text
        return (
          <span key={i}>
            {part.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((chunk, j) => {
              if (chunk.startsWith("`") && chunk.endsWith("`")) {
                return <code key={j} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "4px", padding: "1px 6px", fontSize: "12px", color: "#e8e8e8", fontFamily: "monospace" }}>{chunk.slice(1, -1)}</code>
              }
              if (chunk.startsWith("**") && chunk.endsWith("**")) {
                return <strong key={j} style={{ color: "#fff", fontWeight: 600 }}>{chunk.slice(2, -2)}</strong>
              }
              return <span key={j}>{chunk}</span>
            })}
          </span>
        )
      })}
    </div>
  )
}
