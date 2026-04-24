import { AnalyticsError, type SqlPlan, streamAnalysis } from "@/lib/analytics/ask";
import { AnthropicConfigError } from "@/lib/anthropic";
import { auth } from "@/lib/auth";
import { getLocalDb } from "@/lib/db/local";
import { chatConversations, chatMessages } from "@/schema/local";
import { and, desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const { messageId } = await params;
  let msgId: bigint;
  let userId: bigint;
  try {
    msgId = BigInt(messageId);
    userId = BigInt(session.user.id);
  } catch {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const db = getLocalDb();
  const rows = await db
    .select({ message: chatMessages, conversation: chatConversations })
    .from(chatMessages)
    .innerJoin(chatConversations, eq(chatMessages.conversationId, chatConversations.id))
    .where(and(eq(chatMessages.id, msgId), eq(chatConversations.userId, userId)))
    .limit(1);

  const entry = rows[0];
  if (!entry) return new NextResponse("Not Found", { status: 404 });
  const { message } = entry;

  if (!message.sqlGenerated || !message.resultRows || !message.resultColumns) {
    return new NextResponse("Ese mensaje no tiene resultados ejecutados para analizar", {
      status: 400,
    });
  }

  // Already analyzed — return cached as a single non-streamed chunk
  if (message.content && message.content.length > 0) {
    return new NextResponse(message.content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Cached": "1",
      },
    });
  }

  // Find the user's question (the user message immediately before this one)
  const priorUserMsgs = await db
    .select()
    .from(chatMessages)
    .where(
      and(eq(chatMessages.conversationId, message.conversationId), eq(chatMessages.role, "user")),
    )
    .orderBy(desc(chatMessages.createdAt))
    .limit(20);
  const question =
    priorUserMsgs.find((m) => m.createdAt < message.createdAt)?.content ?? "(pregunta desconocida)";

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

  let streamStarted: {
    deltas: AsyncIterable<string>;
    final: Promise<{
      analysis: string;
      usage: {
        inputTokens: number;
        outputTokens: number;
        cacheReadTokens: number;
        cacheCreationTokens: number;
      };
    }>;
  };
  try {
    streamStarted = await streamAnalysis(question, plan, resultShape);
  } catch (err) {
    if (err instanceof AnthropicConfigError) {
      return new NextResponse(`PRECONDITION_FAILED: ${err.message}`, { status: 412 });
    }
    if (err instanceof AnalyticsError) {
      return new NextResponse(`${err.code}: ${err.message}`, { status: 500 });
    }
    const errMessage = err instanceof Error ? err.message : String(err);
    return new NextResponse(`ERROR: ${errMessage}`, { status: 500 });
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamStarted.deltas) {
          controller.enqueue(encoder.encode(chunk));
        }
        const { analysis, usage } = await streamStarted.final;
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
        await db
          .update(chatConversations)
          .set({ updatedAt: new Date() })
          .where(eq(chatConversations.id, message.conversationId));
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`\n\n[[STREAM_ERROR]] ${errMessage}`));
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
