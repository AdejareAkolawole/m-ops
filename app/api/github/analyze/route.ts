import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"


const IMPORTANT_FILES = [
  "package.json", ".env.example", ".env.local.example",
  "next.config.js", "next.config.ts", "next.config.mjs",
  "src/lib/db.ts", "lib/db.ts",
  "src/middleware.ts", "middleware.ts",
  "prisma/schema.prisma",
]

async function fetchFile(token: string, owner: string, repo: string, path: string): Promise<string | null> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  })
  if (!res.ok) return null
  const data = await res.json()
  if (data.encoding === "base64" && data.content) {
    return Buffer.from(data.content, "base64").toString("utf-8").slice(0, 800)
  }
  return null
}

async function getRepoTree(token: string, owner: string, repo: string, branch: string): Promise<string[]> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  })
  if (!res.ok) return []
  const data = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.tree || []).filter((f: any) => f.type === "blob").map((f: any) => f.path as string)
}

export async function POST(req: NextRequest) {
  const { token, owner, repo, branch = "main" } = await req.json()
  if (!token || !owner || !repo) return NextResponse.json({ error: "token, owner, repo required" }, { status: 400 })

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY is not set. Add it to .env.local and restart the server." }, { status: 500 })
  }
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

  // Fetch repo file tree
  const allFiles = await getRepoTree(token, owner, repo, branch)

  // Determine which important files actually exist in this repo
  const toFetch = IMPORTANT_FILES.filter(f => allFiles.includes(f))

  // Also grab first few route/API files for deeper analysis
  const apiFiles = allFiles
    .filter(f => (f.includes("/api/") || f.includes("route.ts") || f.includes("route.js")) && !f.includes("node_modules"))
    .slice(0, 2)

  const srcFiles = allFiles
    .filter(f => (f.endsWith(".ts") || f.endsWith(".tsx") || f.endsWith(".js")) && !f.includes("node_modules") && !toFetch.includes(f) && !apiFiles.includes(f))
    .slice(0, 1)

  // Cap total files to keep well under token limits
  const filesToRead = [...new Set([...toFetch, ...apiFiles, ...srcFiles])].slice(0, 6)

  // Fetch file contents
  const fileContents: Record<string, string> = {}
  await Promise.all(
    filesToRead.map(async f => {
      const content = await fetchFile(token, owner, repo, f)
      if (content) fileContents[f] = content
    })
  )

  if (Object.keys(fileContents).length === 0) {
    return NextResponse.json({ error: "Could not read any files from this repo" }, { status: 400 })
  }

  const filesBlock = Object.entries(fileContents)
    .map(([path, content]) => `\`\`\`\n// FILE: ${path}\n${content}\n\`\`\``)
    .join("\n\n")

  const prompt = `Audit this repo (${owner}/${repo}) for real issues. Return ONLY a JSON array, no markdown.

Each item: {"id":"kebab-id","title":"max 60 chars","explanation":"what's wrong and why it matters","severity":"critical|high|medium|low|info","category":"security|performance|config|dependency|code-quality","file":"path","line":null,"fixDescription":"what the fix does","fixDiff":"unified diff or null","fixable":true}

Focus on: hardcoded secrets, unprotected routes, missing auth, outdated vulnerable deps, missing env vars, unhandled errors. Only report real issues present in the code. Return [] if clean.

FILES:
${filesBlock}`

  let message
  try {
    message = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Groq API error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const raw = message.choices[0]?.message?.content?.trim() ?? "[]"

  let issues
  try {
    // Strip any accidental markdown fences
    const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim()
    issues = JSON.parse(cleaned)
    if (!Array.isArray(issues)) issues = []
  } catch {
    issues = []
  }

  // Attach stable IDs
  issues = issues.map((issue: object, i: number) => ({
    id: `issue-${Date.now()}-${i}`,
    ...issue,
  }))

  const summary = issues.length === 0
    ? "No issues detected — this codebase looks clean."
    : `Found ${issues.length} issue${issues.length > 1 ? "s" : ""}: ${issues.filter((i: { severity: string }) => i.severity === "critical" || i.severity === "high").length} high-severity, ${issues.filter((i: { fixable: boolean }) => i.fixable).length} auto-fixable.`

  return NextResponse.json({
    issues,
    summary,
    analyzedAt: new Date().toISOString(),
    filesScanned: Object.keys(fileContents).length,
  })
}
