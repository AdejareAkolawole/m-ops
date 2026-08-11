"use client"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  Loading03Icon, AlertCircleIcon, CheckmarkCircle02Icon,
  LinkSquare02Icon, Cancel01Icon, ArrowReloadHorizontalIcon,
  GitBranchIcon, SourceCodeSquareIcon, AiSecurity01Icon,
  CloudAngledZapIcon, Settings01Icon, Package01Icon,
} from "hugeicons-react"
import { GitHubAccount, GitHubRepo, DetectedIssue, AnalysisResult, IssueSeverity } from "@/lib/types"
import { getGitHubAccount, saveGitHubAccount, getProjectRepo, saveProjectRepo, getAnalysis, saveAnalysis, markIssueFixed } from "@/lib/store"
import { ConnectGitHub } from "./ConnectGitHub"

const GitHubMark = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 98 96" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
  </svg>
)

const SEVERITY_COLOR: Record<IssueSeverity, string> = {
  critical: "#ff4444", high: "#f87171", medium: "#fb923c", low: "#facc15", info: "#60a5fa",
}
const SEVERITY_BG: Record<IssueSeverity, string> = {
  critical: "#ff444415", high: "#f8717115", medium: "#fb923c15", low: "#facc1515", info: "#60a5fa15",
}
const CATEGORY_ICON: Record<string, React.ReactNode> = {
  security: <AiSecurity01Icon size={13} />,
  performance: <CloudAngledZapIcon size={13} />,
  config: <Settings01Icon size={13} />,
  dependency: <Package01Icon size={13} />,
  "code-quality": <SourceCodeSquareIcon size={13} />,
  accessibility: <AlertCircleIcon size={13} />,
}

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime()
  if (d < 60000) return "just now"
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`
  return `${Math.floor(d / 86400000)}d ago`
}

interface Props {
  projectId: string
  projectName: string
  onTabChange?: (tab: string) => void
}

export function InsightsTab({ projectId, projectName, onTabChange }: Props) {
  const [ghAccount, setGhAccount] = useState<GitHubAccount | null>(null)
  const [linkedRepo, setLinkedRepo] = useState<GitHubRepo | null>(null)
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [showConnect, setShowConnect] = useState(false)
  const [showRepoPicker, setShowRepoPicker] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [fixing, setFixing] = useState<string | null>(null)
  const [fixResults, setFixResults] = useState<Record<string, { prUrl: string } | { error: string }>>({})
  const [repoSearch, setRepoSearch] = useState("")
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const acc = getGitHubAccount()
    setGhAccount(acc)
    const repo = getProjectRepo(projectId)
    setLinkedRepo(repo)
    const cached = getAnalysis(projectId)
    setAnalysis(cached)
  }, [projectId])

  async function fetchRepos(account: GitHubAccount) {
    setLoadingRepos(true)
    const res = await fetch("/api/github/repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: account.token }),
    })
    if (res.ok) setRepos(await res.json())
    setLoadingRepos(false)
  }

  function handleConnected(account: GitHubAccount) {
    setGhAccount(account)
    setShowConnect(false)
    setShowRepoPicker(true)
    fetchRepos(account)
    onTabChange?.("insights")
  }

  function handleSelectRepo(repo: GitHubRepo) {
    saveProjectRepo(projectId, repo)
    setLinkedRepo(repo)
    setShowRepoPicker(false)
    runAnalysis(repo)
  }

  async function runAnalysis(repo: GitHubRepo) {
    if (!ghAccount) return
    setAnalyzing(true)
    setError("")
    try {
      const res = await fetch("/api/github/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: ghAccount.token,
          owner: repo.owner,
          repo: repo.name,
          branch: repo.defaultBranch,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.error === "plan_required"
          ? "Code Insights requires a Pro or Team plan. Upgrade in Settings → Billing."
          : (data.message || data.error || "Analysis failed")
        throw new Error(msg)
      }

      const result: AnalysisResult = {
        projectId,
        repoFullName: repo.fullName,
        analyzedAt: data.analyzedAt,
        issues: data.issues,
        summary: data.summary,
      }
      saveAnalysis(result)
      setAnalysis(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed")
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleFix(issue: DetectedIssue) {
    if (!ghAccount || !linkedRepo) return
    setFixing(issue.id)
    try {
      const res = await fetch("/api/github/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: ghAccount.token,
          owner: linkedRepo.owner,
          repo: linkedRepo.name,
          branch: linkedRepo.defaultBranch,
          issue,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Fix failed")
      setFixResults(prev => ({ ...prev, [issue.id]: { prUrl: data.prUrl } }))
      markIssueFixed(projectId, issue.id)
      setAnalysis(prev => prev ? {
        ...prev,
        issues: prev.issues.map(i => i.id === issue.id ? { ...i, fixed: true } : i),
      } : prev)
    } catch (e: unknown) {
      setFixResults(prev => ({ ...prev, [issue.id]: { error: e instanceof Error ? e.message : "Fix failed" } }))
    } finally {
      setFixing(null)
    }
  }

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!ghAccount) {
    return (
      <div className="animate-fade-in-up" style={{ padding: "40px 36px", maxWidth: "620px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
          <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em" }}>Code Insights</h2>
        </div>

        <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "16px", padding: "36px", textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#161616", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", color: "#e8e8e8" }}>
            <GitHubMark size={24} />
          </div>
          <p style={{ color: "#e8e8e8", fontSize: "15px", fontWeight: 600, marginBottom: "8px" }}>Connect your GitHub repo</p>
          <p style={{ color: "#404040", fontSize: "13px", lineHeight: 1.6, marginBottom: "24px", maxWidth: "340px", margin: "0 auto 24px" }}>
            Link the repository for <strong style={{ color: "#606060" }}>{projectName}</strong> and get AI-powered analysis of real issues in your code — with one-click auto-fixes that open PRs.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "300px", margin: "0 auto" }}>
            {["Security vulnerabilities & exposed secrets", "Performance bottlenecks & missing indexes", "Outdated or vulnerable dependencies", "Config issues & missing env vars"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#60a5fa", flexShrink: 0 }} />
                <span style={{ color: "#484848", fontSize: "12px", textAlign: "left" }}>{f}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowConnect(true)}
            style={{ marginTop: "28px", display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 22px", borderRadius: "10px", background: "#e8e8e8", color: "#000", fontSize: "13.5px", fontWeight: 600, border: "none", cursor: "pointer" }}
          >
            <GitHubMark size={14} /> Connect GitHub
          </button>
        </div>

        {showConnect && <ConnectGitHub onClose={() => setShowConnect(false)} onConnected={handleConnected} />}
      </div>
    )
  }

  // ── No repo linked yet ─────────────────────────────────────────────────────
  if (!linkedRepo) {
    return (
      <div className="animate-fade-in-up" style={{ padding: "40px 36px", maxWidth: "620px" }}>
        <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "24px" }}>Code Insights</h2>
        <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "16px", padding: "28px", textAlign: "center" }}>
          <p style={{ color: "#e8e8e8", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>Which repository is <strong>{projectName}</strong>?</p>
          <p style={{ color: "#404040", fontSize: "12px", marginBottom: "20px" }}>Select the GitHub repo so we can scan it for issues.</p>
          <button onClick={() => { setShowRepoPicker(true); fetchRepos(ghAccount) }}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "10px", background: "#e8e8e8", color: "#000", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}>
            <GitBranchIcon size={13} /> Pick a repository
          </button>
        </div>

        {showRepoPicker && <RepoPicker repos={repos} loading={loadingRepos} search={repoSearch} onSearch={setRepoSearch} onSelect={handleSelectRepo} onClose={() => setShowRepoPicker(false)} />}
      </div>
    )
  }

  // ── Analyzing ──────────────────────────────────────────────────────────────
  if (analyzing) {
    return (
      <div className="animate-fade-in-up" style={{ padding: "40px 36px", maxWidth: "620px" }}>
        <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "28px" }}>Code Insights</h2>
        <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "16px", padding: "48px", textAlign: "center" }}>
          <Loading03Icon size={28} style={{ color: "#60a5fa", margin: "0 auto 16px", animation: "spin 1s linear infinite", display: "block" }} />
          <p style={{ color: "#e8e8e8", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>Scanning {linkedRepo.fullName}</p>
          <p style={{ color: "#404040", fontSize: "12px" }}>Reading your code and looking for issues…</p>
        </div>
      </div>
    )
  }

  // ── Results ────────────────────────────────────────────────────────────────
  const open = analysis?.issues.filter(i => !i.fixed) ?? []
  const fixed = analysis?.issues.filter(i => i.fixed) ?? []
  const critHigh = open.filter(i => i.severity === "critical" || i.severity === "high")
  const fixable = open.filter(i => i.fixable)

  return (
    <div className="animate-fade-in-up" style={{ padding: "32px 36px", maxWidth: "800px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "4px" }}>Code Insights</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <GitHubMark size={11} />
            <span style={{ color: "#303030", fontSize: "11.5px" }}>{linkedRepo.fullName}</span>
            {analysis && <span style={{ color: "#242424", fontSize: "11px" }}>· Scanned {timeAgo(analysis.analyzedAt)}</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => { setShowRepoPicker(true); fetchRepos(ghAccount) }}
            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", background: "#141414", border: "1px solid #1e1e1e", color: "#484848", fontSize: "11.5px", cursor: "pointer" }}
          >
            <GitBranchIcon size={11} /> Switch repo
          </button>
          <button
            onClick={() => runAnalysis(linkedRepo)}
            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", background: "#141414", border: "1px solid #1e1e1e", color: "#60a5fa", fontSize: "11.5px", cursor: "pointer" }}
          >
            <ArrowReloadHorizontalIcon size={11} /> Re-scan
          </button>
        </div>
      </div>

      {error && <p style={{ color: "#f87171", fontSize: "12px" }}>{error}</p>}

      {/* Summary stat bar */}
      {analysis && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "#111", border: "1px solid #1a1a1a", borderRadius: "12px", overflow: "hidden" }}>
          {[
            { label: "Open issues", value: open.length.toString(), color: open.length > 0 ? "#f87171" : "#4ade80" },
            { label: "High severity", value: critHigh.length.toString(), color: critHigh.length > 0 ? "#f87171" : "#4ade80" },
            { label: "Auto-fixable", value: fixable.length.toString(), color: "#60a5fa" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "20px 24px", borderRight: i < 2 ? "1px solid #1a1a1a" : "none" }}>
              <p style={{ color: "#383838", fontSize: "11px", marginBottom: "10px" }}>{s.label}</p>
              <p className="animate-count-in" style={{ color: s.color, fontSize: "32px", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Summary text */}
      {analysis?.summary && (
        <p style={{ color: "#484848", fontSize: "13px", lineHeight: 1.6 }}>{analysis.summary}</p>
      )}

      {/* Issue list */}
      {open.length === 0 && !analyzing && analysis && (
        <div style={{ background: "#0d0d0d", border: "1px solid #141414", borderRadius: "14px", padding: "48px", textAlign: "center" }}>
          <CheckmarkCircle02Icon size={28} style={{ color: "#4ade80", margin: "0 auto 12px", display: "block" }} />
          <p style={{ color: "#e8e8e8", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>All clear</p>
          <p style={{ color: "#2a2a2a", fontSize: "12px" }}>No issues detected in your codebase.</p>
        </div>
      )}

      {open.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {open.map(issue => (
            <IssueCard
              key={issue.id}
              issue={issue}
              fixing={fixing === issue.id}
              fixResult={fixResults[issue.id]}
              onFix={() => handleFix(issue)}
            />
          ))}
        </div>
      )}

      {/* Fixed issues */}
      {fixed.length > 0 && (
        <div>
          <p style={{ color: "#242424", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>Fixed</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {fixed.map(issue => (
              <div key={issue.id} style={{ background: "#0a0a0a", border: "1px solid #111", borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", opacity: 0.6 }}>
                <CheckmarkCircle02Icon size={14} style={{ color: "#4ade80", flexShrink: 0 }} />
                <span style={{ color: "#383838", fontSize: "12.5px", flex: 1, textDecoration: "line-through" }}>{issue.title}</span>
                {fixResults[issue.id] && "prUrl" in fixResults[issue.id] && (
                  <a href={(fixResults[issue.id] as { prUrl: string }).prUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color: "#60a5fa", fontSize: "11px", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                    View PR <LinkSquare02Icon size={9} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showRepoPicker && <RepoPicker repos={repos} loading={loadingRepos} search={repoSearch} onSearch={setRepoSearch} onSelect={handleSelectRepo} onClose={() => setShowRepoPicker(false)} />}
    </div>
  )
}

function IssueCard({ issue, fixing, fixResult, onFix }: {
  issue: DetectedIssue
  fixing: boolean
  fixResult?: { prUrl: string } | { error: string }
  onFix: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const color = SEVERITY_COLOR[issue.severity]
  const bg = SEVERITY_BG[issue.severity]
  const prUrl = fixResult && "prUrl" in fixResult ? fixResult.prUrl : null
  const fixErr = fixResult && "error" in fixResult ? fixResult.error : null

  return (
    <div style={{ background: "#0d0d0d", border: `1px solid ${expanded ? color + "30" : "#141414"}`, borderRadius: "12px", overflow: "hidden", transition: "border-color 0.2s" }}>
      {/* Row */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: "12px", padding: "16px 18px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        {/* Severity dot */}
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0, marginTop: "5px" }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
            <span style={{ color: "#e8e8e8", fontSize: "13.5px", fontWeight: 600 }}>{issue.title}</span>
            <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", padding: "2px 7px", borderRadius: "99px", background: bg, color, border: `1px solid ${color}30`, textTransform: "uppercase" }}>
              {issue.severity}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em", padding: "2px 7px", borderRadius: "99px", background: "#161616", color: "#383838", textTransform: "uppercase" }}>
              {CATEGORY_ICON[issue.category]} {issue.category}
            </span>
          </div>
          <p style={{ color: "#606060", fontSize: "12px", fontFamily: "monospace" }}>
            {issue.file}{issue.line ? `:${issue.line}` : ""}
          </p>
        </div>

        {/* Fix badge */}
        {issue.fixable && !issue.fixed && (
          <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "99px", background: "#60a5fa15", color: "#60a5fa", border: "1px solid #60a5fa25", flexShrink: 0, letterSpacing: "0.04em" }}>
            Auto-fix
          </span>
        )}
        {issue.fixed && <CheckmarkCircle02Icon size={14} style={{ color: "#4ade80", flexShrink: 0 }} />}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: "1px solid #141414", padding: "18px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Explanation */}
          <div>
            <p style={{ color: "#484848", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>What's the problem</p>
            <p style={{ color: "#888", fontSize: "13px", lineHeight: 1.7 }}>{issue.explanation}</p>
          </div>

          {/* Fix description */}
          {issue.fixable && (
            <div style={{ background: "#60a5fa08", border: "1px solid #60a5fa15", borderRadius: "10px", padding: "14px 16px" }}>
              <p style={{ color: "#484848", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>What auto-fix will do</p>
              <p style={{ color: "#606060", fontSize: "12.5px", lineHeight: 1.6 }}>{issue.fixDescription}</p>
            </div>
          )}

          {/* Diff preview */}
          {issue.fixDiff && (
            <div style={{ background: "#080808", borderRadius: "10px", overflow: "hidden", border: "1px solid #141414" }}>
              <div style={{ padding: "8px 14px", borderBottom: "1px solid #0f0f0f", display: "flex", alignItems: "center", gap: "6px" }}>
                <SourceCodeSquareIcon size={11} style={{ color: "#303030" }} />
                <span style={{ color: "#303030", fontSize: "10px", fontFamily: "monospace" }}>proposed diff</span>
              </div>
              <pre style={{ margin: 0, padding: "12px 14px", fontSize: "11px", fontFamily: "monospace", lineHeight: 1.6, overflowX: "auto", color: "#484848", whiteSpace: "pre" }}>
                {issue.fixDiff.split("\n").map((line, i) => (
                  <span key={i} style={{ display: "block", color: line.startsWith("+") ? "#4ade80" : line.startsWith("-") ? "#f87171" : line.startsWith("@@") ? "#60a5fa" : "#484848" }}>
                    {line}
                  </span>
                ))}
              </pre>
            </div>
          )}

          {/* Fix result */}
          {prUrl && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 14px", background: "#4ade8008", border: "1px solid #4ade8020", borderRadius: "10px" }}>
              <CheckmarkCircle02Icon size={14} style={{ color: "#4ade80", flexShrink: 0 }} />
              <span style={{ color: "#4ade80", fontSize: "12.5px" }}>PR opened —</span>
              <a href={prUrl} target="_blank" rel="noopener noreferrer"
                style={{ color: "#60a5fa", fontSize: "12.5px", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                View on GitHub <LinkSquare02Icon size={10} />
              </a>
            </div>
          )}
          {fixErr && (
            <p style={{ color: "#f87171", fontSize: "12px" }}>Auto-fix failed: {fixErr}</p>
          )}

          {/* Fix button */}
          {issue.fixable && !issue.fixed && !prUrl && (
            <button
              onClick={e => { e.stopPropagation(); onFix() }}
              disabled={fixing}
              style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px", borderRadius: "9px", background: "#60a5fa", color: "#000", fontSize: "12.5px", fontWeight: 700, border: "none", cursor: fixing ? "not-allowed" : "pointer", opacity: fixing ? 0.7 : 1, transition: "opacity 0.15s" }}
            >
              {fixing
                ? <><Loading03Icon size={13} style={{ animation: "spin 1s linear infinite" }} /> Opening PR…</>
                : <><GitBranchIcon size={13} /> Auto-fix — open PR</>
              }
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function RepoPicker({ repos, loading, search, onSearch, onSelect, onClose }: {
  repos: GitHubRepo[]
  loading: boolean
  search: string
  onSearch: (s: string) => void
  onSelect: (r: GitHubRepo) => void
  onClose: () => void
}) {
  const filtered = repos.filter(r => r.fullName.toLowerCase().includes(search.toLowerCase()))

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", flexDirection: "column", background: "#080808" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px", borderBottom: "1px solid #141414", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <GitHubMark size={18} />
          <span style={{ color: "#e8e8e8", fontSize: "15px", fontWeight: 600 }}>Select a repository</span>
          {!loading && repos.length > 0 && (
            <span style={{ color: "#303030", fontSize: "12px" }}>{repos.length} repos</span>
          )}
        </div>
        <button onClick={onClose} style={{ color: "#484848", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
          <Cancel01Icon size={18} />
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: "16px 28px", borderBottom: "1px solid #111", flexShrink: 0 }}>
        <input
          autoFocus
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search by name…"
          style={{
            width: "100%", background: "#111", border: "1px solid #1e1e1e", borderRadius: "10px",
            padding: "11px 16px", color: "#e8e8e8", fontSize: "14px", outline: "none",
            boxSizing: "border-box", maxWidth: "560px",
          }}
        />
      </div>

      {/* Repo list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 28px 28px" }}>
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "16px" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ height: "60px", borderRadius: "10px", background: "#0f0f0f", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 0.07}s` }} />
            ))}
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ paddingTop: "80px", textAlign: "center", color: "#2a2a2a", fontSize: "14px" }}>
            No repos found
          </div>
        )}
        {!loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "10px", paddingTop: "16px" }}>
            {filtered.map(r => (
              <button
                key={r.fullName}
                onClick={() => onSelect(r)}
                style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "16px 18px", background: "#0d0d0d",
                  border: "1px solid #161616", borderRadius: "12px",
                  cursor: "pointer", textAlign: "left", transition: "border-color 0.15s, background 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#111"; e.currentTarget.style.borderColor = "#222" }}
                onMouseLeave={e => { e.currentTarget.style.background = "#0d0d0d"; e.currentTarget.style.borderColor = "#161616" }}
              >
                <div style={{ flexShrink: 0 }}><GitHubMark size={16} /></div>
                <div style={{ overflow: "hidden" }}>
                  <p style={{ color: "#e8e8e8", fontSize: "13.5px", fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.fullName}</p>
                  <p style={{ color: "#303030", fontSize: "11.5px", margin: "3px 0 0" }}>
                    {r.defaultBranch}
                    <span style={{ marginLeft: "8px", color: r.private ? "#2a3040" : "#1e3020", background: r.private ? "#1a1f2a" : "#162018", padding: "1px 7px", borderRadius: "99px", fontSize: "10px" }}>
                      {r.private ? "private" : "public"}
                    </span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
