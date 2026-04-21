/**
 * Edge-safe portion of the NextAuth config. Imported by middleware,
 * which runs in the Edge runtime and cannot load `pg` / `bcryptjs`.
 * The full config (with Credentials provider + DB access) lives in
 * `auth.ts` and is Node-only.
 */
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  providers: [], // extended in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const loggedIn = !!auth?.user;
      const onLogin = nextUrl.pathname === "/login";
      if (onLogin) {
        if (loggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      return loggedIn; // returning false triggers redirect to pages.signIn
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        (session.user as { role?: string }).role = token.role as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
