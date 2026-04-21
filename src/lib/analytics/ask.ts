import "server-only";
import { MODELS, getAnthropicClient } from "@/lib/anthropic";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { type DataSource, type ExecutionResult, executeQuery } from "./executor";
import { buildSqlSystemPrompt } from "./schema-context";
import { SqlValidationError, validateScadaTimeFilter, validateSelectOnly } from "./sql-validator";

export class AnalyticsError extends Error {
  constructor(
    public code:
      | "MODEL_ERROR"
      | "PARSE_ERROR"
      | "SQL_VALIDATION_FAILED"
      | "EXECUTION_ERROR"
      | "TIMEOUT",
    message: string,
  ) {
    super(message);
    this.name = "AnalyticsError";
  }
}

// API-enforced JSON schema for SQL plan generation.
const SQL_PLAN_JSON_SCHEMA = {
  type: "object" as const,
  properties: {
    data_source: {
      type: "string" as const,
      enum: ["ics", "scada", "local"] as const,
      description:
        "Which database to query. 'ics' for mining ops (containers, hashrate, revenue, modulations). 'scada' for electrical/transformer sensors (Registros_*, H2Sense_*, Alimentadores). 'local' for our own cached chat / job data.",
    },
    sql: {
      type: "string" as const,
      description:
        "A single SELECT or WITH ... SELECT query. No semicolons in the middle, no comments, no trailing semicolon. PostgreSQL syntax for ICS/local, T-SQL for SCADA.",
    },
    rationale: {
      type: "string" as const,
      description: "One or two sentences explaining why this query answers the user's question.",
    },
  },
  required: ["data_source", "sql", "rationale"],
  additionalProperties: false,
};

const sqlPlanSchema = z.object({
  data_source: z.enum(["ics", "scada", "local"]),
  sql: z.string().min(1),
  rationale: z.string(),
});

export type SqlPlan = z.infer<typeof sqlPlanSchema>;

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
};

type ConversationTurn = { role: "user" | "assistant"; content: string };

export function usageFromResponse(usage: Anthropic.Messages.Usage | undefined): TokenUsage {
  return {
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
    cacheReadTokens: usage?.cache_read_input_tokens ?? 0,
    cacheCreationTokens: usage?.cache_creation_input_tokens ?? 0,
  };
}

function parseJsonPlan(raw: string): SqlPlan {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    throw new AnalyticsError(
      "PARSE_ERROR",
      `invalid JSON: ${(err as Error).message} — raw: ${raw.slice(0, 300)}`,
    );
  }
  const parsed = sqlPlanSchema.safeParse(json);
  if (!parsed.success) {
    throw new AnalyticsError(
      "PARSE_ERROR",
      `schema mismatch: ${parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ")}`,
    );
  }
  return parsed.data;
}

function handleAnthropicError(err: unknown): never {
  if (err instanceof AnalyticsError) throw err;
  if (err instanceof Anthropic.RateLimitError) {
    throw new AnalyticsError("TIMEOUT", "Anthropic rate limit — retry in a moment");
  }
  if (err instanceof Anthropic.APIError) {
    throw new AnalyticsError("MODEL_ERROR", `Anthropic API error ${err.status}: ${err.message}`);
  }
  throw err;
}

/**
 * Generate a SQL plan from a natural-language question. Single Claude call
 * with adaptive thinking + high effort + schema in cache. No execution.
 */
