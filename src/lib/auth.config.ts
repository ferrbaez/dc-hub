/**
 * Edge-safe portion of the NextAuth config. Imported by middleware,
 * which runs in the Edge runtime and cannot load `pg` / `bcryptjs`.
 * The full config (with Credentials provider + DB access) lives in
 * `auth.ts` and is Node-only.
 */
import type { AreaSlug } from "@/lib/areas";
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";

// NextAuthConfig types `token` more loosely than our augmented JWT in
// `next-auth.d.ts`, so we narrow it locally. Same for `user` in jwt callback.
type AppToken = JWT & { role?: string; areas?: AreaSlug[]; moduleGrants?: string[] };
type AppUser = { role?: string; areas?: AreaSlug[]; moduleGrants?: string[] };

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
        const u = user as AppUser;
        const t = token as AppToken;
        t.role = u.role;
        t.areas = u.areas ?? [];
        t.moduleGrants = u.moduleGrants ?? [];
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const t = token as AppToken;
        if (t.sub) session.user.id = t.sub;
        session.user.role = t.role;
        session.user.areas = t.areas ?? [];
        session.user.moduleGrants = t.moduleGrants ?? [];
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
