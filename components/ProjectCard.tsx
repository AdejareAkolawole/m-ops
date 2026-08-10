"use client"
import { useState } from "react"
import { ProjectConfig, ProjectStatus, CheckResult } from "@/lib/types"
import { StatusDot } from "./StatusDot"
import { Badge } from "./ui/badge"
import { ExternalLink, RefreshCw, Trash2, Clock, ShieldCheck, Globe, Database, AlertTriangle } from "lucide-react"
import { deleteProject, pushCheck, getChecks } from "@/lib/store"
import { cn } from "@/lib/utils"

const statusVariant: Record<ProjectStatus, "success" | "warning" | "danger" | "default"> = {
  online: "success", degraded: "warning", offline: "danger", unknown: "default",
}

interface Props {
  project: ProjectConfig
  onSelect: (p: ProjectConfig) => void
  onDelete: (id: string) => void
  onChecked: (id: string, check: CheckResult) => void
}

export function ProjectCard({ project, onSelect, onDelete, onChecked }: Props) {
  const checks = getChecks(project.id)
  const latest = checks[0]
  const status: ProjectStatus = project.lastStatus ?? "unknown"
  const [checking, setChecking] = useState(false)

  async function runCheck(e: React.MouseEvent) {
    e.stopPropagation()
    setChecking(true)
    try {
      const res = await fetch("/api/monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: project.url, hubSecret: project.hubSecret, healthEndpoint: project.healthEndpoint }),
      })
      const check: CheckResult = await res.json()
      pushCheck(project.id, check)
      onChecked(project.id, check)
    } finally { setChecking(false) }
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm(`Delete "${project.name}"?`)) { deleteProject(project.id); onDelete(project.id) }
  }

  const hasHealth = !!latest?.health
  const dbOk = latest?.health?.db?.ok
  const hasIssues = status === "offline" || status === "degraded" || dbOk === false

  return (
    <div
      onClick={() => onSelect(project)}
      className={cn(
        "group relative rounded-2xl border bg-white dark:bg-zinc-900 p-5 cursor-pointer transition-all hover:shadow-md",
        hasIssues
          ? "border-red-200 dark:border-red-900/50 hover:border-red-300"
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusDot status={status} />
          <span className="font-semibold text-zinc-900 dark:text-white text-sm">{project.name}</span>
          {hasIssues && <AlertTriangle size={12} className="text-red-400" />}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={runCheck} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500" title="Check now">
            <RefreshCw size={13} className={cn(checking && "animate-spin")} />
          </button>
          <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-500 hover:text-red-500">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {project.description && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 truncate">{project.description}</p>
      )}

      {/* Stats row — from health data */}
      {hasHealth && latest?.health?.stats && (
        <div className="flex gap-3 mb-3 text-xs text-zinc-600 dark:text-zinc-400">
          {latest.health.stats.users !== undefined && (
            <span><span className="font-semibold text-zinc-900 dark:text-white">{fmt(latest.health.stats.users as number)}</span> users</span>
          )}
          {latest.health.stats.sites !== undefined && (
            <span><span className="font-semibold text-zinc-900 dark:text-white">{fmt(latest.health.stats.sites as number)}</span> sites</span>
          )}
          {latest.health.traffic?.today !== undefined && (
            <span><span className="font-semibold text-zinc-900 dark:text-white">{fmt(latest.health.traffic.today)}</span> views today</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        <Badge variant={statusVariant[status]} className="capitalize">{status}</Badge>
        {latest?.responseMs && <Badge variant="outline"><Clock size={10} className="mr-1" />{latest.responseMs}ms</Badge>}
        {latest?.ssl?.ok && <Badge variant="outline"><ShieldCheck size={10} className="mr-1" />SSL</Badge>}
        {latest?.dns?.ok && <Badge variant="outline"><Globe size={10} className="mr-1" />DNS</Badge>}
        {dbOk === true && <Badge variant="outline"><Database size={10} className="mr-1" />DB OK</Badge>}
        {dbOk === false && <Badge variant="danger"><Database size={10} className="mr-1" />DB Error</Badge>}
        {!hasHealth && status === "online" && (
          <Badge variant="outline" className="text-zinc-400">No health endpoint</Badge>
        )}
      </div>

      <div className="flex items-center justify-between">
        <a href={project.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 flex items-center gap-1 truncate max-w-[60%]">
          <ExternalLink size={10} />
          {project.url.replace(/^https?:\/\//, "")}
        </a>
        {project.lastChecked && (
          <span className="text-[10px] text-zinc-400">{new Date(project.lastChecked).toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  )
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k"
  return n.toString()
}
