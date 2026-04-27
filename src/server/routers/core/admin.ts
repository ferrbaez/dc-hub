/**
 * Admin router — only callable with role="admin". Exposes user CRUD,
 * endpoint introspection, and module overview for the admin pages under
 * `/admin/*`.
 */
import { AREA_SLUGS, type AreaSlug, isAreaSlug } from "@/lib/areas";
import { getLocalDb } from "@/lib/db/local";
import { NAV_ITEMS } from "@/lib/nav-registry";
import { userAreas, userModuleGrants, users } from "@/schema/local";
import { protectedProcedure, router } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.session.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Solo administradores" });
  }
  return next();
});

const areaSlugSchema = z.enum(AREA_SLUGS);
const modeSchema = z.enum(["dev", "viewer"]);
const moduleSlugSchema = z.string().regex(/^[a-z][a-z0-9]*\/[a-z][a-z0-9]*(-[a-z0-9]+)*$/);

const userInputBase = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  role: z.enum(["admin", "user"]),
  areas: z.array(z.object({ area: areaSlugSchema, mode: modeSchema })),
  moduleGrants: z.array(moduleSlugSchema),
});

// ---------------------------------------------------------------------------
// Module introspection — derived from NAV_ITEMS at boot.
// ---------------------------------------------------------------------------

type ModuleRecord = { area: AreaSlug; modulo: string; href: string; label: string; slug: string };

