import { runHealthcheck } from "@/lib/db/healthcheck";
import { publicProcedure, router } from "@/server/trpc";

export const healthRouter = router({
  all: publicProcedure.query(async () => {
    return runHealthcheck();
  }),
});
