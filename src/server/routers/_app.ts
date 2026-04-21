import { chatRouter } from "@/server/routers/chat";
import { containersRouter } from "@/server/routers/containers";
import { healthRouter } from "@/server/routers/health";
import { router } from "@/server/trpc";

export const appRouter = router({
  containers: containersRouter,
  health: healthRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
