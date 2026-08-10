import { NextRequest, NextResponse } from "next/server"

async function getFileSha(token: string, owner: string, repo: string, path: string, branch: string): Promise<string | null> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.sha ?? null
}

function applyDiff(original: string, diff: string): string | null {
  try {
    const lines = original.split("\n")
    const diffLines = diff.split("\n")
    const result = [...lines]
    let offset = 0

    for (const dline of diffLines) {
      if (dline.startsWith("@@")) {
        const m = dline.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/)
        if (m) offset = parseInt(m[1]) - 1
      } else if (dline.startsWith("-") && !dline.startsWith("---")) {
        result.splice(offset, 1)
      } else if (dline.startsWith("+") && !dline.startsWith("+++")) {
        result.splice(offset, 0, dline.slice(1))
        offset++
      } else if (!dline.startsWith("\\")) {
        offset++
      }
    }
    return result.join("\n")
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { token, owner, repo, branch, issue } = await req.json()

  if (!token || !owner || !repo || !issue) {
    return NextResponse.json({ error: "token, owner, repo, issue required" }, { status: 400 })
  }

  if (!issue.fixable || !issue.fixDiff || !issue.file) {
    return NextResponse.json({ error: "This issue does not have an auto-fix" }, { status: 400 })
  }

  // 1 — fetch current file content + sha
  const contentRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${issue.file}?ref=${branch}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  })
  if (!contentRes.ok) return NextResponse.json({ error: "Could not fetch file from GitHub" }, { status: 400 })

  const fileData = await contentRes.json()
  const originalContent = Buffer.from(fileData.content, "base64").toString("utf-8")
  const sha = fileData.sha

  // 2 — apply the diff
  const patched = applyDiff(originalContent, issue.fixDiff)
  if (!patched) return NextResponse.json({ error: "Could not apply the fix diff" }, { status: 400 })

  // 3 — create a new branch for the fix
  const fixBranch = `project-hub/fix-${issue.id}-${Date.now()}`

  // Get base SHA for branch creation
  const baseRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  })
  if (!baseRes.ok) return NextResponse.json({ error: "Could not get base branch SHA" }, { status: 400 })
  const baseSha = (await baseRes.json()).object.sha

  // Create fix branch
  await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
    body: JSON.stringify({ ref: `refs/heads/${fixBranch}`, sha: baseSha }),
  })

  // 4 — commit the patched file to the fix branch
  const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${issue.file}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `fix: ${issue.title}\n\nApplied by Project Hub auto-fix\nIssue category: ${issue.category}`,
      content: Buffer.from(patched).toString("base64"),
      sha,
      branch: fixBranch,
    }),
  })
  if (!commitRes.ok) {
    const err = await commitRes.json()
    return NextResponse.json({ error: err.message || "Commit failed" }, { status: 400 })
  }

  // 5 — open a PR
  const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
    body: JSON.stringify({
      title: `fix: ${issue.title}`,
      body: `## Auto-fix by Project Hub\n\n**Issue:** ${issue.title}\n**Severity:** ${issue.severity}\n**Category:** ${issue.category}\n\n### What this fixes\n${issue.explanation}\n\n### Changes\n${issue.fixDescription}\n\n---\n*Applied automatically from [Project Hub](https://github.com/project-hub)*`,
      head: fixBranch,
      base: branch,
    }),
  })

  if (!prRes.ok) {
    const err = await prRes.json()
    return NextResponse.json({ error: err.message || "PR creation failed" }, { status: 400 })
  }

  const pr = await prRes.json()
  return NextResponse.json({ prUrl: pr.html_url, prNumber: pr.number, branch: fixBranch })
}
