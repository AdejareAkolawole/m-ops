import { cn } from "@/lib/utils"

interface BadgeProps {
  className?: string
  variant?: "default" | "success" | "warning" | "danger" | "outline"
  children: React.ReactNode
}

const variants = {
  default: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400",
  outline: "border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300",
}

export function Badge({ className, variant = "default", children }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  )
}
