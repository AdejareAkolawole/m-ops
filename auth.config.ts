import type { NextAuthConfig } from "next-auth"

// Lightweight config for middleware — no DB imports, safe for Edge runtime
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const isProtected =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/admin")
      if (isProtected) return !!auth?.user
      return true
    },
    async session({ session, token }) {
      // Pass emailVerified from JWT token to session so middleware can read it
      if (token?.emailVerified) (session.user as any).emailVerified = token.emailVerified
      return session
    },
  },
}
