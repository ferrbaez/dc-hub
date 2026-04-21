import "server-only";
import sql, { type ConnectionPool, type Request, type config as SqlConfig } from "mssql";

export class ScadaUnreachableError extends Error {
  readonly code = "SCADA_UNREACHABLE";
  constructor(cause?: unknown) {
    super("SCADA unreachable — check network / VPN");
    this.name = "ScadaUnreachableError";
    if (cause instanceof Error) this.cause = cause;
  }
}

export class ScadaConfigError extends Error {
  readonly code = "SCADA_CONFIG_MISSING";
  constructor(missing: string[]) {
    super(`SCADA credentials missing — set ${missing.join(", ")} in .env.local`);
    this.name = "ScadaConfigError";
  }
}

const UNREACHABLE_NETWORK_CODES = new Set([
  "ESOCKET",
  "ETIMEOUT",
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "EINSTLOOKUP",
  "ECONNCLOSED",
]);

function buildConfig(): SqlConfig {
  const server = process.env.SCADA_DB_HOST;
  const user = process.env.SCADA_DB_USER;
  const password = process.env.SCADA_DB_PASSWORD;
  const database = process.env.SCADA_DB_NAME ?? "Edge DB";
  const missing: string[] = [];
  if (!server) missing.push("SCADA_DB_HOST");
  if (!user) missing.push("SCADA_DB_USER");
  if (!password) missing.push("SCADA_DB_PASSWORD");
  if (missing.length > 0) throw new ScadaConfigError(missing);

  return {
    server: server as string,
    port: Number(process.env.SCADA_DB_PORT ?? 1433),
    user,
    password,
    database,
    options: {
      encrypt: process.env.SCADA_DB_ENCRYPT === "true",
      trustServerCertificate: process.env.SCADA_DB_TRUST_CERT !== "false",
      enableArithAbort: true,
    },
    // Hard cap — AVEVA Edge shares this instance. Never raise.
    pool: { max: 2, min: 0, idleTimeoutMillis: 30_000 },
    connectionTimeout: 10_000,
    requestTimeout: 30_000,
  };
}

let pool: ConnectionPool | null = null;
let connecting: Promise<ConnectionPool> | null = null;

export async function getScadaPool(): Promise<ConnectionPool> {
  if (pool?.connected) return pool;
  if (connecting) return connecting;
  const cfg = buildConfig();
  connecting = new sql.ConnectionPool(cfg)
    .connect()
    .then((p) => {
      pool = p;
      p.on("error", (err) => {
        console.error("[scada] pool error:", err.message);
        pool = null;
      });
      return p;
    })
    .catch((err) => {
      pool = null;
      if (isScadaUnreachableError(err)) throw new ScadaUnreachableError(err);
      throw err;
    })
    .finally(() => {
      connecting = null;
    });
  return connecting;
}

export function isScadaUnreachableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" && UNREACHABLE_NETWORK_CODES.has(code);
}

/**
 * Returns a Request with READ UNCOMMITTED already applied and an explicit timeout.
 * All SCADA access in the app goes through this helper.
 */
export async function getScadaRequest(opts: { timeoutMs?: number } = {}): Promise<Request> {
  const p = await getScadaPool();
  const req = p.request();
  // `timeout` is a runtime property on the Request prototype in node-mssql but
  // isn't declared in @types/mssql. Cast narrowly to keep the setter typed.
  (req as Request & { timeout: number }).timeout = opts.timeoutMs ?? 30_000;
  try {
    await req.query("SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED");
  } catch (err) {
    if (isScadaUnreachableError(err)) throw new ScadaUnreachableError(err);
    throw err;
  }
  return req;
}

export async function scadaPing(): Promise<{ ok: true; latencyMs: number }> {
  const start = Date.now();
  const req = await getScadaRequest({ timeoutMs: 5_000 });
  await req.query("SELECT 1 AS ok");
  return { ok: true, latencyMs: Date.now() - start };
}

export { sql };
