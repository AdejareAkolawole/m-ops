import { NextResponse } from "next/server"
import { getAdapterLogs } from "@/lib/debug-adapter"

export async function GET() {
  return NextResponse.json({ logs: getAdapterLogs() })
}
