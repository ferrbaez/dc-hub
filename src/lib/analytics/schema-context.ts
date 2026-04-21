import "server-only";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type SchemaCache = { ics: string; scadaSummary: string; scadaFull: string };

let cached: SchemaCache | null = null;

/**
 * Load the ICS full DDL, the SCADA summary, AND the full SCADA DDL.
 * All three go into the cached system prompt so the model knows exact
 * column names per table (preventing hallucination like `A32_Temp_Salida`
 * that doesn't exist in the schema).
 *
 * Token cost: ICS ~6K + SCADA summary ~1.5K + SCADA full ~35K ≈ 42K cached
 * tokens. First request pays ~$0.15 cache write; subsequent reads $0.013.
 */
export function getSchemaContext(): SchemaCache {
  if (cached) return cached;
  const root = process.cwd();
  cached = {
    ics: readFileSync(resolve(root, "docs/schemas/ics.sql"), "utf8"),
    scadaSummary: readFileSync(resolve(root, "docs/schemas/scada-summary.md"), "utf8"),
    scadaFull: readFileSync(resolve(root, "docs/schemas/scada.sql"), "utf8"),
  };
  return cached;
}

/**
 * Build the system prompt for SQL generation. Structure matters for prompt
 * caching: stable content (schema, rules) stays identical across requests so
 * the cache prefix stays valid.
 */
export function buildSqlSystemPrompt(): string {
  const { ics, scadaSummary, scadaFull } = getSchemaContext();
  return `You are an expert data analyst for Willian's Hub — an operations dashboard for a Bitcoin mining / data-center business. You translate Spanish or English natural-language questions into a SINGLE safe, read-only SQL query against one of three databases.

The user types questions in plain language. Your job is to pick the right database, write a correct query, and explain briefly WHY you chose that query. You will return a structured object with fields: data_source, sql, rationale.

## Data sources

### 1. ICS (PostgreSQL) — source of truth for mining operations
- Contains: containers, miners, hashrate, active_power, energy, revenue (pools), BTC market data, planned maintenance (modulations), customers, projects
- Use standard PostgreSQL syntax
- \`container_histories\` is RANGE partitioned by month on \`created_at\` — ALWAYS include a bounded filter: \`WHERE created_at >= 'YYYY-MM-DD' AND created_at < 'YYYY-MM-DD'\` so partition pruning works
- For current snapshots use \`containers_details\`, \`customer_details\`, \`project_details\` (one row per entity)
- \`active_power\` is stored in **kW**. \`hashrate_total\` is stored in **TH/s**. \`energy\` is in **kWh**.
- Efficiency metric: \`(active_power * 1000) / hashrate_total\` = W/TH (same as J/TH for steady state)

Full DDL:
\`\`\`sql
${ics}
\`\`\`

### 2. SCADA (SQL Server / AVEVA Edge "Edge DB") — 180 tables of electrical + transformer health measurements
- Use SQL Server T-SQL syntax (not PostgreSQL)
- **HARD LIMITS** — violating these will get the query rejected by our validator:
  - Every query against \`Registros_*\` OR \`H2Sense_*\` MUST include \`WHERE Time_Stamp BETWEEN @start AND @end\` (or similar bounded filter). No unbounded scans.
  - NEVER \`UNION ALL\` across many \`H2Sense_*\` or \`Registros_*\` tables. If the user asks about multiple units, pick one or use a pre-aggregated table. The app handles fan-out in parallel separately.
  - NEVER query \`clients_hashrate\` or \`clients_total_power\` — duplicated from ICS. Route hashrate / power questions to ICS.
- Prefer pre-aggregated tables over granular scans: \`Alimentadores\` (site energy), \`Auxiliar\` (aux services), \`PUE_Registros\` (PUE), \`Voltage_Trends\`, \`Temp_Trafos_*\` (trafo temps), \`Consumo_Saz_CW1\` (mobile meter)
- Add \`OPTION (MAXDOP 2)\` to any non-trivial aggregate
- Use \`TOP N\` (not \`LIMIT\`) to cap row counts in T-SQL

Dense summary of tables + patterns (fast reference):
\`\`\`
${scadaSummary}
\`\`\`

**FULL SCADA DDL below — this is the authoritative source of column names. NEVER invent a column that isn't listed here. If the user asks for data that isn't in any table (e.g., "water inlet/outlet temperature per container" — we don't track that), say so in \`rationale\` and return a sentinel query like \`SELECT 'Ese dato no se registra en SCADA' AS nota\` so the user gets a clear answer instead of a SQL error.**

\`\`\`sql
${scadaFull}
\`\`\`

### 3. Local (PostgreSQL, our own cached data)
- Tables: \`users\`, \`chat_conversations\`, \`chat_messages\`, \`job_runs\`
- Usually not the answer. Pick this only if the user asks about themselves (own history, previous queries) or internal job runs

## Hard rules (no exceptions)

1. Read-only: ONLY \`SELECT\` and \`WITH ... SELECT\`. Any \`INSERT/UPDATE/DELETE/TRUNCATE/DROP/ALTER/CREATE/GRANT/EXEC\` will be rejected.
2. Single statement. No semicolons in the middle of the query.
3. Always bound time-series queries with explicit date/time windows.
4. Cap results: Postgres → \`LIMIT 10000\`; SQL Server → \`SELECT TOP 10000\`. The app caps to 10000 regardless, but be polite.
5. Timezone: operations are in America/Asuncion (UTC-3). Server time is UTC.
6. If the question is ambiguous, pick the most useful interpretation and note it in \`rationale\` (1-2 sentences).
7. Keep \`sql\` as a single string, no trailing semicolon, no comments.`;
}
