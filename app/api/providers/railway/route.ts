import { NextRequest, NextResponse } from "next/server"

const RAILWAY_GQL = "https://backboard.railway.app/graphql/v2"

const query = `
  query { projects { edges { node { id name services { edges { node { id name } } }
    environments { edges { node { id name } } } } } } }
`

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 })

  const res = await fetch(RAILWAY_GQL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: text || "Invalid token or API error" }, { status: res.status })
  }
  const json = await res.json()
  if (json.errors) return NextResponse.json({ error: json.errors[0]?.message || "GraphQL error" }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects = json.data?.projects?.edges?.map((e: any) => {
    const p = e.node
    return {
      id: p.id,
      provider: "railway",
      name: p.name,
      url: `https://${p.name}.up.railway.app`,
      status: null,
      createdAt: null,
      updatedAt: null,
    }
  }) ?? []

  return NextResponse.json(projects)
}
