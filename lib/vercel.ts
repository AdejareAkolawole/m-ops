export interface VercelProject {
  id: string
  name: string
  framework: string | null
  latestDeployments: VercelDeployment[]
  targets?: { production?: { alias?: string[] } }
  link?: { type: string; repo?: string }
  createdAt: number
  updatedAt: number
}

export interface VercelDeployment {
  uid: string
  url: string
  state: "READY" | "ERROR" | "BUILDING" | "INITIALIZING" | "QUEUED" | "CANCELED"
  readyState?: string
  createdAt: number
  meta?: { githubCommitMessage?: string; githubCommitRef?: string }
  target?: string
}

export interface VercelDomain {
  name: string
  configured: boolean
  verified: boolean
  nameServers?: string[]
  cnames?: string[]
  aValues?: string[]
}

export interface VercelEnvVar {
  key: string
  value?: string
  target: string[]
  type: string
}

export interface VercelLogEntry {
  id: string
  message: string
  timestamp: number
  level?: "error" | "warning" | "info"
  source?: string
}

const BASE = "https://api.vercel.com"

async function vFetch(path: string, token: string, teamId?: string) {
  const url = new URL(`${BASE}${path}`)
  if (teamId) url.searchParams.set("teamId", teamId)
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Vercel API ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function listProjects(token: string, teamId?: string): Promise<VercelProject[]> {
  const data = await vFetch("/v9/projects?limit=100", token, teamId)
  return data.projects ?? []
}

export async function getProject(token: string, projectId: string, teamId?: string): Promise<VercelProject> {
  return vFetch(`/v9/projects/${projectId}`, token, teamId)
}

export async function listDeployments(token: string, projectId: string, teamId?: string, limit = 10): Promise<VercelDeployment[]> {
  const data = await vFetch(`/v6/deployments?projectId=${projectId}&limit=${limit}&target=production`, token, teamId)
  return data.deployments ?? []
}

export async function listDomains(token: string, projectId: string, teamId?: string): Promise<VercelDomain[]> {
  const data = await vFetch(`/v9/projects/${projectId}/domains`, token, teamId)
  return data.domains ?? []
}

export async function listEnvVars(token: string, projectId: string, teamId?: string): Promise<VercelEnvVar[]> {
  const data = await vFetch(`/v10/projects/${projectId}/env`, token, teamId)
  return data.envs ?? []
}

export async function triggerRedeploy(token: string, deploymentUrl: string, teamId?: string) {
  const url = new URL(`${BASE}/v13/deployments`)
  if (teamId) url.searchParams.set("teamId", teamId)
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url: deploymentUrl, target: "production" }),
  })
  return res.json()
}

export async function getTeams(token: string) {
  const data = await vFetch("/v2/teams", token)
  return data.teams ?? []
}

export function getProductionUrl(project: VercelProject): string | null {
  const aliases = project.targets?.production?.alias
  if (aliases && aliases.length > 0) {
    const custom = aliases.find((a) => !a.includes("vercel.app"))
    return `https://${custom ?? aliases[0]}`
  }
  return null
}

export function deploymentStatusColor(state: string) {
  switch (state) {
    case "READY": return "success"
    case "ERROR": return "danger"
    case "BUILDING":
    case "INITIALIZING":
    case "QUEUED": return "warning"
    default: return "default"
  }
}
