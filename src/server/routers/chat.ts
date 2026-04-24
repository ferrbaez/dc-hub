import {
  AnalyticsError,
  type SqlPlan,
  type TokenUsage,
  asPlan,
  generateAnalysis,
  generateFollowupPlan,
  generatePlan,
  runPlan,
} from "@/lib/analytics/ask";
import { executeQuery } from "@/lib/analytics/executor";
import {
  SqlValidationError,
  validateScadaTimeFilter,
  validateSelectOnly,
} from "@/lib/analytics/sql-validator";
import { AnthropicConfigError } from "@/lib/anthropic";
import { getLocalDb } from "@/lib/db/local";
import { chatConversations, chatMessages } from "@/schema/local";
import { protectedProcedure, router } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

function toBigint(id: string): bigint {
  try {
    return BigInt(id);
  } catch {
    throw new TRPCError({ code: "BAD_REQUEST", message: `invalid id: ${id}` });
  }
}

function mapAnalyticsErrorToTrpc(err: unknown): never {
  if (err instanceof AnthropicConfigError) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: err.message });
  }
  if (err instanceof AnalyticsError) {
    throw new TRPCError({
      code:
        err.code === "TIMEOUT"
          ? "TIMEOUT"
          : err.code === "EXECUTION_ERROR"
            ? "INTERNAL_SERVER_ERROR"
            : "BAD_REQUEST",
      message: `${err.code}: ${err.message}`,
    });
  }
  throw err;
}

/** Find and assert ownership of a conversation. */
async function loadConversation(userId: bigint, conversationId: bigint) {
  const db = getLocalDb();
  const [conv] = await db
    .select()
    .from(chatConversations)
    .where(and(eq(chatConversations.id, conversationId), eq(chatConversations.userId, userId)))
    .limit(1);
  if (!conv) throw new TRPCError({ code: "NOT_FOUND" });
  return conv;
}

/** Find a message + assert ownership via its conversation. */
async function loadMessage(userId: bigint, messageId: bigint) {
  const db = getLocalDb();
  const rows = await db
    .select({ message: chatMessages, conversation: chatConversations })
    .from(chatMessages)
    .innerJoin(chatConversations, eq(chatMessages.conversationId, chatConversations.id))
    .where(and(eq(chatMessages.id, messageId), eq(chatConversations.userId, userId)))
    .limit(1);
  if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
  return rows[0];
}

function touchConversation(conversationId: bigint) {
  return getLocalDb()
    .update(chatConversations)
    .set({ updatedAt: new Date() })
    .where(eq(chatConversations.id, conversationId));
}

