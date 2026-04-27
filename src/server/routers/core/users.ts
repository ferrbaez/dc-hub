/**
 * Self-service procedures for the currently authenticated user.
 * (Admin-managed user CRUD lives in `core/admin.ts`.)
 */
import { getLocalDb } from "@/lib/db/local";
import { users } from "@/schema/local";
import { protectedProcedure, router } from "@/server/trpc";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

export const usersRouter = router({
  setThemePreference: protectedProcedure
    .input(z.object({ preference: z.enum(["light", "dark", "system"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = getLocalDb();
      await db
        .update(users)
        .set({ themePreference: input.preference, updatedAt: sql`now()` })
        .where(eq(users.id, BigInt(ctx.session.user.id)));
      return { ok: true };
    }),
});
