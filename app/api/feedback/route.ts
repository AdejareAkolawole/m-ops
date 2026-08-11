import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  const { type, title, description } = await req.json()
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 })

  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    const from = session?.user?.email ?? "anonymous"
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: "m-ops feedback <alerts@m-ops.pro>",
        to: ["adejare.akolawole@gmail.com"],
        reply_to: session?.user?.email ?? undefined,
        subject: `[m-ops ${type}] ${title}`,
        html: `<div style="font-family:sans-serif;max-width:500px">
          <h2 style="margin:0 0 16px">New ${type} request</h2>
          <p><strong>From:</strong> ${from}</p>
          <p><strong>Title:</strong> ${title}</p>
          ${description ? `<p><strong>Details:</strong></p><p style="color:#555">${description}</p>` : ""}
        </div>`,
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
