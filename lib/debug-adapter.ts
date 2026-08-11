import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

const base = PrismaAdapter(prisma)

// Store last errors in memory for inspection
const g = globalThis as any
if (!g.__adapterLogs) g.__adapterLogs = []

export function getAdapterLogs() {
  return g.__adapterLogs as string[]
}

export const DebugAdapter = new Proxy(base, {
  get(target, prop) {
    const val = (target as any)[prop]
    if (typeof val !== "function") return val
    return async (...args: any[]) => {
      const label = String(prop)
      try {
        const result = await val.apply(target, args)
        g.__adapterLogs.push(`OK ${label}`)
        if (g.__adapterLogs.length > 20) g.__adapterLogs.shift()
        return result
      } catch (e: any) {
        const msg = `ERROR ${label}: ${e.message}`
        g.__adapterLogs.push(msg)
        if (g.__adapterLogs.length > 20) g.__adapterLogs.shift()
        console.error("[adapter-error]", msg)
        throw e
      }
    }
  }
})
