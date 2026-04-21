import "server-only";
import { IcsUnreachableError, getIcsPool, isIcsUnreachableError } from "@/lib/db/ics";
import { getLocalPool } from "@/lib/db/local";
import { ScadaUnreachableError, getScadaRequest, isScadaUnreachableError } from "@/lib/db/scada";

export type DataSource = "ics" | "scada" | "local";

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

/**
 * JSON-serialize a row, converting pg/mssql runtime types (Date, bigint, Buffer)
 * to primitives the frontend can render. Drizzle/pg/mssql return Dates for
 * timestamps, strings for numerics/bigints (pg) or numbers (mssql).
 */
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

export async function executeQuery(
  dataSource: DataSource,
  sql: string,
  opts: { timeoutMs?: number; maxRows?: number } = {},
): Promise<ExecutionResult> {
  const start = Date.now();
  const maxRows = opts.maxRows ?? DEFAULT_MAX_ROWS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  try {
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
    // Re-throw our typed unreachable errors (the tRPC middleware maps them)
    if (err instanceof IcsUnreachableError || err instanceof ScadaUnreachableError) {
      throw err;
    }
    if (isIcsUnreachableError(err)) throw new IcsUnreachableError(err);
    if (isScadaUnreachableError(err)) throw new ScadaUnreachableError(err);
    throw new QueryExecutionError(dataSource, err);
  }
}
