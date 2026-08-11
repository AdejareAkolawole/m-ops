const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = "m-ops <hello@m-ops.pro>"
const ADMIN = "adejare.akolawole@gmail.com"
const BASE_URL = process.env.NEXTAUTH_URL || "https://m-ops.pro"

async function send(to: string | string[], subject: string, html: string, replyTo?: string) {
  if (!RESEND_API_KEY) return
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM, to: Array.isArray(to) ? to : [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  }).catch(() => {})
}

function wrap(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:520px;margin:48px auto;padding:0 24px 48px">
  <div style="margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid #e5e5e5">
    <span style="font-size:16px;font-weight:700;letter-spacing:-0.04em;color:#0a0a0a">m-ops</span>
  </div>
  <div style="background:#ffffff;border-radius:12px;padding:40px 40px 36px">
    ${content}
  </div>
  <p style="color:#aaa;font-size:12px;text-align:center;margin-top:28px;line-height:1.6">m-ops.pro &nbsp;·&nbsp; <a href="${BASE_URL}/settings" style="color:#aaa;text-decoration:underline">Manage notifications</a></p>
</div>
</body></html>`
}

export async function sendWelcomeEmail(to: string, name: string | null) {
  const first = name?.split(" ")[0] || "there"
  await send(to, "Welcome to m-ops", wrap(`
    <h1 style="color:#0a0a0a;font-size:22px;font-weight:700;margin:0 0 10px;letter-spacing:-0.03em">Hey ${first}, welcome to m-ops.</h1>
    <p style="color:#666;font-size:15px;line-height:1.7;margin:0 0 32px">Connect your GitHub, deployments, and hosting — then let the AI watch your stack.</p>
    <div style="border-top:1px solid #f0f0f0;padding-top:24px;margin-bottom:32px">
      <p style="color:#999;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 14px">Get started</p>
      <p style="color:#333;font-size:14px;margin:0 0 10px">① Add a project and connect GitHub</p>
      <p style="color:#333;font-size:14px;margin:0 0 10px">② Set up your Slack or email alerts</p>
      <p style="color:#333;font-size:14px;margin:0">③ Let the AI watch your stack</p>
    </div>
    <a href="${BASE_URL}/dashboard" style="display:inline-block;background:#0a0a0a;color:#fff;font-weight:600;font-size:14px;padding:11px 24px;border-radius:8px;text-decoration:none">Go to dashboard →</a>
  `))
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${BASE_URL}/api/auth/verify-email?token=${token}`
  await send(to, "Verify your m-ops email", wrap(`
    <h1 style="color:#0a0a0a;font-size:22px;font-weight:700;margin:0 0 10px;letter-spacing:-0.03em">Verify your email</h1>
    <p style="color:#666;font-size:15px;line-height:1.7;margin:0 0 32px">Click below to verify your email and activate your account. This link expires in 24 hours.</p>
    <a href="${url}" style="display:inline-block;background:#0a0a0a;color:#fff;font-weight:600;font-size:14px;padding:11px 24px;border-radius:8px;text-decoration:none">Verify email →</a>
    <p style="color:#bbb;font-size:12px;margin:24px 0 0;word-break:break-all">${url}</p>
  `))
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${BASE_URL}/reset-password?token=${token}`
  await send(to, "Reset your m-ops password", wrap(`
    <h1 style="color:#0a0a0a;font-size:22px;font-weight:700;margin:0 0 10px;letter-spacing:-0.03em">Reset your password</h1>
    <p style="color:#666;font-size:15px;line-height:1.7;margin:0 0 32px">Click below to set a new password. This link expires in 1 hour.</p>
    <a href="${url}" style="display:inline-block;background:#0a0a0a;color:#fff;font-weight:600;font-size:14px;padding:11px 24px;border-radius:8px;text-decoration:none">Reset password →</a>
    <p style="color:#bbb;font-size:12px;margin:24px 0 0">Didn't request this? You can safely ignore this email.</p>
  `))
}

export async function sendFeedbackAlert(type: string, title: string, description: string | null, fromEmail: string | null) {
  await send(ADMIN, `[m-ops] New ${type}: ${title}`, wrap(`
    <h1 style="color:#0a0a0a;font-size:20px;font-weight:700;margin:0 0 4px;letter-spacing:-0.03em">New ${type}</h1>
    <p style="color:#aaa;font-size:13px;margin:0 0 28px">From ${fromEmail || "anonymous"}</p>
    <div style="border-top:1px solid #f0f0f0;padding-top:20px;margin-bottom:${description ? "20px" : "28px"}">
      <p style="color:#999;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px">Title</p>
      <p style="color:#1a1a1a;font-size:15px;margin:0">${title}</p>
    </div>
    ${description ? `<div style="border-top:1px solid #f0f0f0;padding-top:20px;margin-bottom:28px">
      <p style="color:#999;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px">Details</p>
      <p style="color:#555;font-size:14px;line-height:1.7;margin:0">${description}</p>
    </div>` : ""}
    <a href="${BASE_URL}/admin?tab=feedback" style="display:inline-block;background:#0a0a0a;color:#fff;font-weight:600;font-size:13px;padding:10px 22px;border-radius:8px;text-decoration:none">View in admin →</a>
  `), fromEmail || undefined)
}

export async function sendNewUserAlert(name: string | null, email: string | null) {
  await send(ADMIN, `[m-ops] New signup: ${email}`, wrap(`
    <h1 style="color:#0a0a0a;font-size:20px;font-weight:700;margin:0 0 4px;letter-spacing:-0.03em">New signup</h1>
    <div style="border-top:1px solid #f0f0f0;padding-top:20px;margin:24px 0 28px">
      <p style="color:#999;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px">User</p>
      <p style="color:#1a1a1a;font-size:15px;font-weight:600;margin:0 0 4px">${name || "No name"}</p>
      <p style="color:#888;font-size:13px;margin:0">${email || "No email"}</p>
    </div>
    <a href="${BASE_URL}/admin?tab=users" style="display:inline-block;background:#0a0a0a;color:#fff;font-weight:600;font-size:13px;padding:10px 22px;border-radius:8px;text-decoration:none">View in admin →</a>
  `))
}

export async function sendCallConfirmationEmail(to: string, name: string | null, topic: string, datetime: string) {
  await send(to, "Support call request received — m-ops", wrap(`
    <h1 style="color:#0a0a0a;font-size:22px;font-weight:700;margin:0 0 10px;letter-spacing:-0.03em">Call request received</h1>
    <p style="color:#666;font-size:15px;line-height:1.7;margin:0 0 28px">Hi ${name || "there"}, we got your request and will confirm your slot shortly.</p>
    <div style="border-top:1px solid #f0f0f0;padding-top:20px;margin-bottom:28px">
      <p style="color:#999;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 14px">Your request</p>
      <p style="color:#333;font-size:14px;margin:0 0 8px"><span style="color:#aaa">Topic</span> &nbsp; ${topic}</p>
      <p style="color:#333;font-size:14px;margin:0"><span style="color:#aaa">Time</span> &nbsp; ${datetime}</p>
    </div>
    <p style="color:#bbb;font-size:13px;margin:0">Reply to this email if you need to make changes.</p>
  `))
}

export async function sendSupportCallAlert(userName: string | null, userEmail: string | null, topic: string, date: string | null, time: string | null) {
  await send(ADMIN, `[m-ops] Support call: ${topic}`, wrap(`
    <h1 style="color:#0a0a0a;font-size:20px;font-weight:700;margin:0 0 4px;letter-spacing:-0.03em">Support call booked</h1>
    <div style="border-top:1px solid #f0f0f0;padding-top:20px;margin:24px 0 28px">
      <p style="color:#999;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 14px">Details</p>
      <p style="color:#333;font-size:14px;margin:0 0 8px"><span style="color:#aaa">From</span> &nbsp; ${userName || "Unknown"} &middot; ${userEmail || "no email"}</p>
      <p style="color:#333;font-size:14px;margin:0 0 8px"><span style="color:#aaa">Topic</span> &nbsp; ${topic}</p>
      ${date ? `<p style="color:#333;font-size:14px;margin:0"><span style="color:#aaa">When</span> &nbsp; ${date} at ${time || "TBD"}</p>` : ""}
    </div>
    <a href="${BASE_URL}/admin?tab=feedback" style="display:inline-block;background:#0a0a0a;color:#fff;font-weight:600;font-size:13px;padding:10px 22px;border-radius:8px;text-decoration:none">View in admin →</a>
  `))
}