export const chatRouter = router({
  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = getLocalDb();
      const userId = toBigint(ctx.session.user.id);
      const rows = await db
        .select({
          id: chatConversations.id,
          title: chatConversations.title,
          createdAt: chatConversations.createdAt,
          updatedAt: chatConversations.updatedAt,
        })
        .from(chatConversations)
        .where(eq(chatConversations.userId, userId))
        .orderBy(desc(chatConversations.updatedAt))
        .limit(100);
      return rows.map((r) => ({ ...r, id: r.id.toString() }));
    }),

    get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
      const db = getLocalDb();
      const userId = toBigint(ctx.session.user.id);
      const convId = toBigint(input.id);

      const conv = await loadConversation(userId, convId);
      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, convId))
        .orderBy(chatMessages.createdAt);

      return {
        conversation: { ...conv, id: conv.id.toString(), userId: conv.userId.toString() },
        messages: messages.map((m) => ({
          ...m,
          id: m.id.toString(),
          conversationId: m.conversationId.toString(),
        })),
      };
    }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const db = getLocalDb();
        const userId = toBigint(ctx.session.user.id);
        const convId = toBigint(input.id);
        await db
          .delete(chatConversations)
          .where(and(eq(chatConversations.id, convId), eq(chatConversations.userId, userId)));
        return { ok: true };
      }),
  }),

  /**
   * Ask a question: generate SQL + execute. Does NOT generate analysis
   * automatically (call `analyze` on the resulting message if you want it).
   */
  ask: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().optional(),
        question: z.string().min(1).max(4000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getLocalDb();
      const userId = toBigint(ctx.session.user.id);

      // Resolve / create conversation + build history
      let conversationId: bigint;
      const history: Array<{ role: "user" | "assistant"; content: string }> = [];

      if (input.conversationId) {
        const conv = await loadConversation(userId, toBigint(input.conversationId));
        conversationId = conv.id;
        const prior = await db
          .select({ role: chatMessages.role, content: chatMessages.content })
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, conversationId))
          .orderBy(chatMessages.createdAt)
          .limit(20);
        for (const m of prior) {
          if (m.content.length === 0) continue;
          history.push({ role: m.role === "assistant" ? "assistant" : "user", content: m.content });
        }
      } else {
        const title =
          input.question.length > 80 ? `${input.question.slice(0, 77)}...` : input.question;
        const [created] = await db
          .insert(chatConversations)
          .values({ userId, title })
          .returning({ id: chatConversations.id });
        if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        conversationId = created.id;
      }

      // Persist user question
      await db.insert(chatMessages).values({
        conversationId,
        role: "user",
        content: input.question,
      });

      try {
        const { result: planResult, usage: planUsage } = await generatePlan(input.question, {
          history,
        });

        // Clarification branch — no SQL executed, message holds the question + candidates
        if (planResult.action === "clarify") {
          const [stored] = await db
            .insert(chatMessages)
            .values({
              conversationId,
              role: "assistant",
              content: planResult.clarification ?? "",
              rationale: planResult.rationale,
              metadata: { kind: "clarification", candidates: planResult.candidates ?? [] },
              inputTokens: planUsage.inputTokens,
              outputTokens: planUsage.outputTokens,
              cacheReadTokens: planUsage.cacheReadTokens,
              cacheCreationTokens: planUsage.cacheCreationTokens,
            })
            .returning({ id: chatMessages.id });
          await touchConversation(conversationId);
          return {
            conversationId: conversationId.toString(),
            messageId: stored?.id.toString() ?? null,
            kind: "clarification" as const,
            clarification: planResult.clarification ?? "",
            candidates: planResult.candidates ?? [],
            rationale: planResult.rationale,
            usage: planUsage,
          };
        }

        // Execute branch — save as DRAFT (SQL only, no execution).
        // User reviews the SQL and clicks "Ejecutar" to run it via `runSql`.
        // Two-step flow: (1) Claude plans → (2) user confirms & executes.
        const plan = asPlan(planResult);

        const [stored] = await db
          .insert(chatMessages)
          .values({
            conversationId,
            role: "assistant",
            content: "",
            sqlGenerated: plan.sql,
            dataSource: plan.data_source,
            rationale: plan.rationale,
            // resultRows/resultColumns/rowCount/durationMs intentionally null — draft
            inputTokens: planUsage.inputTokens,
            outputTokens: planUsage.outputTokens,
            cacheReadTokens: planUsage.cacheReadTokens,
            cacheCreationTokens: planUsage.cacheCreationTokens,
          })
          .returning({ id: chatMessages.id });

        await touchConversation(conversationId);

        return {
          conversationId: conversationId.toString(),
          messageId: stored?.id.toString() ?? null,
          kind: "draft" as const,
          plan,
          usage: planUsage,
        };
      } catch (err) {
        const code = err instanceof AnalyticsError ? err.code : "UNKNOWN";
        const message = err instanceof Error ? err.message : String(err);
        await db.insert(chatMessages).values({
          conversationId,
          role: "assistant",
          content: "",
          errorCode: code,
          errorMessage: message,
        });
        mapAnalyticsErrorToTrpc(err);
      }
    }),

  /**
   * Lazy narrative analysis of an existing message's results. Cheap: no
   * thinking, effort=low.
   */
  analyze: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getLocalDb();
      const userId = toBigint(ctx.session.user.id);
      const msgId = toBigint(input.messageId);

      const { message } = await loadMessage(userId, msgId);
      if (!message.sqlGenerated || !message.resultRows || !message.resultColumns) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ese mensaje no tiene resultados ejecutados para analizar",
        });
      }
      if (message.content && message.content.length > 0) {
        // Already analyzed — return existing
        return { analysis: message.content, cached: true };
      }

      // Find the user's question (the user message immediately before this one)
      const priorUser = await db
        .select()
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.conversationId, message.conversationId),
            eq(chatMessages.role, "user"),
          ),
        )
        .orderBy(desc(chatMessages.createdAt))
        .limit(20);
      const question =
        priorUser.find((m) => m.createdAt < message.createdAt)?.content ?? "(pregunta desconocida)";

      const plan: SqlPlan = {
        data_source: (message.dataSource ?? "ics") as SqlPlan["data_source"],
        sql: message.sqlGenerated,
        rationale: message.rationale ?? "",
      };
      const resultShape = {
        columns: message.resultColumns as string[],
        rows: message.resultRows as Record<string, unknown>[],
        rowCount: message.rowCount ?? 0,
        durationMs: message.durationMs ?? 0,
        truncated: false,
      };

      try {
        const { analysis, usage } = await generateAnalysis(question, plan, resultShape);
        await db
          .update(chatMessages)
          .set({
            content: analysis,
            inputTokens: (message.inputTokens ?? 0) + usage.inputTokens,
            outputTokens: (message.outputTokens ?? 0) + usage.outputTokens,
            cacheReadTokens: (message.cacheReadTokens ?? 0) + usage.cacheReadTokens,
            cacheCreationTokens: (message.cacheCreationTokens ?? 0) + usage.cacheCreationTokens,
          })
          .where(eq(chatMessages.id, msgId));
        await touchConversation(message.conversationId);
        return { analysis, cached: false };
      } catch (err) {
        mapAnalyticsErrorToTrpc(err);
      }
    }),

  /**
   * Generate a deeper, more analytical follow-up SQL based on a prior
   * message's SQL + result. Returns the new plan as a DRAFT message
   * (sqlGenerated filled, resultRows null) — the user executes it via
   * `runSql` when ready.
   */
  followup: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getLocalDb();
      const userId = toBigint(ctx.session.user.id);
      const msgId = toBigint(input.messageId);

      const { message } = await loadMessage(userId, msgId);
      if (!message.sqlGenerated || !message.resultColumns || !message.resultRows) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Primero ejecutá una consulta antes de pedir un follow-up",
        });
      }

      // Prior user question
      const priorMsgs = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, message.conversationId))
        .orderBy(chatMessages.createdAt);
      const priorUserQuestion =
        [...priorMsgs].reverse().find((m) => m.role === "user" && m.createdAt < message.createdAt)
          ?.content ?? "(pregunta anterior)";

      const priorPlan: SqlPlan = {
        data_source: (message.dataSource ?? "ics") as SqlPlan["data_source"],
        sql: message.sqlGenerated,
        rationale: message.rationale ?? "",
      };
      const priorResult = {
        columns: message.resultColumns as string[],
        rows: message.resultRows as Record<string, unknown>[],
        rowCount: message.rowCount ?? 0,
        durationMs: message.durationMs ?? 0,
        truncated: false,
      };

      try {
        const { result: planResult, usage } = await generateFollowupPlan(
          priorUserQuestion,
          priorPlan,
          priorResult,
        );

        // Synthetic user message so the turn sequence stays readable
        await db.insert(chatMessages).values({
          conversationId: message.conversationId,
          role: "user",
          content: "Consulta complementaria más analítica",
        });

        // Follow-up can also return a clarification if ambiguous
        if (planResult.action === "clarify") {
          const [stored] = await db
            .insert(chatMessages)
            .values({
              conversationId: message.conversationId,
              role: "assistant",
              content: planResult.clarification ?? "",
              rationale: planResult.rationale,
              metadata: { kind: "clarification", candidates: planResult.candidates ?? [] },
              inputTokens: usage.inputTokens,
              outputTokens: usage.outputTokens,
              cacheReadTokens: usage.cacheReadTokens,
              cacheCreationTokens: usage.cacheCreationTokens,
            })
            .returning({ id: chatMessages.id });
          await touchConversation(message.conversationId);
          return {
            messageId: stored?.id.toString() ?? null,
            kind: "clarification" as const,
            clarification: planResult.clarification ?? "",
            candidates: planResult.candidates ?? [],
            usage,
          };
        }

        const plan = asPlan(planResult);

        // Draft assistant message — SQL filled, no result
        const [draft] = await db
          .insert(chatMessages)
          .values({
            conversationId: message.conversationId,
            role: "assistant",
            content: "",
            sqlGenerated: plan.sql,
            dataSource: plan.data_source,
            rationale: plan.rationale,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            cacheReadTokens: usage.cacheReadTokens,
            cacheCreationTokens: usage.cacheCreationTokens,
          })
          .returning({ id: chatMessages.id });

        await touchConversation(message.conversationId);
        return {
          messageId: draft?.id.toString() ?? null,
          kind: "execute" as const,
          plan,
          usage,
        };
      } catch (err) {
        mapAnalyticsErrorToTrpc(err);
      }
    }),

  /**
   * Execute (or re-execute) the SQL on a message. If the SQL differs from
   * what's stored, it's updated. Validator runs again every time.
   */
  runSql: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        sql: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getLocalDb();
      const userId = toBigint(ctx.session.user.id);
      const msgId = toBigint(input.messageId);

      const { message } = await loadMessage(userId, msgId);
      const sql = (input.sql ?? message.sqlGenerated ?? "").trim();
      const dataSource = (message.dataSource ?? "ics") as SqlPlan["data_source"];

      if (!sql) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No hay SQL para ejecutar" });
      }

      try {
        validateSelectOnly(sql);
        if (dataSource === "scada") validateScadaTimeFilter(sql);
      } catch (err) {
        if (err instanceof SqlValidationError) {
          await db
            .update(chatMessages)
            .set({
              sqlGenerated: sql,
              errorCode: "SQL_VALIDATION_FAILED",
              errorMessage: err.reason,
              resultRows: null,
              resultColumns: null,
              rowCount: null,
              durationMs: null,
              content: "",
            })
            .where(eq(chatMessages.id, msgId));
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `SQL_VALIDATION_FAILED: ${err.reason}`,
          });
        }
        throw err;
      }

      try {
        const result = await executeQuery(dataSource, sql);
        await db
          .update(chatMessages)
          .set({
            sqlGenerated: sql,
            resultRows: result.rows,
            resultColumns: result.columns,
            rowCount: result.rowCount,
            durationMs: result.durationMs,
            errorCode: null,
            errorMessage: null,
            content: "", // clear any stale analysis
          })
          .where(eq(chatMessages.id, msgId));
        await touchConversation(message.conversationId);
        return { messageId: msgId.toString(), result };
      } catch (err) {
        const code = "EXECUTION_ERROR";
        const errMessage = err instanceof Error ? err.message : String(err);
        await db
          .update(chatMessages)
          .set({
            sqlGenerated: sql,
            errorCode: code,
            errorMessage: errMessage,
            resultRows: null,
            resultColumns: null,
            rowCount: null,
            durationMs: null,
          })
          .where(eq(chatMessages.id, msgId));
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `${code}: ${errMessage}`,
        });
      }
    }),
});

export type { TokenUsage };
