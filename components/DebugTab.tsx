"use client"
import { useState, useRef, useEffect } from "react"
import { VercelSyncedProject, CheckResult } from "@/lib/types"
import { getGitHubAccount, getChecks } from "@/lib/store"
import { Message } from "@/lib/ai-router"

interface ChatMessage extends Message {
  id: string
  provider?: string
  loading?: boolean
  error?: boolean
}

interface Props {
  project: VercelSyncedProject
  lastCheck: CheckResult | null
}

const QUICK_ACTIONS = [
  { label: "What's wrong?", prompt: "Something seems wrong with this project. Diagnose the issue based on the monitoring data and codebase." },
  { label: "Why is it slow?", prompt: "The service is responding slowly. What in the codebase or config could be causing performance issues?" },
  { label: "Explain this project", prompt: "Give me a clear explanation of what this project does, its architecture, and how the main parts connect." },
  { label: "Security check", prompt: "Look for security issues in this codebase — exposed secrets, unprotected routes, missing validation, anything critical." },
]

export function DebugTab({ project, lastCheck }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const gh = getGitHubAccount()
  const history = getChecks(project.id)
  const isDown = lastCheck?.status === "offline"
  const isDegraded = lastCheck?.status === "degraded"

  // Auto-diagnose when arriving from an incident
  const [autoDiagnosed, setAutoDiagnosed] = useState(false)
  useEffect(() => {
    if ((isDown || isDegraded) && !autoDiagnosed && messages.length === 0) {
      setAutoDiagnosed(true)
      const statusMsg = isDown ? "offline/unreachable" : "degraded/slow"
      send(`The service is currently ${statusMsg}. HTTP status: ${lastCheck?.http?.statusCode ?? "no response"}. Response time: ${lastCheck?.responseMs ?? "n/a"}ms. Diagnose what's wrong and suggest fixes.`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function buildContext() {
    const recentErrors = history
      .filter(c => c.status !== "online")
      .slice(0, 5)
      .map(c => ({
        timestamp: c.timestamp,
        message: c.error ?? c.http?.error ?? `HTTP ${c.http?.statusCode}`,
        status: c.http?.statusCode,
      }))

    return {
      repoInfo: gh ? { owner: gh.login, repo: project.name, token: gh.token } : undefined,
      deployInfo: {
        provider: "vercel",
        projectName: project.name,
        productionUrl: project.productionUrl ?? undefined,
        lastDeployState: project.latestDeployment?.state,
        lastDeployMessage: project.latestDeployment?.meta?.githubCommitMessage,
      },
      recentErrors: recentErrors.length > 0 ? recentErrors : undefined,
      customNotes: lastCheck ? `Current status: ${lastCheck.status}. Last checked: ${lastCheck.timestamp}. Response time: ${lastCheck.responseMs ?? "n/a"}ms. HTTP: ${lastCheck.http?.statusCode ?? "n/a"}.` : undefined,
    }
  }

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
        role: m.role, content: m.content,
      }))

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, context: buildContext() }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Request failed")

      setMessages(prev => prev.map(m =>
        m.loading ? { ...m, content: data.content, loading: false, provider: data.provider } : m
      ))
    } catch (e) {
      setMessages(prev => prev.map(m =>
        m.loading ? { ...m, content: e instanceof Error ? e.message : "Failed", loading: false, error: true } : m
      ))
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
  }

  const empty = messages.length === 0

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#080808" }}>

      {/* Status banner if something is wrong */}
      {(isDown || isDegraded) && (
        <div style={{
          padding: "10px 24px", background: isDown ? "#f8717110" : "#fb923c10",
          borderBottom: `1px solid ${isDown ? "#f8717130" : "#fb923c30"}`,
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isDown ? "#f87171" : "#fb923c", animation: "status-pulse 1s ease-in-out infinite" }} />
          <span style={{ fontSize: "12.5px", color: isDown ? "#f87171" : "#fb923c", fontWeight: 600 }}>
            {isDown ? "Service is down" : "Service is degraded"} · {lastCheck?.responseMs ? `${lastCheck.responseMs}ms` : "no response"}
          </span>
          {!autoDiagnosed && (
            <button
              onClick={() => send("Diagnose what's wrong with this service right now.")}
              style={{ marginLeft: "auto", fontSize: "11.5px", fontWeight: 600, color: "#fff", background: isDown ? "#f87171" : "#fb923c", border: "none", borderRadius: "6px", padding: "4px 12px", cursor: "pointer" }}
            >
              Diagnose now
            </button>
          )}
        </div>
      )}

      {/* Context badge */}
      <div style={{ padding: "10px 24px", borderBottom: "1px solid #0f0f0f", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "11px", color: "#2a2a2a" }}>Context:</span>
        <span style={{ fontSize: "11px", color: "#333", background: "#111", border: "1px solid #1a1a1a", borderRadius: "4px", padding: "2px 8px" }}>
          {project.name}
        </span>
        {gh ? (
          <span style={{ fontSize: "11px", color: "#333", background: "#111", border: "1px solid #1a1a1a", borderRadius: "4px", padding: "2px 8px" }}>
            {gh.login}/{project.name} on GitHub
          </span>
        ) : (
          <span style={{ fontSize: "11px", color: "#2a2a2a" }}>Connect GitHub for code-aware answers</span>
        )}
        {history.length > 0 && (
          <span style={{ fontSize: "11px", color: "#333", background: "#111", border: "1px solid #1a1a1a", borderRadius: "4px", padding: "2px 8px" }}>
            {history.length} checks in history
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
        {empty ? (
          <div style={{ padding: "32px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <p style={{ color: "#333", fontSize: "12.5px", margin: 0 }}>Ask anything about <strong style={{ color: "#555" }}>{project.name}</strong> — the AI has full context of the codebase, deploy history, and monitoring data.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {QUICK_ACTIONS.map(a => (
                <button key={a.label} onClick={() => send(a.prompt)}
                  style={{ padding: "7px 14px", borderRadius: "8px", fontSize: "12px", background: "#0f0f0f", border: "1px solid #1a1a1a", color: "#555", cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#888" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.color = "#555" }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ padding: "16px 24px", borderBottom: "1px solid #0f0f0f" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{
                    fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                    color: msg.role === "user" ? "#60a5fa" : msg.error ? "#f87171" : "#4ade80",
                  }}>
                    {msg.role === "user" ? "You" : msg.error ? "Error" : "AI"}
                  </span>
                  {msg.provider && (
                    <span style={{ fontSize: "10px", color: "#222", background: "#111", border: "1px solid #181818", borderRadius: "4px", padding: "1px 6px" }}>
                      {msg.provider}
                    </span>
                  )}
                </div>
                {msg.loading ? (
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#2a2a2a", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
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
      <div style={{ padding: "14px 24px 18px", borderTop: "1px solid #0f0f0f" }}>
        <div style={{ position: "relative" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${project.name}...`}
            rows={1}
            disabled={loading}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: "10px",
              padding: "10px 44px 10px 14px", fontSize: "13px", color: "#e8e8e8",
              resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "#2a2a2a" }}
            onBlur={e => { e.currentTarget.style.borderColor = "#1a1a1a" }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            style={{
              position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
              width: "26px", height: "26px", borderRadius: "6px", border: "none",
              background: input.trim() && !loading ? "#60a5fa" : "#161616",
              color: input.trim() && !loading ? "#000" : "#2a2a2a",
              cursor: input.trim() && !loading ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px",
              transition: "background 0.15s",
            }}
          >↑</button>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  )
}

function MessageContent({ content, error }: { content: string; error?: boolean }) {
  if (error) return <p style={{ color: "#f87171", fontSize: "13px", margin: 0, lineHeight: 1.6 }}>{content}</p>

  const parts = content.split(/(```[\s\S]*?```)/g)
  return (
    <div style={{ fontSize: "13px", color: "#aaa", lineHeight: 1.7 }}>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const lines = part.slice(3).split("\n")
          const lang = lines[0].trim()
          const code = lines.slice(1).join("\n").replace(/```$/, "").trim()
          return (
            <div key={i} style={{ margin: "10px 0", borderRadius: "8px", overflow: "hidden", border: "1px solid #1a1a1a" }}>
              {lang && <div style={{ background: "#111", padding: "5px 12px", fontSize: "10px", color: "#333", borderBottom: "1px solid #161616" }}>{lang}</div>}
              <pre style={{ margin: 0, padding: "12px", background: "#0a0a0a", overflowX: "auto", fontSize: "12px", color: "#e8e8e8", fontFamily: "monospace", lineHeight: 1.6 }}>
                <code>{code}</code>
              </pre>
            </div>
          )
        }
        return (
          <span key={i}>
            {part.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((chunk, j) => {
              if (chunk.startsWith("`") && chunk.endsWith("`"))
                return <code key={j} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "4px", padding: "1px 5px", fontSize: "11.5px", color: "#e8e8e8", fontFamily: "monospace" }}>{chunk.slice(1, -1)}</code>
              if (chunk.startsWith("**") && chunk.endsWith("**"))
                return <strong key={j} style={{ color: "#ddd", fontWeight: 600 }}>{chunk.slice(2, -2)}</strong>
              return <span key={j}>{chunk}</span>
            })}
          </span>
        )
      })}
    </div>
  )
}
