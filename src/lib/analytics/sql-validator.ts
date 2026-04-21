export class SqlValidationError extends Error {
  readonly code = "SQL_VALIDATION_FAILED";
  constructor(public reason: string) {
    super(`SQL rejected: ${reason}`);
    this.name = "SqlValidationError";
  }
}

// Operations we never allow. Case-insensitive, must be standalone tokens.
const FORBIDDEN_KEYWORDS = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "TRUNCATE",
  "DROP",
  "ALTER",
  "CREATE",
  "GRANT",
  "REVOKE",
  "EXEC",
  "EXECUTE",
  "CALL",
  "MERGE",
  "REPLACE",
  "COPY",
  "VACUUM",
  "REINDEX",
  "ATTACH",
  "DETACH",
];

/**
 * Strip SQL comments and string literals so keyword scans don't false-positive
 * on text inside a string or comment. Preserves overall length-ish for error
 * reporting.
 */
function sanitize(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, " ") // line comments
    .replace(/\/\*[\s\S]*?\*\//g, " ") // block comments
    .replace(/'(?:[^'\\]|\\.|'')*'/g, "''") // single-quoted strings
    .replace(/"(?:[^"\\]|\\.)*"/g, '""'); // double-quoted identifiers
}

/**
 * Core safety check: must be a single SELECT (or WITH ... SELECT), no forbidden
 * keywords, no multi-statement batch.
 */
export function validateSelectOnly(sql: string): void {
  const trimmed = sql.trim();
  if (!trimmed) throw new SqlValidationError("empty query");

  const sanitized = sanitize(trimmed).trim();

  if (!/^\s*(SELECT|WITH)\b/i.test(sanitized)) {
    throw new SqlValidationError("must start with SELECT or WITH");
  }

  // Allow a single trailing semicolon; forbid anything else after.
  const body = sanitized.replace(/;\s*$/, "").trim();
  if (body.includes(";")) {
    throw new SqlValidationError("multiple statements not allowed");
  }

  const upper = body.toUpperCase();
  for (const kw of FORBIDDEN_KEYWORDS) {
    if (new RegExp(`\\b${kw}\\b`).test(upper)) {
      throw new SqlValidationError(`forbidden keyword: ${kw}`);
    }
  }
}

/**
 * SCADA-specific: granular tables (Registros_*, H2Sense_*) must have a
 * Time_Stamp filter. Otherwise a single query could lock AVEVA.
 */
export function validateScadaTimeFilter(sql: string): void {
  const sanitized = sanitize(sql);
  const hitsGranular = /\b(REGISTROS_|H2SENSE_)\w+/i.test(sanitized);
  if (!hitsGranular) return;

  const upper = sanitized.toUpperCase();
  // Accept Time_Stamp >= / > / BETWEEN as a filter signal.
  const hasTimeFilter = /TIME_STAMP\s*(>=|>|BETWEEN|\bIN\b)/i.test(upper);
  if (!hasTimeFilter) {
    throw new SqlValidationError(
      "SCADA granular tables (Registros_*, H2Sense_*) require a Time_Stamp filter — see DATA_SOURCES.md",
    );
  }
}
