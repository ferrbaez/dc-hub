import { moduleRouters } from "@/server/routers/_modules";
/**
 * Root tRPC router.
 *
 * - `core.*` is owned by the Core Keeper (Willian) and exposes shared data
 *   that any module is allowed to consume (containers, site, chat, health,
 *   and future SCADA / revenue / modulations endpoints).
 * - Module routers live in `src/modules/<area>/<modulo>/index.ts` and are
 *   registered under their area key by `pnpm new:module`, which writes to
 *   `_modules.ts`. Never edit `_modules.ts` by hand.
 */
import { coreRouter } from "@/server/routers/core";
import { router } from "@/server/trpc";

export const appRouter = router({
  core: coreRouter,
  ...moduleRouters,
});

export type AppRouter = typeof appRouter;
