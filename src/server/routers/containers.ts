import { listContainersWithCurrent } from "@/lib/queries/ics/containers";
import { publicProcedure, router } from "@/server/trpc";

export const containersRouter = router({
  list: publicProcedure.query(async () => {
    return listContainersWithCurrent();
  }),
});