function listKnownModules(): ModuleRecord[] {
  const out: ModuleRecord[] = [];
  for (const item of NAV_ITEMS) {
    if (!item.requiredArea || !item.moduleSlug) continue;
    const [, modulo] = item.moduleSlug.split("/");
    if (!modulo) continue;
    out.push({
      area: item.requiredArea,
      modulo,
      href: item.href,
      label: item.label,
      slug: item.moduleSlug,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Endpoint introspection — walk the appRouter once and cache.
// ---------------------------------------------------------------------------

type EndpointRecord = {
  path: string;
  type: "query" | "mutation" | "subscription";
  areas: AreaSlug[]; // empty array = no area gate (publicProcedure / protectedProcedure)
  description?: string;
};

let endpointsCache: EndpointRecord[] | null = null;

async function listEndpoints(): Promise<EndpointRecord[]> {
  if (endpointsCache) return endpointsCache;
  // Dynamic import to avoid circular imports at module-load time.
  // tRPC v11 stores procedures flat under appRouter._def.procedures with
  // dotted paths as keys. Each procedure has _def.type and _def.meta.
  const mod = await import("@/server/routers/_app");
  const procs = (mod.appRouter as unknown as { _def: { procedures: Record<string, unknown> } })._def
    .procedures;
  const out: EndpointRecord[] = [];
  for (const [path, proc] of Object.entries(procs)) {
    const def = (
      proc as { _def?: { type?: string; meta?: { areas?: AreaSlug[]; description?: string } } }
    )._def;
    if (!def) continue;
    out.push({
      path,
      type: (def.type ?? "query") as EndpointRecord["type"],
      areas: def.meta?.areas ?? [],
      description: def.meta?.description,
    });
  }
  out.sort((a, b) => a.path.localeCompare(b.path));
  endpointsCache = out;
  return out;
}

// ---------------------------------------------------------------------------
// Procedures
// ---------------------------------------------------------------------------

export const adminRouter = router({
  // ---- USERS ----
  "users.list": adminProcedure.query(async () => {
    const db = getLocalDb();
    const [userRows, areaRows, grantRows] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(users.id),
      db
        .select({ userId: userAreas.userId, area: userAreas.area, mode: userAreas.mode })
        .from(userAreas),
      db
        .select({ userId: userModuleGrants.userId, moduleSlug: userModuleGrants.moduleSlug })
        .from(userModuleGrants),
    ]);

    const areasByUser = new Map<string, { area: AreaSlug; mode: "dev" | "viewer" }[]>();
    for (const r of areaRows) {
      if (!isAreaSlug(r.area)) continue;
      const key = String(r.userId);
      if (!areasByUser.has(key)) areasByUser.set(key, []);
      areasByUser.get(key)?.push({ area: r.area, mode: r.mode === "viewer" ? "viewer" : "dev" });
    }
    const grantsByUser = new Map<string, string[]>();
    for (const r of grantRows) {
      const key = String(r.userId);
      if (!grantsByUser.has(key)) grantsByUser.set(key, []);
      grantsByUser.get(key)?.push(r.moduleSlug);
    }

    return userRows.map((u) => ({
      id: String(u.id),
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      createdAt: u.createdAt,
      areas: areasByUser.get(String(u.id)) ?? [],
      moduleGrants: grantsByUser.get(String(u.id)) ?? [],
    }));
  }),

  "users.create": adminProcedure
    .input(userInputBase.extend({ password: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const db = getLocalDb();
      const adminId = BigInt(ctx.session.user.id);
      const email = input.email.toLowerCase();
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Ya existe un usuario con email ${email}`,
        });
      }
      const passwordHash = await bcrypt.hash(input.password, 12);
      const [created] = await db
        .insert(users)
        .values({ email, displayName: input.displayName, passwordHash, role: input.role })
        .returning({ id: users.id });
      if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (input.areas.length > 0) {
        await db.insert(userAreas).values(
          input.areas.map((a) => ({
            userId: created.id,
            area: a.area,
            mode: a.mode,
            grantedBy: adminId,
          })),
        );
      }
      if (input.moduleGrants.length > 0) {
        await db.insert(userModuleGrants).values(
          input.moduleGrants.map((slug) => ({
            userId: created.id,
            moduleSlug: slug,
            grantedBy: adminId,
          })),
        );
      }
      return { id: String(created.id) };
    }),

  "users.update": adminProcedure
    .input(z.object({ id: z.string(), data: userInputBase.partial() }))
    .mutation(async ({ ctx, input }) => {
      const db = getLocalDb();
      const adminId = BigInt(ctx.session.user.id);
      const userId = BigInt(input.id);
      if (input.data.role || input.data.displayName || input.data.email) {
        await db
          .update(users)
          .set({
            ...(input.data.email ? { email: input.data.email.toLowerCase() } : {}),
            ...(input.data.displayName ? { displayName: input.data.displayName } : {}),
            ...(input.data.role ? { role: input.data.role } : {}),
            updatedAt: sql`now()`,
          })
          .where(eq(users.id, userId));
      }
      if (input.data.areas !== undefined) {
        await db.delete(userAreas).where(eq(userAreas.userId, userId));
        if (input.data.areas.length > 0) {
          await db.insert(userAreas).values(
            input.data.areas.map((a) => ({
              userId,
              area: a.area,
              mode: a.mode,
              grantedBy: adminId,
            })),
          );
        }
      }
      if (input.data.moduleGrants !== undefined) {
        await db.delete(userModuleGrants).where(eq(userModuleGrants.userId, userId));
        if (input.data.moduleGrants.length > 0) {
          await db.insert(userModuleGrants).values(
            input.data.moduleGrants.map((slug) => ({
              userId,
              moduleSlug: slug,
              grantedBy: adminId,
            })),
          );
        }
      }
      return { ok: true };
    }),

  "users.resetPassword": adminProcedure
    .input(z.object({ id: z.string(), password: z.string().min(8) }))
    .mutation(async ({ input }) => {
      const db = getLocalDb();
      const passwordHash = await bcrypt.hash(input.password, 12);
      await db
        .update(users)
        .set({ passwordHash, updatedAt: sql`now()` })
        .where(eq(users.id, BigInt(input.id)));
      return { ok: true };
    }),

  "users.delete": adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.session.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No te podés borrar a vos mismo" });
      }
      const db = getLocalDb();
      await db.delete(users).where(eq(users.id, BigInt(input.id)));
      return { ok: true };
    }),

  // ---- ENDPOINTS ----
  "endpoints.list": adminProcedure.query(async () => listEndpoints()),

  // ---- MODULES ----
  "modules.list": adminProcedure.query(async () => {
    const modules = listKnownModules();
    if (modules.length === 0) return [];
    const db = getLocalDb();
    const [areaRows, grantRows, userRows] = await Promise.all([
      db
        .select({ userId: userAreas.userId, area: userAreas.area, mode: userAreas.mode })
        .from(userAreas),
      db
        .select({ userId: userModuleGrants.userId, moduleSlug: userModuleGrants.moduleSlug })
        .from(userModuleGrants),
      db.select({ id: users.id, email: users.email, role: users.role }).from(users),
    ]);

    const userById = new Map(userRows.map((u) => [String(u.id), u]));

    return modules.map((m) => {
      const accessUsers: { id: string; email: string; via: string }[] = [];
      for (const r of areaRows) {
        if (r.area !== m.area) continue;
        const u = userById.get(String(r.userId));
        if (u) accessUsers.push({ id: String(r.userId), email: u.email, via: `area (${r.mode})` });
      }
      for (const r of grantRows) {
        if (r.moduleSlug !== m.slug) continue;
        const u = userById.get(String(r.userId));
        if (u) accessUsers.push({ id: String(r.userId), email: u.email, via: "grant" });
      }
      // admins always have access
      for (const u of userRows) {
        if (u.role === "admin")
          accessUsers.push({ id: String(u.id), email: u.email, via: "admin" });
      }
      return { ...m, accessUsers };
    });
  }),

  "modules.list-slugs": adminProcedure.query(() => listKnownModules().map((m) => m.slug)),
});
