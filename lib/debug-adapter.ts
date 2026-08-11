import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

const base = PrismaAdapter(prisma)

export const DebugAdapter = new Proxy(base, {
  get(target, prop) {
    const val = (target as any)[prop]
    if (typeof val !== "function") return val
    return async (...args: any[]) => {
      try {
        console.log(`[adapter] ${String(prop)}`, JSON.stringify(args).slice(0, 200))
        const result = await val.apply(target, args)
        console.log(`[adapter] ${String(prop)} OK`, JSON.stringify(result).slice(0, 200))
        return result
      } catch (e: any) {
        console.error(`[adapter] ${String(prop)} ERROR:`, e.message)
        throw e
      }
    }
  }
})
