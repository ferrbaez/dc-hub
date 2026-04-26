/**
 * Edge-safe portion of the NextAuth config. Imported by middleware,
 * which runs in the Edge runtime and cannot load `pg` / `bcryptjs`.
 * The full config (with Credentials provider + DB access) lives in
 * `auth.ts` and is Node-only.
 */
import type { AreaSlug } from "@/lib/areas";
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
        const u = user as { role?: string; areas?: AreaSlug[] };
        (token as { role?: string }).role = u.role;
        (token as { areas?: AreaSlug[] }).areas = u.areas ?? [];
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        const t = token as { role?: string; areas?: AreaSlug[] };
        session.user.role = t.role;
        session.user.areas = t.areas ?? [];
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
