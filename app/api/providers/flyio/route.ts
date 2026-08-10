import { NextRequest, NextResponse } from "next/server"

const FLY_GQL = "https://api.fly.io/graphql"

const query = `
  query { apps { nodes { id name hostname status organization { slug } } } }
`

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 })

  const res = await fetch(FLY_GQL, {
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
  const apps = json.data?.apps?.nodes?.map((a: any) => ({
    id: a.id,
    provider: "flyio",
    name: a.name,
    url: a.hostname ? `https://${a.hostname}` : null,
    status: a.status,
    createdAt: null,
    updatedAt: null,
  })) ?? []

  return NextResponse.json(apps)
}
