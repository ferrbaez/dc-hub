import { type AreaSlug, isAreaSlug } from "@/lib/areas";
import { getLocalDb } from "@/lib/db/local";
import { userAreas, userModuleGrants, users } from "@/schema/local";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "./auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 }, // 30d
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        try {
          const db = getLocalDb();
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase()))
            .limit(1);
          if (!user) return null;
          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) return null;
          const [areaRows, grantRows] = await Promise.all([
            db
              .select({ area: userAreas.area })
              .from(userAreas)
              .where(eq(userAreas.userId, user.id)),
            db
              .select({ moduleSlug: userModuleGrants.moduleSlug })
              .from(userModuleGrants)
              .where(eq(userModuleGrants.userId, user.id)),
          ]);
          const areas: AreaSlug[] = areaRows
            .map((r) => r.area)
            .filter((a): a is AreaSlug => isAreaSlug(a));
          const moduleGrants = grantRows.map((r) => r.moduleSlug);
          return {
            id: String(user.id),
            email: user.email,
            name: user.displayName,
            role: user.role,
            areas,
            moduleGrants,
          };
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
});
