// Emails that have admin access
const ADMIN_EMAILS = ["adejare.akolawole@gmail.com"]

export function isAdmin(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email)
}
