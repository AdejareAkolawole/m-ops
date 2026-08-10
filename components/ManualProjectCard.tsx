"use client"
import { ManualProject, CheckResult } from "@/lib/types"
import { LinkSquare02Icon, ArrowReloadHorizontalIcon, AlertCircleIcon, CheckmarkCircle02Icon, Loading03Icon, Delete02Icon } from "hugeicons-react"
import { cn } from "@/lib/utils"

interface UptimeResult {
  ok: boolean
  statusCode?: number
  responseMs?: number
  error?: string
  checking?: boolean
}

interface Props {
  project: ManualProject
  uptime?: UptimeResult
  history?: CheckResult[]
  onSelect: (p: ManualProject) => void
  onRefresh: (p: ManualProject) => void
  onDelete: (p: ManualProject) => void
}

export function ManualProjectCard({ project, uptime, history = [], onSelect, onRefresh, onDelete }: Props) {
  const displayUrl = project.url.replace(/^https?:\/\//, "")
  const isUp = uptime?.ok === true
  const isDown = uptime?.ok === false
  const isChecking = uptime?.checking

  return (
    <div
      onClick={() => onSelect(project)}
      className={cn(
        "group relative rounded-2xl border bg-white dark:bg-zinc-900 p-5 cursor-pointer transition-all hover:shadow-md",
        isDown
          ? "border-red-200 dark:border-red-900/50 hover:border-red-300"
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Status dot */}
          {isChecking ? (
            <Loading03Icon size={11} className="text-zinc-400 animate-spin shrink-0" />
          ) : isUp ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-500/20" />
          ) : isDown ? (
            <AlertCircleIcon size={12} className="text-red-400 shrink-0" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 shrink-0" />
          )}
          <span className="font-semibold text-zinc-900 dark:text-white text-sm">{project.name}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
          <button
            onClick={(e) => { e.stopPropagation(); onRefresh(project) }}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
            title="Re-check"
          >
            <ArrowReloadHorizontalIcon size={12} className={cn(isChecking && "animate-spin")} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(project) }}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500"
            title="Delete project"
          >
            <Delete02Icon size={12} />
          </button>
        </div>
      </div>

      {project.description && (
        <p className="text-xs text-zinc-400 mb-3 truncate">{project.description}</p>
      )}

      {/* Status badges */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        {isChecking ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500">Checking...</span>
        ) : isUp ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckmarkCircle02Icon size={9} /> Up
          </span>
        ) : isDown ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center gap-1">
            <AlertCircleIcon size={9} /> Down
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500">Not checked</span>
        )}

        {uptime?.responseMs != null && (
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-medium",
            uptime.responseMs > 2000
              ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
          )}>
            {uptime.responseMs}ms
          </span>
        )}

        {uptime?.statusCode && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            HTTP {uptime.statusCode}
          </span>
        )}
      </div>

      {/* Mini uptime bars */}
      {history.length > 1 && (
        <div className="mb-3">
          <MiniUptimeBars history={history} />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 flex items-center gap-1 truncate max-w-[80%]"
        >
          <LinkSquare02Icon size={10} />
          {displayUrl}
        </a>
        {project.lastChecked && (
          <span className="text-[10px] text-zinc-400 shrink-0">{timeAgo(project.lastChecked)}</span>
        )}
      </div>
    </div>
  )
}

function MiniUptimeBars({ history }: { history: CheckResult[] }) {
  const count = Math.min(history.length, 24)
  const bars = Array.from({ length: count }, (_, i) => {
    const entry = history[count - 1 - i]
    if (!entry) return "empty"
    return entry.status === "online" ? "up" : entry.status === "degraded" ? "degraded" : "down"
  })
  const uptimePct = Math.round(history.filter(h => h.status === "online").length / history.length * 100)
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] text-zinc-400">Uptime</p>
        <p className={cn("text-[10px] font-semibold", uptimePct === 100 ? "text-emerald-500" : uptimePct >= 95 ? "text-amber-500" : "text-red-500")}>
          {uptimePct}%
        </p>
      </div>
      <div className="flex items-end gap-px h-5">
        {bars.map((status, i) => (
          <div key={i} className={cn("flex-1 rounded-[1px]",
            status === "up" ? "h-full bg-emerald-500" :
            status === "down" ? "h-full bg-red-500" :
            status === "degraded" ? "h-3/4 bg-amber-400" :
            "h-1/3 bg-zinc-200 dark:bg-zinc-700"
          )} />
        ))}
      </div>
    </div>
  )
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return "just now"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}
