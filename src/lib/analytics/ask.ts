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

// API-enforced JSON schema. Discriminated by `action`:
//   - "execute"   → data_source + sql + rationale required, app runs it
//   - "clarify"   → clarification + candidates + rationale required, user picks
const SQL_PLAN_JSON_SCHEMA = {
  type: "object" as const,
  properties: {
    action: {
      type: "string" as const,
      enum: ["execute", "clarify"] as const,
      description:
        "'execute' when you have an unambiguous SQL query. 'clarify' when the user's reference to an entity is ambiguous, data doesn't exist, or you need more info.",
    },
    data_source: {
      type: "string" as const,
      enum: ["ics", "scada", "local", "revenue_mara", "revenue_nd", "revenue_zp"] as const,
      description:
        "Only for action=execute. 'ics' mining ops source of truth, 'scada' electrical/transformer sensors, 'local' internal (users, chat, tariffs, machine_configs), 'revenue_mara' MARATHON revenue portal (projects JV2, JV3, OCEAN_MARA_GENERAL), 'revenue_nd' NORTHERN DATA (JV5), 'revenue_zp' ZPJV (JV1-1, JV1-2, JV4). Use revenue_* for daily/per-minute energy_consumption or pools_data queries.",
    },
    sql: {
      type: "string" as const,
      description:
        "Only for action=execute. Single SELECT or WITH query. PostgreSQL for ICS/local, T-SQL for SCADA. No trailing semicolon, no comments, no middle-of-statement semicolons.",
    },
    rationale: {
      type: "string" as const,
      description:
        "Always required. 1-2 sentences: why this query answers the question, OR why the request is ambiguous.",
    },
    clarification: {
      type: "string" as const,
      description:
        "Only for action=clarify. A short, friendly question in Spanish rioplatense asking the user to pick between canonical names or provide more info.",
    },
    candidates: {
      type: "array" as const,
      items: { type: "string" as const },
      description:
        "Only for action=clarify. Up to 6 canonical names (or short options) the UI will render as clickable buttons.",
    },
  },
  required: ["action", "rationale"],
  additionalProperties: false,
};

const sqlPlanSchema = z
  .object({
    action: z.enum(["execute", "clarify"]),
    data_source: z
      .enum(["ics", "scada", "local", "revenue_mara", "revenue_nd", "revenue_zp"])
      .optional(),
    sql: z.string().optional(),
    rationale: z.string(),
    clarification: z.string().optional(),
    candidates: z.array(z.string()).optional(),
  })
  .refine(
    (d) =>
      d.action === "clarify"
        ? !!d.clarification && d.clarification.length > 0
        : !!d.data_source && !!d.sql && d.sql.length > 0,
    { message: "missing required fields for action" },
  );

export type PlanResult = z.infer<typeof sqlPlanSchema>;

/** Narrow to an executable plan. Caller must check action first. */
export type SqlPlan = {
  data_source: "ics" | "scada" | "local" | "revenue_mara" | "revenue_nd" | "revenue_zp";
  sql: string;
  rationale: string;
};

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

