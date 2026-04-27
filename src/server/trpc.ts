import { hasAnyAreaAccess } from "@/lib/access";
import { AnthropicConfigError } from "@/lib/anthropic";
import type { AreaSlug } from "@/lib/areas";
import { IcsConfigError, IcsUnreachableError } from "@/lib/db/ics";
import { LocalDbUnreachableError } from "@/lib/db/local";
import { RevenueConfigError, RevenueUnreachableError } from "@/lib/db/revenue";
import { ScadaConfigError, ScadaUnreachableError } from "@/lib/db/scada";
import type { Context } from "@/server/context";
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";

type AppMeta = { areas?: AreaSlug[]; description?: string };

const t = initTRPC
  .context<Context>()
  .meta<AppMeta>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          code: (error.cause as { code?: string } | undefined)?.code ?? shape.data.code,
        },
      };
    },
  });

export const router = t.router;

const errorMappingMiddleware = t.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (err) {
    if (
      err instanceof IcsUnreachableError ||
      err instanceof ScadaUnreachableError ||
      err instanceof LocalDbUnreachableError ||
      err instanceof RevenueUnreachableError
    ) {
      throw new TRPCError({
        code: "SERVICE_UNAVAILABLE",
        message: err.message,
        cause: err,
      });
    }
    if (
      err instanceof IcsConfigError ||
      err instanceof ScadaConfigError ||
      err instanceof RevenueConfigError ||
      err instanceof AnthropicConfigError
    ) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: err.message,
        cause: err,
      });
    }
    throw err;
  }
});

export const publicProcedure = t.procedure.use(errorMappingMiddleware);

/** Requires an authenticated session. */
export const protectedProcedure = t.procedure
  .use(errorMappingMiddleware)
  .use(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Autenticación requerida" });
    }
    return next({
      ctx: {
        ...ctx,
        session: ctx.session as NonNullable<typeof ctx.session> & {
          user: NonNullable<typeof ctx.session.user>;
        },
      },
    });
  });

/**
 * Procedure that requires the user to have access to one of the listed areas.
 * "Access" means: admin, OR user has the area, OR user has a module grant
 * for any module within one of those areas.
 *
 * Use the singular `areaProcedure(area)` for the common case. Use the plural
 * `areasProcedure([...])` for endpoints intentionally shared across areas
 * (e.g. `core.revenue.*` callable from both mining and finance).
 *
 * Auto-tags the procedure with `meta({ areas })` so the introspection in
 * `/admin/endpoints` can list the requirement without parsing middleware.
 */
export function areasProcedure(allowed: readonly AreaSlug[]) {
  return protectedProcedure.meta({ areas: [...allowed] }).use(async ({ ctx, next }) => {
    const user = ctx.session.user;
    if (user.role === "admin") return next();
    if (!hasAnyAreaAccess(user, allowed)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Acceso denegado: requiere una de [${allowed.join(", ")}]`,
      });
    }
    return next();
  });
}

export function areaProcedure(area: AreaSlug) {
  return areasProcedure([area]);
}
