"use client"
import { VercelSyncedProject, CheckResult } from "@/lib/types"
import { ArrowReloadHorizontalIcon, LinkSquare02Icon, Loading03Icon, Delete02Icon } from "hugeicons-react"
import { cn } from "@/lib/utils"

interface UptimeResult {
  ok: boolean
  statusCode?: number
  responseMs?: number
  error?: string
  checking?: boolean
}

interface Props {
  project: VercelSyncedProject
  uptime?: UptimeResult
  history?: CheckResult[]
  onSelect: (p: VercelSyncedProject) => void
  onRefresh: (p: VercelSyncedProject) => void
  onRemove: (p: VercelSyncedProject) => void
  refreshing?: boolean
}

export function VercelProjectCard({ project, uptime, history = [], onSelect, onRefresh, onRemove, refreshing }: Props) {
  const url = project.productionUrl ?? (project.latestDeployment ? `https://${project.latestDeployment.url}` : null)
  const isUp = uptime?.ok === true
  const isDown = uptime?.ok === false
  const isChecking = uptime?.checking || refreshing
  const notYetChecked = uptime === undefined

  const statusLabel = isChecking ? "Checking..." : isUp ? "Online" : isDown ? "Offline" : "Pending"
  const statusColor = isUp ? "text-white" : isDown ? "text-red-500" : "text-zinc-400"
  const dotColor = isUp ? "bg-white/10" : isDown ? "bg-red-500" : "bg-zinc-400"
  const borderColor = isDown ? "border-red-200 dark:border-red-900/50" : "border-zinc-200 dark:border-zinc-800"

  return (
    <div
      onClick={() => onSelect(project)}
      className={cn(
        "group relative rounded-2xl border bg-white dark:bg-zinc-900 p-5 cursor-pointer transition-all hover:shadow-md hover:border-zinc-400 dark:hover:border-zinc-600",
        borderColor
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          {isChecking
            ? <Loading03Icon size={12} className="text-zinc-400 animate-spin shrink-0" />
            : <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", dotColor, isUp && "ring-2 ring-emerald-500/20")} />
          }
          <span className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{project.name}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
          <button
            onClick={(e) => { e.stopPropagation(); onRefresh(project) }}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
            title="Re-check"
          >
            <ArrowReloadHorizontalIcon size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(project) }}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500"
            title="Remove from hub"
          >
            <Delete02Icon size={12} />
          </button>
        </div>
      </div>

      {/* Status + response time */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className={cn("text-2xl font-bold", statusColor)}>
            {isChecking ? "—" : isUp ? "UP" : isDown ? "DOWN" : "—"}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">{statusLabel}</p>
        </div>
        {uptime?.responseMs != null && (
          <div className="text-right">
            <p className={cn("text-lg font-semibold",
              uptime.responseMs > 2000 ? "text-red-500"
              : uptime.responseMs > 800 ? "text-amber-500"
              : "text-zinc-900 dark:text-white"
            )}>
              {uptime.responseMs}ms
            </p>
            <p className="text-xs text-zinc-400">response</p>
          </div>
        )}
        {notYetChecked && (
          <p className="text-xs text-zinc-400">not checked yet</p>
        )}
      </div>

      {/* Mini uptime bars */}
      {history.length > 1 && (
        <div className="mb-3">
          <MiniUptimeBars history={history} />
        </div>
      )}

      {/* HTTP status + URL */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
        {uptime?.statusCode && (
          <span className={cn(
            "text-xs font-mono font-medium",
            uptime.statusCode < 400 ? "text-zinc-500" : "text-red-500"
          )}>
            HTTP {uptime.statusCode}
          </span>
        )}
        {!uptime?.statusCode && project.framework && (
          <span className="text-xs text-zinc-400 capitalize">{project.framework}</span>
        )}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 flex items-center gap-1 truncate max-w-[60%]"
          >
            <LinkSquare02Icon size={10} />
            {url.replace(/^https?:\/\//, "")}
          </a>
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
        <p className={cn("text-[10px] font-semibold", uptimePct === 100 ? "text-white" : uptimePct >= 95 ? "text-amber-500" : "text-red-500")}>
          {uptimePct}%
        </p>
      </div>
      <div className="flex items-end gap-px h-5">
        {bars.map((status, i) => (
          <div key={i} className={cn("flex-1 rounded-[1px]",
            status === "up" ? "h-full bg-white/10" :
            status === "down" ? "h-full bg-red-500" :
            status === "degraded" ? "h-3/4 bg-amber-400" :
            "h-1/3 bg-zinc-200 dark:bg-zinc-700"
          )} />
        ))}
      </div>
    </div>
  )
}
