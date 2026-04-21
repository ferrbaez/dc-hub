import "server-only";
import { icsPing } from "@/lib/db/ics";
import { localDbPing } from "@/lib/db/local";
import { scadaPing } from "@/lib/db/scada";

export type SourceHealth = {
  source: "local" | "ics" | "scada";
  ok: boolean;
  latencyMs?: number;
  error?: { code: string; message: string };
};

async function check(
  source: SourceHealth["source"],
  ping: () => Promise<{ ok: true; latencyMs: number }>,
): Promise<SourceHealth> {
  try {
    const { latencyMs } = await ping();
    return { source, ok: true, latencyMs };
  } catch (err) {
    const e = err as { code?: string; message?: string };
    return {
      source,
      ok: false,
      error: {
        code: e.code ?? "UNKNOWN",
        message: e.message ?? "unknown error",
      },
    };
  }
}

export async function runHealthcheck(): Promise<SourceHealth[]> {
  return Promise.all([
    check("local", localDbPing),
    check("ics", icsPing),
    check("scada", scadaPing),
  ]);
}
