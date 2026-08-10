export type ProjectStatus = "online" | "degraded" | "offline" | "unknown"

// Vercel account connected by the user
export interface VercelAccount {
  token: string
  teamId?: string
  connectedAt: string
}

// A project synced from Vercel
export interface VercelSyncedProject {
  id: string             // vercel project id
  name: string
  framework: string | null
  productionUrl: string | null
  latestDeployment: {
    uid: string
    url: string
    state: string
    createdAt: number
    meta?: { githubCommitMessage?: string; githubCommitRef?: string }
  } | null
  updatedAt: number
  // filled in after detail fetch
  domains?: { name: string; configured: boolean; verified: boolean }[]
  deployments?: { uid: string; url: string; state: string; createdAt: number; meta?: Record<string, string> }[]
  hasDbUrl?: boolean
  dbKey?: string | null
  envKeys?: { key: string; target: string[] }[]
  // runtime check results
  lastCheck?: {
    timestamp: string
    httpStatus?: number
    responseMs?: number
    dnsOk?: boolean
    sslOk?: boolean
  }
}

// Manual project (no Vercel connection)
export interface ManualProject {
  id: string
  name: string
  url: string
  hubSecret: string
  healthEndpoint: string
  adminUrl?: string         // custom admin panel URL
  adminApiUrl?: string      // API endpoint on their admin to pull analytics
  adminApiToken?: string    // bearer token for the admin API
  description?: string
  addedAt: string
  lastChecked?: string
  lastStatus?: ProjectStatus
}

export interface HubHealthResponse {
  status: "ok" | "degraded" | "error"
  responseMs?: number
  db?: { ok: boolean; latencyMs?: number; error?: string }
  services?: Record<string, { name: string; up: boolean; latencyMs?: number; configured?: boolean }>
  stats?: Record<string, number | string | undefined>
  traffic?: { today?: number; yesterday?: number; byDay?: { date: string; count: number }[] }
  growth?: Record<string, number | undefined>
  payments?: { todayCount?: number; todayAmount?: number; currency?: string }
  recentSignups?: { id: string; name?: string; email: string; plan?: string; createdAt: string }[]
  recentPayments?: { id: string; description?: string; amount: number; currency?: string; status?: string; createdAt: string }[]
  deploy?: { state: string; message?: string; url?: string; createdAt?: number } | null
  fetchedAt?: string
  raw?: Record<string, unknown>
}

export interface CheckResult {
  timestamp: string
  status: ProjectStatus
  responseMs?: number
  dns?: { ok: boolean; resolvedIp?: string; error?: string }
  ssl?: { ok: boolean; daysLeft?: number; error?: string }
  http?: { ok: boolean; statusCode?: number; error?: string }
  health?: HubHealthResponse
  error?: string
}

// Backward-compat alias
export type ProjectConfig = ManualProject

// ── Third-party hosting providers ────────────────────────────────────────────

export type HostingProvider = "netlify" | "railway" | "render" | "flyio" | "heroku"

// ── GitHub integration ────────────────────────────────────────────────────────

export interface GitHubAccount {
  token: string
  login: string
  connectedAt: string
}

export interface GitHubRepo {
  owner: string
  name: string
  fullName: string
  defaultBranch: string
  private: boolean
}

export type IssueSeverity = "critical" | "high" | "medium" | "low" | "info"
export type IssueCategory = "security" | "performance" | "config" | "dependency" | "code-quality" | "accessibility"

export interface DetectedIssue {
  id: string
  title: string
  explanation: string   // plain-English what it is and why it matters
  severity: IssueSeverity
  category: IssueCategory
  file: string          // relative path e.g. "src/lib/db.ts"
  line?: number
  fixDescription: string // what the auto-fix will do
  fixDiff?: string       // unified diff of the proposed fix
  fixable: boolean
  fixed?: boolean
}

export interface AnalysisResult {
  projectId: string
  repoFullName: string
  analyzedAt: string
  issues: DetectedIssue[]
  summary: string
}

export interface ProviderAccount {
  provider: HostingProvider
  token: string
  connectedAt: string
  teamId?: string
}

export interface ProviderProject {
  id: string
  provider: HostingProvider
  name: string
  url: string | null
  framework?: string | null
  status?: string
  createdAt?: string
  updatedAt?: string
}
