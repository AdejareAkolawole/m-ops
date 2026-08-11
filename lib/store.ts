import { ManualProject, CheckResult, VercelAccount, VercelSyncedProject, ProviderAccount, ProviderProject, HostingProvider, GitHubAccount, GitHubRepo, AnalysisResult } from "./types"

const MANUAL_KEY = "hub_manual_projects"
const CHECKS_KEY = "hub_checks_v2"
const VERCEL_ACCOUNT_KEY = "hub_vercel_account"
const VERCEL_PROJECTS_KEY = "hub_vercel_projects"
const VERCEL_SELECTED_KEY = "hub_vercel_selected"
const PLAN_CACHE_KEY = "hub_plan_cache"

export function savePlanCache(plan: string, historyDays: number) {
  if (typeof window === "undefined") return
  localStorage.setItem(PLAN_CACHE_KEY, JSON.stringify({ plan, historyDays }))
}

function getHistoryDays(): number {
  if (typeof window === "undefined") return 7
  try {
    const raw = localStorage.getItem(PLAN_CACHE_KEY)
    return raw ? (JSON.parse(raw).historyDays ?? 7) : 7
  } catch { return 7 }
}

// ── Vercel account ────────────────────────────────────────────────────────────

export function getVercelAccount(): VercelAccount | null {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem(VERCEL_ACCOUNT_KEY) || "null") } catch { return null }
}

export function saveVercelAccount(account: VercelAccount) {
  localStorage.setItem(VERCEL_ACCOUNT_KEY, JSON.stringify(account))
}

export function clearVercelAccount() {
  localStorage.removeItem(VERCEL_ACCOUNT_KEY)
  localStorage.removeItem(VERCEL_PROJECTS_KEY)
}

// ── Vercel synced projects ────────────────────────────────────────────────────

export function getVercelProjects(): VercelSyncedProject[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(VERCEL_PROJECTS_KEY) || "[]") } catch { return [] }
}

export function saveVercelProjects(projects: VercelSyncedProject[]) {
  localStorage.setItem(VERCEL_PROJECTS_KEY, JSON.stringify(projects))
}

export function updateVercelProject(id: string, patch: Partial<VercelSyncedProject>) {
  const projects = getVercelProjects()
  const idx = projects.findIndex((p) => p.id === id)
  if (idx >= 0) projects[idx] = { ...projects[idx], ...patch }
  localStorage.setItem(VERCEL_PROJECTS_KEY, JSON.stringify(projects))
}

// ── Manual projects ───────────────────────────────────────────────────────────

export function getManualProjects(): ManualProject[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(MANUAL_KEY) || "[]") } catch { return [] }
}

export function saveManualProject(project: ManualProject) {
  const projects = getManualProjects()
  const idx = projects.findIndex((p) => p.id === project.id)
  if (idx >= 0) projects[idx] = project
  else projects.push(project)
  localStorage.setItem(MANUAL_KEY, JSON.stringify(projects))
}

export function deleteManualProject(id: string) {
  localStorage.setItem(MANUAL_KEY, JSON.stringify(getManualProjects().filter((p) => p.id !== id)))
  const checks = getAllChecks()
  delete checks[id]
  localStorage.setItem(CHECKS_KEY, JSON.stringify(checks))
}

// ── Checks ────────────────────────────────────────────────────────────────────

export function getAllChecks(): Record<string, CheckResult[]> {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(CHECKS_KEY) || "{}") } catch { return {} }
}

export function getChecks(projectId: string): CheckResult[] {
  return getAllChecks()[projectId] || []
}

export function pushCheck(projectId: string, check: CheckResult) {
  const historyDays = getHistoryDays()
  const all = getAllChecks()
  const cutoff = Date.now() - historyDays * 86_400_000
  const prev = (all[projectId] || []).filter(c => new Date(c.timestamp).getTime() > cutoff)
  all[projectId] = [check, ...prev].slice(0, 2_000)
  localStorage.setItem(CHECKS_KEY, JSON.stringify(all))
}

