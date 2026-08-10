import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 })

  const allRepos: unknown[] = []
  let page = 1

  // Paginate until we have all repos (private + public, both owned and member of)
  while (true) {
    const res = await fetch(
      `https://api.github.com/user/repos?per_page=100&page=${page}&sort=pushed&affiliation=owner,collaborator,organization_member&visibility=all`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
    )
    if (!res.ok) break
    const batch = await res.json()
    if (!Array.isArray(batch) || batch.length === 0) break
    allRepos.push(...batch)
    if (batch.length < 100) break
    page++
  }

  const repos = allRepos.map((r: unknown) => {
    const repo = r as Record<string, unknown>
    return {
      owner: (repo.owner as Record<string, unknown>)?.login,
      name: repo.name,
      fullName: repo.full_name,
      defaultBranch: repo.default_branch,
      private: repo.private,
    }
  })

  return NextResponse.json(repos)
}