function parseJsonPlan(raw: string): PlanResult {
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
      `schema mismatch: ${parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ")} — raw: ${JSON.stringify(json).slice(0, 500)}`,
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
 * Generate a plan from a natural-language question. Returns either an
 * executable SQL plan OR a clarification request (discriminated by `action`).
 */
export async function generatePlan(
  question: string,
  opts: { history?: ConversationTurn[] } = {},
): Promise<{ result: PlanResult; usage: TokenUsage }> {
  const client = getAnthropicClient();
  const system = await buildSqlSystemPrompt();
  const messages: Anthropic.MessageParam[] = (opts.history ?? []).map((h) => ({
    role: h.role,
    content: h.content,
  }));
  messages.push({ role: "user", content: question });

  try {
    const response = await client.messages.create({
      model: MODELS.sql,
      max_tokens: 8192,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages,
      output_config: {
        effort: "medium",
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
    return { result: parseJsonPlan(textBlock.text), usage: usageFromResponse(response.usage) };
  } catch (err) {
    handleAnthropicError(err);
  }
}

export function asPlan(result: PlanResult): SqlPlan {
  if (result.action !== "execute" || !result.data_source || !result.sql) {
    throw new AnalyticsError("PARSE_ERROR", "result is not an executable plan");
  }
  return {
    data_source: result.data_source,
    sql: result.sql,
    rationale: result.rationale,
  };
}

/** Run the planned SQL against the right DB. */
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

const ANALYSIS_SYSTEM =
  "Sos un analista de datos para una empresa de minería de Bitcoin / infraestructura. Escribí un análisis breve (2-4 oraciones) en español rioplatense sobre qué dicen los resultados. Podés usar markdown: **negritas** para números clave, y listas con guiones si ayuda. Mencioná valores notables, promedios, picos o anomalías. NO describas el SQL. Si hay 0 filas decilo explícitamente.";

function buildAnalysisUserPrompt(question: string, plan: SqlPlan, result: ExecutionResult): string {
  const preview = result.rows.slice(0, 25);
  const extra =
    result.rows.length > preview.length
      ? ` (+ ${result.rows.length - preview.length} filas no mostradas)`
      : "";
  return `Pregunta: ${question}

Base de datos: ${plan.data_source.toUpperCase()}
SQL ejecutado:
\`\`\`sql
${plan.sql}
\`\`\`

Resultados (${result.rowCount} filas${result.truncated ? ", truncadas a 10000" : ""}):
${preview.length > 0 ? JSON.stringify(preview, null, 2) : "(sin filas)"}${extra}

Escribí el análisis:`;
}

/**
 * Fast narrative analysis of already-computed results. Effort=low, no thinking.
 */
export async function generateAnalysis(
  question: string,
  plan: SqlPlan,
  result: ExecutionResult,
): Promise<{ analysis: string; usage: TokenUsage }> {
  const client = getAnthropicClient();

  try {
    const response = await client.messages.create({
      model: MODELS.analysis,
      max_tokens: 1024,
      output_config: { effort: "low" } as Anthropic.Messages.MessageCreateParams["output_config"],
      system: ANALYSIS_SYSTEM,
      messages: [{ role: "user", content: buildAnalysisUserPrompt(question, plan, result) }],
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
 * Streaming variant. Returns an async iterator of text deltas plus a promise
 * that resolves with the final text + usage when the stream ends.
 */
export async function streamAnalysis(
  question: string,
  plan: SqlPlan,
  result: ExecutionResult,
): Promise<{
  deltas: AsyncIterable<string>;
  final: Promise<{ analysis: string; usage: TokenUsage }>;
}> {
  const client = getAnthropicClient();

  const stream = client.messages.stream({
    model: MODELS.analysis,
    max_tokens: 1024,
    output_config: { effort: "low" } as Anthropic.Messages.MessageCreateParams["output_config"],
    system: ANALYSIS_SYSTEM,
    messages: [{ role: "user", content: buildAnalysisUserPrompt(question, plan, result) }],
  });

  async function* deltas() {
    try {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta" &&
          event.delta.text
        ) {
          yield event.delta.text;
        }
      }
    } catch (err) {
      handleAnthropicError(err);
    }
  }

  const final = (async () => {
    const msg = await stream.finalMessage();
    const textBlock = msg.content.find((b) => b.type === "text");
    const analysis =
      textBlock && textBlock.type === "text" ? textBlock.text.trim() : "(sin análisis)";
    return { analysis, usage: usageFromResponse(msg.usage) };
  })();

  return { deltas: deltas(), final };
}

/**
 * Generate a deeper analytical follow-up SQL. Can also return a clarification
 * if the follow-up direction is ambiguous.
 */
export async function generateFollowupPlan(
  priorQuestion: string,
  priorPlan: SqlPlan,
  priorResult: ExecutionResult,
): Promise<{ result: PlanResult; usage: TokenUsage }> {
  const client = getAnthropicClient();
  const system = await buildSqlSystemPrompt();

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

Generá un SEGUNDO query SQL MÁS ANALÍTICO que profundice en estos datos. Buenas continuaciones:
- Agregaciones / agrupamientos nuevos
- Percentiles, desvío estándar, distribuciones
- Tendencias temporales (por hora / día)
- Outliers, top/bottom N con contexto
- Joins con tablas relacionadas
- Comparaciones contra baselines históricos
- Ratios o eficiencias derivadas (W/TH, kWh/m², etc.)

Lo que NO sirve: la misma query con distinto LIMIT, o sólo renombrar columnas.`;

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
    return { result: parseJsonPlan(textBlock.text), usage: usageFromResponse(response.usage) };
  } catch (err) {
    handleAnthropicError(err);
  }
}
