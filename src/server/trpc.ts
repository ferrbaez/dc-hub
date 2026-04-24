import { AnthropicConfigError } from "@/lib/anthropic";
import { IcsConfigError, IcsUnreachableError } from "@/lib/db/ics";
import { LocalDbUnreachableError } from "@/lib/db/local";
import { RevenueConfigError, RevenueUnreachableError } from "@/lib/db/revenue";
import { ScadaConfigError, ScadaUnreachableError } from "@/lib/db/scada";
import type { Context } from "@/server/context";
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";

const t = initTRPC.context<Context>().create({
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
