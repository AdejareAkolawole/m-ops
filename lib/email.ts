const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = "m-ops <hello@m-ops.pro>"
const ADMIN = "adejare.akolawole@gmail.com"
const BASE_URL = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "https://m-ops.pro"

async function send(to: string | string[], subject: string, html: string, replyTo?: string) {
  if (!RESEND_API_KEY) return
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM, to: Array.isArray(to) ? to : [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  }).catch(() => {})
}

function wrap(content: string, footerExtra = "") {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2f2f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a">
  <tr><td style="padding:26px 48px">
    <span style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-0.05em">m-ops</span>
  </td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f2">
  <tr><td align="center" style="padding:32px 24px">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
      <tr><td style="background:#ffffff;border-radius:10px;padding:48px 48px 44px">
        ${content}
      </td></tr>
    </table>
  </td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f2">
  <tr><td align="center" style="padding:0 48px 40px">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-top:1px solid #e8e8e8">
      <tr><td style="padding:20px 0 0">
        <p style="margin:0 0 8px;font-size:12px;color:#999">
          <a href="${BASE_URL}/dashboard" style="color:#999;text-decoration:none;margin-right:16px">Dashboard</a>
          <a href="${BASE_URL}/settings" style="color:#999;text-decoration:none;margin-right:16px">Settings</a>
          <a href="mailto:hello@m-ops.pro" style="color:#999;text-decoration:none;margin-right:16px">Support</a>
          ${footerExtra}
          <a href="${BASE_URL}/settings" style="color:#999;text-decoration:none">Unsubscribe</a>
        </p>
        <p style="margin:0;font-size:11px;color:#c8c8c8;line-height:1.6">© 2025 m-ops · m-ops.pro · Built for developers who ship</p>
      </td></tr>
    </table>
  </td></tr>
</table>

</body></html>`
}

function label(text: string) {
  return `<p style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#bbb;margin:0 0 10px">${text}</p>`
}

function infoBox(rows: { key: string; val: string }[]) {
  const inner = rows.map(r =>
    `<tr>
      <td style="font-size:13px;color:#aaa;width:90px;padding:0 12px 10px 0;vertical-align:top">${r.key}</td>
      <td style="font-size:13px;color:#222;font-weight:500;padding:0 0 10px;line-height:1.5">${r.val}</td>
    </tr>`
  ).join("")
  return `<div style="background:#fafafa;border:1px solid #efefef;border-radius:10px;padding:20px 22px;margin:20px 0 28px">
    <table cellpadding="0" cellspacing="0" style="width:100%">${inner}</table>
  </div>`
}

function badge(text: string, color: string, bg: string) {
  return `<span style="display:inline-block;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;background:${bg};color:${color};margin-bottom:16px">${text}</span>`
}

function divider() {
  return `<div style="height:1px;background:#f0f0f0;margin:28px 0"></div>`
}

function cta(text: string, url: string) {
  return `<a href="${url}" style="display:inline-block;background:#0a0a0a;color:#ffffff;font-size:14px;font-weight:600;padding:12px 26px;border-radius:8px;text-decoration:none;letter-spacing:-0.01em">${text}</a>`
}

export async function sendWelcomeEmail(to: string, name: string | null) {
  const first = name?.split(" ")[0] || "there"
  await send(to, "Welcome to m-ops", wrap(`
    <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 12px;letter-spacing:-0.03em">Hey ${first}, welcome to m-ops.</h1>
    <p style="color:#666;font-size:15px;line-height:1.7;margin:0 0 28px">Your workspace is ready. Connect your projects, set up alerts, and let the AI keep watch — so you can focus on shipping.</p>
    ${divider()}
    ${label("Get started in 3 steps")}
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:32px">
      <tr><td style="padding-bottom:14px"><span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:#f5f5f5;border:1px solid #e8e8e8;font-size:11px;font-weight:700;color:#999;text-align:center;line-height:24px;margin-right:12px;vertical-align:middle">1</span><span style="font-size:14px;color:#333;vertical-align:middle"><strong>Add a project</strong> — paste your repo or deployment URL</span></td></tr>
      <tr><td style="padding-bottom:14px"><span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:#f5f5f5;border:1px solid #e8e8e8;font-size:11px;font-weight:700;color:#999;text-align:center;line-height:24px;margin-right:12px;vertical-align:middle">2</span><span style="font-size:14px;color:#333;vertical-align:middle"><strong>Set up alerts</strong> — email, Slack, or PagerDuty</span></td></tr>
      <tr><td><span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:#f5f5f5;border:1px solid #e8e8e8;font-size:11px;font-weight:700;color:#999;text-align:center;line-height:24px;margin-right:12px;vertical-align:middle">3</span><span style="font-size:14px;color:#333;vertical-align:middle"><strong>Let it run</strong> — get notified only when things go wrong</span></td></tr>
    </table>
    ${cta("Go to dashboard →", `${BASE_URL}/dashboard`)}
  `))
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${BASE_URL}/api/auth/verify-email?token=${token}`
  await send(to, "Verify your m-ops email", wrap(`
    <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 12px;letter-spacing:-0.03em">Verify your email address.</h1>
    <p style="color:#666;font-size:15px;line-height:1.7;margin:0 0 32px">One click and you're in. This link expires in 24 hours.</p>
    ${cta("Verify my email →", url)}
    ${divider()}
    ${label("Or copy this link")}
    <p style="font-size:11.5px;color:#bbb;margin:0;word-break:break-all;line-height:1.6">${url}</p>
  `))
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${BASE_URL}/reset-password?token=${token}`
  await send(to, "Reset your m-ops password", wrap(`
    <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 12px;letter-spacing:-0.03em">Reset your password.</h1>
    <p style="color:#666;font-size:15px;line-height:1.7;margin:0 0 32px">We received a password reset request for your account. Click below to choose a new one. This link expires in 1 hour.</p>
    ${cta("Reset password →", url)}
    ${divider()}
    <p style="font-size:13px;color:#bbb;margin:0">Didn't request this? Your account is safe — you can ignore this email.</p>
  `))
}

