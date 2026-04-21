import "server-only";
import { Pool, type PoolConfig } from "pg";

export class IcsUnreachableError extends Error {
  readonly code = "ICS_UNREACHABLE";
  constructor(cause?: unknown) {
    super("ICS unreachable — check VPN");
    this.name = "IcsUnreachableError";
    if (cause instanceof Error) this.cause = cause;
  }
}

export class IcsConfigError extends Error {
  readonly code = "ICS_CONFIG_MISSING";
  constructor(missing: string[]) {
    super(`ICS credentials missing — set ${missing.join(", ")} in .env.local`);
    this.name = "IcsConfigError";
  }
}

const UNREACHABLE_ERRORS = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "EAI_AGAIN",
]);

function buildConfig(): PoolConfig {
  const host = process.env.ICS_DB_HOST;
  const database = process.env.ICS_DB_NAME;
  const user = process.env.ICS_DB_USER;
  const password = process.env.ICS_DB_PASSWORD;
  const missing: string[] = [];
  if (!host) missing.push("ICS_DB_HOST");
  if (!database) missing.push("ICS_DB_NAME");
  if (!user) missing.push("ICS_DB_USER");
  if (!password) missing.push("ICS_DB_PASSWORD");
  if (missing.length > 0) throw new IcsConfigError(missing);

  return {
    host,
    port: Number(process.env.ICS_DB_PORT ?? 5432),
    database,
    user,
    password,
    ssl: process.env.ICS_DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 30_000,
  };
}

let pool: Pool | null = null;

export function getIcsPool(): Pool {
  if (!pool) {
    pool = new Pool(buildConfig());
    pool.on("error", (err) => {
      // A pool-level error usually means a lost connection — wipe the pool
      // so the next call reconnects.
      console.error("[ics] pool error:", err.message);
    });
  }
  return pool;
}

export function isIcsUnreachableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" && UNREACHABLE_ERRORS.has(code);
}

export async function icsQuery<T extends Record<string, unknown>>(
  text: string,
  params: readonly unknown[] = [],
): Promise<T[]> {
  const p = getIcsPool();
  try {
    const res = await p.query<T>(text, params as unknown[]);
    return res.rows;
  } catch (err) {
    if (isIcsUnreachableError(err)) throw new IcsUnreachableError(err);
    throw err;
  }
}

export async function icsPing(): Promise<{ ok: true; latencyMs: number }> {
  const start = Date.now();
  await icsQuery("SELECT 1");
  return { ok: true, latencyMs: Date.now() - start };
}
