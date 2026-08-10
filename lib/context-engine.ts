// Builds a project context snapshot for the AI to reason from.
// Called before every chat message — returns a compact string the AI reads as background.

interface RepoInfo {
  owner: string
  repo: string
  token: string
  branch?: string
}

interface DeployInfo {
  provider: string
  projectName: string
  lastDeployState?: string
  lastDeployMessage?: string
  productionUrl?: string
}

interface ErrorEntry {
  timestamp: string
  message: string
  status?: number
}

export interface ProjectContext {
  repoInfo?: RepoInfo
  deployInfo?: DeployInfo
  recentErrors?: ErrorEntry[]
  customNotes?: string
}

const KEY_FILES = [
  "package.json",
  "next.config.ts", "next.config.js", "next.config.mjs",
  "prisma/schema.prisma",
  "src/middleware.ts", "middleware.ts",
  "src/lib/db.ts", "lib/db.ts",
  ".env.example", ".env.local.example",
]

async function fetchFile(token: string, owner: string, repo: string, path: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.encoding === "base64" && data.content) {
      return Buffer.from(data.content, "base64").toString("utf-8").slice(0, 600)
    }
  } catch { /* ignore */ }
  return null
}

async function getRepoTree(token: string, owner: string, repo: string, branch = "main"): Promise<string[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
    )
    if (!res.ok) return []
    const data = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.tree || []).filter((f: any) => f.type === "blob").map((f: any) => f.path as string)
  } catch { return [] }
}

async function getRecentCommits(token: string, owner: string, repo: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
    )
    if (!res.ok) return ""
    const commits = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return commits.map((c: any) =>
      `- ${c.sha.slice(0, 7)} ${c.commit.message.split("\n")[0]} (${c.commit.author.name})`
    ).join("\n")
  } catch { return "" }
}

export async function buildProjectContext(ctx: ProjectContext): Promise<string> {
  const parts: string[] = []

  // ── Repo section ─────────────────────────────────────────────────────────────
  if (ctx.repoInfo) {
    const { owner, repo, token, branch = "main" } = ctx.repoInfo
    parts.push(`## Repository: ${owner}/${repo} (branch: ${branch})`)

    // File tree (just names, no content — gives AI structure awareness)
    const tree = await getRepoTree(token, owner, repo, branch)
    if (tree.length > 0) {
      const relevant = tree.filter(f =>
        !f.includes("node_modules") && !f.includes(".next") &&
        !f.includes("dist") && !f.endsWith(".lock")
      ).slice(0, 120)
      parts.push(`### File structure (${tree.length} total files)\n${relevant.join("\n")}`)
    }

    // Key file contents
    const toRead = KEY_FILES.filter(f => tree.includes(f)).slice(0, 5)
    const fileContents: string[] = []
    await Promise.all(toRead.map(async f => {
      const content = await fetchFile(token, owner, repo, f)
      if (content) fileContents.push(`### ${f}\n\`\`\`\n${content}\n\`\`\``)
    }))
    if (fileContents.length > 0) parts.push(fileContents.join("\n\n"))

    // Recent commits
    const commits = await getRecentCommits(token, owner, repo)
    if (commits) parts.push(`### Recent commits\n${commits}`)
  }

  // ── Deployment section ───────────────────────────────────────────────────────
  if (ctx.deployInfo) {
    const d = ctx.deployInfo
    parts.push(`## Deployment\nProvider: ${d.provider}\nProject: ${d.projectName}`)
    if (d.productionUrl) parts.push(`Production URL: ${d.productionUrl}`)
    if (d.lastDeployState) parts.push(`Last deploy: ${d.lastDeployState}${d.lastDeployMessage ? ` — "${d.lastDeployMessage}"` : ""}`)
  }

  // ── Recent errors ────────────────────────────────────────────────────────────
  if (ctx.recentErrors && ctx.recentErrors.length > 0) {
    const errLines = ctx.recentErrors.map(e =>
      `[${e.timestamp}] ${e.status ? `HTTP ${e.status} ` : ""}${e.message}`
    ).join("\n")
    parts.push(`## Recent errors\n${errLines}`)
  }

  // ── Custom notes ─────────────────────────────────────────────────────────────
  if (ctx.customNotes) parts.push(`## Additional context\n${ctx.customNotes}`)

  if (parts.length === 0) return "No project context available."
  return parts.join("\n\n")
}

export function buildSystemPrompt(contextBlock: string): string {
  return `You are an expert developer assistant embedded inside a project management platform called Project Hub.

You have full context of the user's project below. Use it to answer questions, diagnose issues, and suggest or write fixes.

When you identify a bug or issue:
1. State clearly what the problem is and why it's happening
2. Point to the exact file and line if possible
3. Show the fix as a code snippet
4. Keep explanations concise — developers want answers, not essays

When asked to fix something, respond with the fixed code in a code block with the file path as the first comment line.

${contextBlock}

---
Answer the developer's question using the context above. Be direct and specific.`
}
