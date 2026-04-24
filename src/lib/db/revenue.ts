import "server-only";
import { Pool, type PoolConfig } from "pg";

/**
 * Revenue DBs — three separate PostgreSQL databases on the same host
 * (172.16.10.107:5432). One per JV client:
 *   - mara_reporting  → MARATHON (projects JV2, JV3, OCEAN_MARA_GENERAL)
 *   - nd_reporting    → NORTHERN DATA (project JV5)
 *   - zp_reporting    → ZPJV (projects JV1-1, JV1-2, JV4)
 *
 * Each DB is opened with its own Pool (max 3 conns). Read-only credentials
 * shared across the three. VPN required.
 */

export type RevenueDb = "mara_reporting" | "nd_reporting" | "zp_reporting";

const ALL_REVENUE_DBS: readonly RevenueDb[] = ["mara_reporting", "nd_reporting", "zp_reporting"];

export class RevenueUnreachableError extends Error {
  readonly code = "REVENUE_UNREACHABLE";
  constructor(
    public database: RevenueDb,
    cause?: unknown,
  ) {
    super(`Revenue DB ${database} unreachable — check VPN / credentials`);
    this.name = "RevenueUnreachableError";
    if (cause instanceof Error) this.cause = cause;
  }
}

export class RevenueConfigError extends Error {
  readonly code = "REVENUE_CONFIG_MISSING";
  constructor(missing: string[]) {
    super(`Revenue credentials missing — set ${missing.join(", ")} in .env.local`);
    this.name = "RevenueConfigError";
  }
}

const UNREACHABLE_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "EAI_AGAIN",
]);

function baseConfig(database: RevenueDb): PoolConfig {
  const host = process.env.REVENUE_DB_HOST;
  const user = process.env.REVENUE_DB_USER;
  const password = process.env.REVENUE_DB_PASSWORD;
  const missing: string[] = [];
  if (!host) missing.push("REVENUE_DB_HOST");
  if (!user) missing.push("REVENUE_DB_USER");
  if (!password) missing.push("REVENUE_DB_PASSWORD");
  if (missing.length > 0) throw new RevenueConfigError(missing);

  return {
    host,
    port: Number(process.env.REVENUE_DB_PORT ?? 5432),
    database,
    user,
    password,
    ssl: false,
    max: 3,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 30_000,
  };
}

// One pool per database, lazily created.
const pools = new Map<RevenueDb, Pool>();

export function getRevenuePool(database: RevenueDb): Pool {
  let pool = pools.get(database);
  if (!pool) {
    pool = new Pool(baseConfig(database));
    pool.on("error", (err) => {
      console.error(`[revenue:${database}] pool error:`, err.message);
    });
    pools.set(database, pool);
  }
  return pool;
}

export function isRevenueUnreachableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" && UNREACHABLE_CODES.has(code);
}

export async function revenueQuery<T extends Record<string, unknown>>(
  database: RevenueDb,
  text: string,
  params: readonly unknown[] = [],
): Promise<T[]> {
  const pool = getRevenuePool(database);
  try {
    const res = await pool.query<T>(text, params as unknown[]);
    return res.rows;
  } catch (err) {
    if (isRevenueUnreachableError(err)) throw new RevenueUnreachableError(database, err);
    throw err;
  }
}

/**
 * Ping one canonical revenue DB (mara_reporting) to confirm connectivity.
 * Same host + creds apply to the three, so a single ping is representative.
 */
export async function revenuePing(): Promise<{ ok: true; latencyMs: number }> {
  const start = Date.now();
  await revenueQuery("mara_reporting", "SELECT 1");
  return { ok: true, latencyMs: Date.now() - start };
}

/**
 * Close all revenue pools. Call from scripts that need a clean shutdown.
 */
export async function closeRevenuePools(): Promise<void> {
  const closings = Array.from(pools.values()).map((p) => p.end().catch(() => {}));
  await Promise.allSettled(closings);
  pools.clear();
}

export function listRevenueDbs(): readonly RevenueDb[] {
  return ALL_REVENUE_DBS;
}
