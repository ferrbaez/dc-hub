import { chatRouter } from "@/server/routers/chat";
import { containersRouter } from "@/server/routers/containers";
import { healthRouter } from "@/server/routers/health";
import { siteRouter } from "@/server/routers/site";
import { router } from "@/server/trpc";

export const appRouter = router({
  containers: containersRouter,
  health: healthRouter,
  chat: chatRouter,
  site: siteRouter,
});

export type AppRouter = typeof appRouter;