// ── Vercel selected project IDs ───────────────────────────────────────────────

export function getVercelSelectedIds(): string[] | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(VERCEL_SELECTED_KEY)
  if (raw === null) return null // null = never chosen (show picker)
  try { return JSON.parse(raw) } catch { return [] }
}

export function saveVercelSelectedIds(ids: string[]) {
  localStorage.setItem(VERCEL_SELECTED_KEY, JSON.stringify(ids))
}

export function clearVercelSelectedIds() {
  localStorage.removeItem(VERCEL_SELECTED_KEY)
}

// ── Per-project admin config (Vercel projects) ───────────────────────────────

export interface ProjectAdminConfig {
  adminUrl?: string
  adminApiUrl?: string
  adminApiToken?: string
}

export function getProjectAdminConfig(projectId: string): ProjectAdminConfig {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(`hub_admin_cfg_${projectId}`) || "{}") } catch { return {} }
}

export function saveProjectAdminConfig(projectId: string, cfg: ProjectAdminConfig) {
  localStorage.setItem(`hub_admin_cfg_${projectId}`, JSON.stringify(cfg))
}

// ── Provider accounts ─────────────────────────────────────────────────────────

export function getProviderAccount(provider: HostingProvider): ProviderAccount | null {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem(`hub_provider_${provider}`) || "null") } catch { return null }
}

export function saveProviderAccount(account: ProviderAccount) {
  localStorage.setItem(`hub_provider_${account.provider}`, JSON.stringify(account))
}

export function clearProviderAccount(provider: HostingProvider) {
  localStorage.removeItem(`hub_provider_${provider}`)
  localStorage.removeItem(`hub_provider_projects_${provider}`)
}

// ── Provider projects ─────────────────────────────────────────────────────────

export function getProviderProjects(provider: HostingProvider): ProviderProject[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(`hub_provider_projects_${provider}`) || "[]") } catch { return [] }
}

export function saveProviderProjects(provider: HostingProvider, projects: ProviderProject[]) {
  localStorage.setItem(`hub_provider_projects_${provider}`, JSON.stringify(projects))
}

export function getAllProviderProjects(): ProviderProject[] {
  if (typeof window === "undefined") return []
  const providers: HostingProvider[] = ["netlify", "railway", "render", "flyio", "heroku"]
  return providers.flatMap(p => getProviderProjects(p))
}

// ── GitHub account ────────────────────────────────────────────────────────────

export function getGitHubAccount(): GitHubAccount | null {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem("hub_github_account") || "null") } catch { return null }
}
export function saveGitHubAccount(a: GitHubAccount) {
  localStorage.setItem("hub_github_account", JSON.stringify(a))
}
export function clearGitHubAccount() {
  localStorage.removeItem("hub_github_account")
}

// ── GitHub repo linked to a project ──────────────────────────────────────────

export function getProjectRepo(projectId: string): GitHubRepo | null {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem(`hub_repo_${projectId}`) || "null") } catch { return null }
}
export function saveProjectRepo(projectId: string, repo: GitHubRepo) {
  localStorage.setItem(`hub_repo_${projectId}`, JSON.stringify(repo))
}

// ── Analysis results ──────────────────────────────────────────────────────────

export function getAnalysis(projectId: string): AnalysisResult | null {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem(`hub_analysis_${projectId}`) || "null") } catch { return null }
}
export function saveAnalysis(result: AnalysisResult) {
  localStorage.setItem(`hub_analysis_${result.projectId}`, JSON.stringify(result))
}
export function markIssueFixed(projectId: string, issueId: string) {
  const r = getAnalysis(projectId)
  if (!r) return
  r.issues = r.issues.map(i => i.id === issueId ? { ...i, fixed: true } : i)
  saveAnalysis(r)
}

// ── Backward-compat aliases ───────────────────────────────────────────────────
export const getProjects = getManualProjects
export const saveProject = saveManualProject
export const deleteProject = deleteManualProject
