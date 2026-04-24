#!/usr/bin/env tsx
/**
 * Verifies ICS, SCADA, and local DB reachability. Exits non-zero if any
 * source is unreachable. Load env with `tsx --env-file=.env.local`.
 */
import { runHealthcheck } from "../src/lib/db/healthcheck";
import { getIcsPool } from "../src/lib/db/ics";
import { getLocalPool } from "../src/lib/db/local";
import { closeRevenuePools } from "../src/lib/db/revenue";
import { getScadaPool } from "../src/lib/db/scada";

const PAD = 36;
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function label(source: string) {
  const map: Record<string, string> = {
    local: "Local DB (TimescaleDB, localhost)",
    ics: "ICS (Postgres, VPN)",
    scada: "SCADA (SQL Server, AVEVA Edge)",
    revenue: "Revenue (3 Postgres DBs, VPN)",
  };
  return map[source] ?? source;
}

async function main() {
  console.log("Running healthcheck on all four data sources...\n");
  const results = await runHealthcheck();

  for (const r of results) {
    const name = label(r.source).padEnd(PAD);
    if (r.ok) {
      console.log(`${name} ${GREEN}✔ OK${RESET} ${DIM}(${r.latencyMs} ms)${RESET}`);
    } else {
      console.log(
        `${name} ${RED}✖ ${r.error?.message ?? "failed"}${RESET} ${DIM}[${r.error?.code ?? "UNKNOWN"}]${RESET}`,
      );
    }
  }

  const healthy = results.filter((r) => r.ok).length;
  console.log(`\n${healthy} of ${results.length} connections healthy.`);

  // Close pools so the script doesn't hang.
  await Promise.allSettled([
    (async () => {
      try {
        await getLocalPool().end();
      } catch {}
    })(),
    (async () => {
      try {
        await getIcsPool().end();
      } catch {}
    })(),
    (async () => {
      try {
        const p = await getScadaPool().catch(() => null);
        if (p) await p.close();
      } catch {}
    })(),
    closeRevenuePools(),
  ]);

  process.exit(healthy === results.length ? 0 : 1);
}

main().catch((err) => {
  console.error("[healthcheck] fatal error:", err);
  process.exit(2);
});
