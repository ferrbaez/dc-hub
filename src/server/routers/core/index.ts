/**
 * Core router — namespaced as `core.*` in the tRPC tree.
 *
 * Modules in `src/modules/<area>/<nombre>/router.ts` MUST consume their data
 * through `core.*` endpoints. They never open DB connections directly and
 * never import from another `src/modules/<area>/...`.
 *
 * To add a new core endpoint:
 *  1. Add a new file in this folder (e.g. `core/scada.ts`).
 *  2. Register it in the `coreRouter` below.
 *  3. Document it in `docs/MODULAR_SOP.md` §7.2.
 */
import { chatRouter } from "@/server/routers/core/chat";
import { containersRouter } from "@/server/routers/core/containers";
import { healthRouter } from "@/server/routers/core/health";
import { siteRouter } from "@/server/routers/core/site";
import { router } from "@/server/trpc";

export const coreRouter = router({
  containers: containersRouter,
  health: healthRouter,
  chat: chatRouter,
  site: siteRouter,
});
