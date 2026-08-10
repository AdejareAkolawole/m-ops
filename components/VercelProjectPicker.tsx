"use client"
import { useState } from "react"
import { VercelSyncedProject } from "@/lib/types"
import { CheckmarkCircle02Icon, Cancel01Icon, RocketIcon, AddSquareIcon } from "hugeicons-react"
import { cn } from "@/lib/utils"

interface Props {
  projects: VercelSyncedProject[]
  initialSelected?: string[]  // for "manage" mode — pre-check what's already in hub
  onConfirm: (selectedIds: string[]) => void
  onClose?: () => void
  mode?: "pick" | "manage"
}

export function VercelProjectPicker({ projects, initialSelected, onConfirm, onClose, mode = "pick" }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialSelected ?? [])
  )

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() { setSelected(new Set(projects.map((p) => p.id))) }
  function selectNone() { setSelected(new Set()) }

  const selectedCount = selected.size

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              {mode === "manage" ? "Manage Vercel projects" : "Choose projects to monitor"}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {mode === "manage"
                ? "Only checked projects appear on your dashboard."
                : `${projects.length} projects found — pick the ones you want to watch.`}
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
              <Cancel01Icon size={16} />
            </button>
          )}
        </div>

        {/* Select all / none */}
        <div className="px-6 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3 shrink-0">
          <button onClick={selectAll} className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">Select all</button>
          <span className="text-zinc-200 dark:text-zinc-700">·</span>
          <button onClick={selectNone} className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">Select none</button>
          <span className="ml-auto text-xs text-zinc-400">{selectedCount} selected</span>
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
          {projects.map((p) => {
            const isSelected = selected.has(p.id)
            const deploy = p.latestDeployment
            const isLive = deploy?.state === "READY"
            const url = p.productionUrl ?? (deploy ? `https://${deploy.url}` : null)

            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-6 py-3.5 text-left transition-colors",
                  isSelected
                    ? "bg-zinc-50 dark:bg-zinc-800/60"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                )}
              >
                {/* Checkbox */}
                <div className={cn(
                  "w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                  isSelected
                    ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white"
                    : "border-zinc-300 dark:border-zinc-600"
                )}>
                  {isSelected && <CheckmarkCircle02Icon size={10} className="text-white dark:text-zinc-900" />}
                </div>

                {/* Project info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <svg width="9" height="9" viewBox="0 0 76 65" fill="currentColor" className="text-zinc-400 shrink-0">
                      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                    </svg>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">{p.name}</span>
                    {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.framework && <span className="text-[11px] text-zinc-400 capitalize">{p.framework}</span>}
                    {url && <span className="text-[11px] text-zinc-400 truncate">{url.replace(/^https?:\/\//, "")}</span>}
                    {!deploy && <span className="text-[11px] text-zinc-400">No deployments</span>}
                  </div>
                </div>

                {/* State badge */}
                {deploy && (
                  <span className={cn(
                    "shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium",
                    isLive ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                      : deploy.state === "ERROR" ? "bg-red-50 dark:bg-red-900/20 text-red-500"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                  )}>
                    {isLive ? "Live" : deploy.state}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
          <button
            onClick={() => onConfirm(Array.from(selected))}
            disabled={selectedCount === 0}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-80 disabled:opacity-40 transition-opacity"
          >
            <AddSquareIcon size={14} />
            {mode === "manage"
              ? `Save — show ${selectedCount} project${selectedCount !== 1 ? "s" : ""}`
              : `Add ${selectedCount} project${selectedCount !== 1 ? "s" : ""} to hub`}
          </button>
        </div>
      </div>
    </div>
  )
}