export async function generatePlan(
  question: string,
  opts: { history?: ConversationTurn[] } = {},
): Promise<{ plan: SqlPlan; usage: TokenUsage }> {
  const client = getAnthropicClient();
  const system = buildSqlSystemPrompt();
  const messages: Anthropic.MessageParam[] = (opts.history ?? []).map((h) => ({
    role: h.role,
    content: h.content,
  }));
  messages.push({ role: "user", content: question });

  try {
    const response = await client.messages.create({
      model: MODELS.sql,
      max_tokens: 16000,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages,
      thinking: { type: "adaptive" },
      output_config: {
        format: { type: "json_schema", schema: SQL_PLAN_JSON_SCHEMA },
      } as Anthropic.Messages.MessageCreateParams["output_config"],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new AnalyticsError(
        "PARSE_ERROR",
        `no text block from model (stop=${response.stop_reason})`,
      );
    }
    return { plan: parseJsonPlan(textBlock.text), usage: usageFromResponse(response.usage) };
  } catch (err) {
    handleAnthropicError(err);
  }
}

/**
 * Run the planned SQL against the right DB. Throws on validation or
 * execution failure. Thin wrapper + SCADA safety.
 */
export async function runPlan(plan: SqlPlan): Promise<ExecutionResult> {
  try {
    validateSelectOnly(plan.sql);
    if (plan.data_source === "scada") validateScadaTimeFilter(plan.sql);
  } catch (err) {
    if (err instanceof SqlValidationError) {
      throw new AnalyticsError("SQL_VALIDATION_FAILED", err.reason);
    }
    throw err;
  }
  return executeQuery(plan.data_source as DataSource, plan.sql);
}

/**
 * Fast, narrative-only analysis of already-computed results. No adaptive
 * thinking; low effort. Designed to be cheap and called on-demand via a
 * "Analizar resultados" button.
 */
export async function generateAnalysis(
  question: string,
  plan: SqlPlan,
  result: ExecutionResult,
): Promise<{ analysis: string; usage: TokenUsage }> {
  const client = getAnthropicClient();
  const preview = result.rows.slice(0, 25);
  const extra =
    result.rows.length > preview.length
      ? ` (+ ${result.rows.length - preview.length} filas no mostradas)`
      : "";

  try {
    const response = await client.messages.create({
      model: MODELS.analysis,
      max_tokens: 1024,
      output_config: { effort: "low" } as Anthropic.Messages.MessageCreateParams["output_config"],
      system:
        "Sos un analista de datos para una empresa de minería de Bitcoin / infraestructura. Escribí un análisis breve (2-4 oraciones) en español rioplatense sobre qué dicen los resultados. Podés usar markdown: **negritas** para números clave, y listas con guiones si ayuda. Mencioná valores notables, promedios, picos o anomalías. NO describas el SQL. Si hay 0 filas decilo explícitamente.",
      messages: [
        {
          role: "user",
          content: `Pregunta: ${question}

Base de datos: ${plan.data_source.toUpperCase()}
SQL ejecutado:
\`\`\`sql
${plan.sql}
\`\`\`

Resultados (${result.rowCount} filas${result.truncated ? ", truncadas a 10000" : ""}):
${preview.length > 0 ? JSON.stringify(preview, null, 2) : "(sin filas)"}${extra}

Escribí el análisis:`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const analysis =
      textBlock && textBlock.type === "text" ? textBlock.text.trim() : "(sin análisis)";
    return { analysis, usage: usageFromResponse(response.usage) };
  } catch (err) {
    handleAnthropicError(err);
  }
}

/**
 * Generate a SECOND, more analytical SQL query based on a previous question
 * and its result. Aggregations, percentiles, trends, outliers, joins — not
 * a trivial variation of the first query. Returns SQL only, NOT executed.
 */
export async function generateFollowupPlan(
  priorQuestion: string,
  priorPlan: SqlPlan,
  priorResult: ExecutionResult,
): Promise<{ plan: SqlPlan; usage: TokenUsage }> {
  const client = getAnthropicClient();
  const system = buildSqlSystemPrompt();

  const preview = priorResult.rows.slice(0, 15);
  const userPrompt = `El usuario hizo esta pregunta:
"${priorQuestion}"

Y recibió este resultado de la base ${priorPlan.data_source.toUpperCase()}:

SQL original:
\`\`\`sql
${priorPlan.sql}
\`\`\`

Columnas: ${priorResult.columns.join(", ")}
Filas: ${priorResult.rowCount}${priorResult.truncated ? " (truncadas a 10000)" : ""}

Muestra de filas:
${preview.length > 0 ? JSON.stringify(preview, null, 2) : "(sin filas)"}

---

Generá un SEGUNDO query SQL MÁS ANALÍTICO que profundice en estos datos. Ejemplos de buenas continuaciones:
- Agregaciones o agrupamientos que no aparecen en el primer query
- Percentiles, desvío estándar, distribuciones
- Tendencias temporales (por hora / día)
- Outliers o top/bottom N con contexto
- Joins con tablas relacionadas (ej: desde containers_details a projects o transformers)
- Comparaciones contra baselines históricos
- Ratios o eficiencias derivadas (W/TH, kWh/m², etc.)

Lo que NO sirve: la misma query con un LIMIT diferente, o sólo renombrar columnas. Tiene que agregar información nueva.

Podés usar la misma base (${priorPlan.data_source}) u otra si tiene más sentido.`;

  try {
    const response = await client.messages.create({
      model: MODELS.sql,
      max_tokens: 16000,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userPrompt }],
      thinking: { type: "adaptive" },
      output_config: {
        format: { type: "json_schema", schema: SQL_PLAN_JSON_SCHEMA },
      } as Anthropic.Messages.MessageCreateParams["output_config"],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new AnalyticsError(
        "PARSE_ERROR",
        `no text block from model (stop=${response.stop_reason})`,
      );
    }
    return { plan: parseJsonPlan(textBlock.text), usage: usageFromResponse(response.usage) };
  } catch (err) {
    handleAnthropicError(err);
  }
}
