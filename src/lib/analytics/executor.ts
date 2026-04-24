import "server-only";
import { IcsUnreachableError, getIcsPool, isIcsUnreachableError } from "@/lib/db/ics";
import { getLocalPool } from "@/lib/db/local";
import {
  RevenueUnreachableError,
  getRevenuePool,
  isRevenueUnreachableError,
} from "@/lib/db/revenue";
import { ScadaUnreachableError, getScadaRequest, isScadaUnreachableError } from "@/lib/db/scada";

export type DataSource = "ics" | "scada" | "local" | "revenue_mara" | "revenue_nd" | "revenue_zp";

export const DATA_SOURCE_VALUES: readonly DataSource[] = [
  "ics",
  "scada",
  "local",
  "revenue_mara",
  "revenue_nd",
  "revenue_zp",
];

export type ExecutionResult = {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  durationMs: number;
  truncated: boolean;
};

export class QueryExecutionError extends Error {
  readonly code = "QUERY_EXECUTION_ERROR";
  constructor(
    public dataSource: DataSource,
    cause: unknown,
  ) {
    const message = cause instanceof Error ? cause.message : String(cause);
    super(`[${dataSource}] ${message}`);
    this.name = "QueryExecutionError";
    if (cause instanceof Error) this.cause = cause;
  }
}

const DEFAULT_MAX_ROWS = 10_000;
const DEFAULT_TIMEOUT_MS = 30_000;

function collectColumns(rows: Record<string, unknown>[]): string[] {
  if (rows.length === 0) return [];
  const cols = new Set<string>();
  for (const row of rows) for (const k of Object.keys(row)) cols.add(k);
  return Array.from(cols);
}

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v == null) out[k] = null;
    else if (v instanceof Date) out[k] = v.toISOString();
    else if (typeof v === "bigint") out[k] = v.toString();
    else if (Buffer.isBuffer(v)) out[k] = `<buffer ${v.length} bytes>`;
    else out[k] = v;
  }
  return out;
}

function revenuePoolFor(dataSource: DataSource) {
  switch (dataSource) {
    case "revenue_mara":
      return getRevenuePool("mara_reporting");
    case "revenue_nd":
      return getRevenuePool("nd_reporting");
    case "revenue_zp":
      return getRevenuePool("zp_reporting");
    default:
      return null;
  }
}

export async function executeQuery(
  dataSource: DataSource,
  sql: string,
  opts: { timeoutMs?: number; maxRows?: number } = {},
): Promise<ExecutionResult> {
  const start = Date.now();
  const maxRows = opts.maxRows ?? DEFAULT_MAX_ROWS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  try {
    // Revenue (3 Postgres DBs on same host, isolated pools)
    const revenuePool = revenuePoolFor(dataSource);
    if (revenuePool) {
      const client = await revenuePool.connect();
      try {
        await client.query(`SET statement_timeout = ${timeoutMs}`);
        const res = await client.query(sql);
        const rawRows = (res.rows ?? []) as Record<string, unknown>[];
        const truncated = rawRows.length > maxRows;
        const rows = (truncated ? rawRows.slice(0, maxRows) : rawRows).map(normalizeRow);
        const columns = res.fields?.map((f) => f.name) ?? collectColumns(rows);
        return {
          columns,
          rows,
          rowCount: rawRows.length,
          durationMs: Date.now() - start,
          truncated,
        };
      } finally {
        client.release();
      }
    }

    if (dataSource === "ics" || dataSource === "local") {
      const pool = dataSource === "ics" ? getIcsPool() : getLocalPool();
      const client = await pool.connect();
      try {
        await client.query(`SET statement_timeout = ${timeoutMs}`);
        const res = await client.query(sql);
        const rawRows = (res.rows ?? []) as Record<string, unknown>[];
        const truncated = rawRows.length > maxRows;
        const rows = (truncated ? rawRows.slice(0, maxRows) : rawRows).map(normalizeRow);
        const columns = res.fields?.map((f) => f.name) ?? collectColumns(rows);
        return {
          columns,
          rows,
          rowCount: rawRows.length,
          durationMs: Date.now() - start,
          truncated,
        };
      } finally {
        client.release();
      }
    }

    if (dataSource === "scada") {
      const req = await getScadaRequest({ timeoutMs });
      const res = await req.query(sql);
      const rawRows = ((res.recordset ?? []) as unknown as Record<string, unknown>[]) ?? [];
      const truncated = rawRows.length > maxRows;
      const rows = (truncated ? rawRows.slice(0, maxRows) : rawRows).map(normalizeRow);
      const columns = rawRows[0] ? Object.keys(rawRows[0]) : [];
      return {
        columns,
        rows,
        rowCount: rawRows.length,
        durationMs: Date.now() - start,
        truncated,
      };
    }

    throw new Error(`unknown data source: ${dataSource as string}`);
  } catch (err) {
    if (
      err instanceof IcsUnreachableError ||
      err instanceof ScadaUnreachableError ||
      err instanceof RevenueUnreachableError
    ) {
      throw err;
    }
    if (isIcsUnreachableError(err)) throw new IcsUnreachableError(err);
    if (isScadaUnreachableError(err)) throw new ScadaUnreachableError(err);
    // Revenue reachability: infer target DB from data source name
    if (isRevenueUnreachableError(err)) {
      const db =
        dataSource === "revenue_mara"
          ? "mara_reporting"
          : dataSource === "revenue_nd"
            ? "nd_reporting"
            : "zp_reporting";
      throw new RevenueUnreachableError(db, err);
    }
    throw new QueryExecutionError(dataSource, err);
  }
}
