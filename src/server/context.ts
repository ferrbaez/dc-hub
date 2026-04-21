import { auth } from "@/lib/auth";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export async function createContext(_opts: FetchCreateContextFnOptions) {
  const session = await auth();
  return { session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
