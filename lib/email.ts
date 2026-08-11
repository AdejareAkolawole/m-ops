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
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:560px;margin:40px auto;padding:0 20px">
  <div style="margin-bottom:32px">
    <span style="font-size:20px;font-weight:800;letter-spacing:-0.05em;color:#fff">m-ops</span>
  </div>
  <div style="background:#111;border:1px solid #1e1e1e;border-radius:16px;padding:36px 40px">
    ${content}
  </div>
  <p style="color:#333;font-size:12px;text-align:center;margin-top:24px">m-ops.pro · Built for developers who ship</p>
</div>
</body></html>`
}

export async function sendWelcomeEmail(to: string, name: string | null) {
  const first = name?.split(" ")[0] || "there"
  await send(to, "Welcome to m-ops 👋", wrap(`
    <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0 0 8px;letter-spacing:-0.03em">Hey ${first}, welcome aboard.</h1>
    <p style="color:#888;font-size:15px;line-height:1.6;margin:0 0 28px">m-ops connects your GitHub, deployments, and hosting — then gives you an AI that knows your stack.</p>
    <div style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:12px;padding:20px;margin-bottom:28px">
      <p style="color:#666;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px">Get started in 3 steps</p>
      <p style="color:#d4d4d4;font-size:14px;margin:0 0 8px">① Add a project and connect GitHub</p>
      <p style="color:#d4d4d4;font-size:14px;margin:0 0 8px">② Set up your Slack or email alerts</p>
      <p style="color:#d4d4d4;font-size:14px;margin:0">③ Let the AI watch your stack</p>
    </div>
    <a href="${BASE_URL}/dashboard" style="display:inline-block;background:#fff;color:#0a0a0a;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none">Go to dashboard →</a>
  `))
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${BASE_URL}/api/auth/verify-email?token=${token}`
  await send(to, "Verify your m-ops email", wrap(`
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 8px;letter-spacing:-0.03em">Verify your email</h1>
    <p style="color:#888;font-size:15px;line-height:1.6;margin:0 0 28px">Click the button below to verify your email address and activate your m-ops account. This link expires in 24 hours.</p>
    <a href="${url}" style="display:inline-block;background:#fff;color:#0a0a0a;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none">Verify email →</a>
    <p style="color:#444;font-size:12px;margin:24px 0 0">Or copy this link: <span style="color:#666;word-break:break-all">${url}</span></p>
  `))
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${BASE_URL}/reset-password?token=${token}`
  await send(to, "Reset your m-ops password", wrap(`
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 8px;letter-spacing:-0.03em">Reset your password</h1>
    <p style="color:#888;font-size:15px;line-height:1.6;margin:0 0 28px">We received a password reset request. Click below to set a new password. This link expires in 1 hour.</p>
    <a href="${url}" style="display:inline-block;background:#fff;color:#0a0a0a;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none">Reset password →</a>
    <p style="color:#444;font-size:12px;margin:24px 0 0">If you didn't request this, you can safely ignore this email.</p>
  `))
}

export async function sendFeedbackAlert(type: string, title: string, description: string | null, fromEmail: string | null) {
  await send(ADMIN, `[m-ops ${type}] ${title}`, wrap(`
    <h1 style="color:#fff;font-size:20px;font-weight:800;margin:0 0 4px;letter-spacing:-0.03em">New ${type} submitted</h1>
    <p style="color:#555;font-size:13px;margin:0 0 24px">From: ${fromEmail || "anonymous"}</p>
    <div style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:12px;padding:20px;margin-bottom:16px">
      <p style="color:#a78bfa;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px">Title</p>
      <p style="color:#e8e8e8;font-size:15px;margin:0">${title}</p>
    </div>
    ${description ? `<div style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:12px;padding:20px;margin-bottom:24px">
      <p style="color:#a78bfa;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px">Details</p>
      <p style="color:#888;font-size:14px;line-height:1.6;margin:0">${description}</p>
    </div>` : ""}
    <a href="${BASE_URL}/admin?tab=feedback" style="display:inline-block;background:#1a0f2e;border:1px solid #2d1a5e;color:#a78bfa;font-weight:700;font-size:13px;padding:10px 22px;border-radius:8px;text-decoration:none">View in admin →</a>
  `), fromEmail || undefined)
}

export async function sendNewUserAlert(name: string | null, email: string | null) {
  await send(ADMIN, `[m-ops] New signup: ${email}`, wrap(`
    <h1 style="color:#fff;font-size:20px;font-weight:800;margin:0 0 4px;letter-spacing:-0.03em">New user signed up</h1>
    <div style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:12px;padding:20px;margin:24px 0">
      <p style="color:#4ade80;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px">User</p>
      <p style="color:#e8e8e8;font-size:15px;margin:0 0 4px">${name || "No name"}</p>
      <p style="color:#666;font-size:13px;margin:0">${email || "No email"}</p>
    </div>
    <a href="${BASE_URL}/admin?tab=users" style="display:inline-block;background:#051a10;border:1px solid #0a3020;color:#4ade80;font-weight:700;font-size:13px;padding:10px 22px;border-radius:8px;text-decoration:none">View in admin →</a>
  `))
}

export async function sendCallConfirmationEmail(to: string, name: string | null, topic: string, datetime: string) {
  await send(to, "Support call request received — m-ops", wrap(`
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 8px;letter-spacing:-0.03em">Call request received</h1>
    <p style="color:#888;font-size:15px;line-height:1.6;margin:0 0 24px">Hi ${name || "there"}, we got your request and will confirm your slot shortly.</p>
    <div style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:12px;padding:20px;margin-bottom:24px">
      <p style="color:#818cf8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px">Your request</p>
      <p style="color:#e8e8e8;font-size:14px;margin:0 0 6px"><strong style="color:#666">Topic:</strong> ${topic}</p>
      <p style="color:#e8e8e8;font-size:14px;margin:0"><strong style="color:#666">Preferred time:</strong> ${datetime}</p>
    </div>
    <p style="color:#555;font-size:13px;margin:0">Reply to this email if you need to make changes.</p>
  `))
}

export async function sendSupportCallAlert(userName: string | null, userEmail: string | null, topic: string, date: string | null, time: string | null) {
  await send(ADMIN, `[m-ops] Support call booked: ${topic}`, wrap(`
    <h1 style="color:#fff;font-size:20px;font-weight:800;margin:0 0 4px;letter-spacing:-0.03em">Support call booked</h1>
    <div style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:12px;padding:20px;margin:24px 0">
      <p style="color:#818cf8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px">Details</p>
      <p style="color:#e8e8e8;font-size:14px;margin:0 0 6px"><strong style="color:#666">From:</strong> ${userName || "Unknown"} (${userEmail || "no email"})</p>
      <p style="color:#e8e8e8;font-size:14px;margin:0 0 6px"><strong style="color:#666">Topic:</strong> ${topic}</p>
      ${date ? `<p style="color:#e8e8e8;font-size:14px;margin:0"><strong style="color:#666">When:</strong> ${date} at ${time || "TBD"}</p>` : ""}
    </div>
    <a href="${BASE_URL}/admin?tab=feedback" style="display:inline-block;background:#0f1020;border:1px solid #1e2040;color:#818cf8;font-weight:700;font-size:13px;padding:10px 22px;border-radius:8px;text-decoration:none">View in admin →</a>
  `))
}
