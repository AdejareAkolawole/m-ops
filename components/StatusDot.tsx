import { cn } from "@/lib/utils"
import { ProjectStatus } from "@/lib/types"

const colors: Record<ProjectStatus, string> = {
  online: "bg-emerald-500",
  degraded: "bg-amber-400",
  offline: "bg-red-500",
  unknown: "bg-zinc-400",
}

const pulse: Record<ProjectStatus, string> = {
  online: "animate-pulse bg-emerald-400",
  degraded: "animate-pulse bg-amber-300",
  offline: "",
  unknown: "",
}

export function StatusDot({ status }: { status: ProjectStatus }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {(status === "online" || status === "degraded") && (
        <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", pulse[status])} />
      )}
      <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", colors[status])} />
    </span>
  )
}