export async function sendFeedbackAlert(type: string, title: string, description: string | null, fromEmail: string | null) {
  await send(ADMIN, `[m-ops] New ${type}: ${title}`, wrap(`
    ${badge("New " + type, "#7c3aed", "#f5f0ff")}
    <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 12px;letter-spacing:-0.03em">New ${type} submitted.</h1>
    <p style="color:#aaa;font-size:14px;margin:0 0 4px">From: <strong style="color:#555">${fromEmail || "anonymous"}</strong></p>
    ${infoBox([
      { key: "Title", val: title },
      ...(description ? [{ key: "Details", val: description }] : []),
    ])}
    ${cta("View in admin →", `${BASE_URL}/admin?tab=feedback`)}
  `), fromEmail || undefined)
}

export async function sendNewUserAlert(name: string | null, email: string | null) {
  await send(ADMIN, `[m-ops] New signup: ${email}`, wrap(`
    ${badge("New signup", "#18a34a", "#f0fff4")}
    <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 12px;letter-spacing:-0.03em">A new user just joined.</h1>
    <p style="color:#666;font-size:15px;line-height:1.7;margin:0 0 4px">Someone signed up for m-ops — here are their details.</p>
    ${infoBox([
      { key: "Name", val: name || "No name" },
      { key: "Email", val: email || "No email" },
    ])}
    ${cta("View in admin →", `${BASE_URL}/admin?tab=users`)}
  `))
}

export async function sendCallConfirmationEmail(to: string, name: string | null, topic: string, datetime: string) {
  await send(to, "Support call request received — m-ops", wrap(`
    <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 12px;letter-spacing:-0.03em">Your call request is received.</h1>
    <p style="color:#666;font-size:15px;line-height:1.7;margin:0 0 4px">Hey ${name || "there"} — we'll confirm your slot and send a calendar invite shortly. Here's what you booked:</p>
    ${infoBox([
      { key: "Topic", val: topic },
      { key: "Preferred", val: datetime },
    ])}
    <p style="font-size:13px;color:#aaa;margin:0">Reply to this email if you need to make changes or have questions.</p>
  `))
}

export async function sendProjectDownAlert(to: string, projectName: string, projectUrl: string, error: string | null) {
  await send(to, `${projectName} is down`, wrap(`
    ${badge("● Down", "#e03e3e", "#fff0f0")}
    <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 12px;letter-spacing:-0.03em">${projectName} is not responding.</h1>
    <p style="color:#666;font-size:15px;line-height:1.7;margin:0 0 4px">We detected an issue with your project. Here are the details:</p>
    ${infoBox([
      { key: "Project", val: projectName },
      { key: "URL", val: projectUrl },
      { key: "Error", val: error || "No response from server" },
    ])}
    ${cta("View project →", `${BASE_URL}/dashboard`)}
  `, `<a href="${BASE_URL}/settings" style="color:#999;text-decoration:none;margin-right:16px">Manage alerts</a>`))
}

export async function sendProjectUpAlert(to: string, projectName: string, projectUrl: string, responseMs: number | null) {
  await send(to, `${projectName} is back up`, wrap(`
    ${badge("● Back online", "#18a34a", "#f0fff4")}
    <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 12px;letter-spacing:-0.03em">${projectName} is back online.</h1>
    <p style="color:#666;font-size:15px;line-height:1.7;margin:0 0 4px">Your project has recovered and is responding normally.</p>
    ${infoBox([
      { key: "Project", val: projectName },
      { key: "URL", val: projectUrl },
      ...(responseMs ? [{ key: "Response", val: `${responseMs}ms` }] : []),
    ])}
    ${cta("View dashboard →", `${BASE_URL}/dashboard`)}
  `, `<a href="${BASE_URL}/settings" style="color:#999;text-decoration:none;margin-right:16px">Manage alerts</a>`))
}

export async function sendSupportCallAlert(userName: string | null, userEmail: string | null, topic: string, date: string | null, time: string | null) {
  await send(ADMIN, `[m-ops] Support call: ${topic}`, wrap(`
    ${badge("Support call booked", "#0a0a0a", "#f0f0f0")}
    <h1 style="color:#0a0a0a;font-size:24px;font-weight:700;margin:0 0 12px;letter-spacing:-0.03em">Support call booked.</h1>
    <p style="color:#666;font-size:15px;line-height:1.7;margin:0 0 4px">A user has scheduled a support call. Here are the details:</p>
    ${infoBox([
      { key: "From", val: `${userName || "Unknown"} · ${userEmail || "no email"}` },
      { key: "Topic", val: topic },
      ...(date ? [{ key: "When", val: `${date} at ${time || "TBD"}` }] : []),
    ])}
    ${cta("View in admin →", `${BASE_URL}/admin?tab=feedback`)}
  `))
}
