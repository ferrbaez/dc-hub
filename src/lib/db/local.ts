import "server-only";
import * as schema from "@/schema/local";
import { type NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

export class LocalDbUnreachableError extends Error {
  readonly code = "LOCAL_DB_UNREACHABLE";
  constructor(cause?: unknown) {
    super("Local DB unreachable — is `docker compose up -d` running?");
    this.name = "LocalDbUnreachableError";
    if (cause instanceof Error) this.cause = cause;
  }
}

const UNREACHABLE_ERRORS = new Set(["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT"]);

function buildConfig(): PoolConfig {
  return {
    host: process.env.LOCAL_DB_HOST ?? "localhost",
    port: Number(process.env.LOCAL_DB_PORT ?? 5432),
    user: process.env.POSTGRES_USER ?? "ops",
    password: process.env.POSTGRES_PASSWORD ?? "",
    database: process.env.POSTGRES_DB ?? "ops_console",
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  };
}

let pool: Pool | null = null;
let db: NodePgDatabase<typeof schema> | null = null;

export function getLocalPool(): Pool {
  if (!pool) {
    pool = new Pool(buildConfig());
    pool.on("error", (err) => console.error("[local-db] pool error:", err.message));
  }
  return pool;
}

export function getLocalDb(): NodePgDatabase<typeof schema> {
  if (!db) {
    db = drizzle(getLocalPool(), { schema });
  }
  return db;
}

export function isLocalDbUnreachableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" && UNREACHABLE_ERRORS.has(code);
}

export async function localDbPing(): Promise<{ ok: true; latencyMs: number }> {
  const start = Date.now();
  try {
    await getLocalPool().query("SELECT 1");
  } catch (err) {
    if (isLocalDbUnreachableError(err)) throw new LocalDbUnreachableError(err);
    throw err;
  }
  return { ok: true, latencyMs: Date.now() - start };
}
