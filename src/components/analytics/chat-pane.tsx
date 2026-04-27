"use client";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2, Send, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AssistantMessage, type MessageRow, UserMessage } from "./message";

const EXAMPLES = [
  "¿Cuántos containers tienen miners hashing ahora?",
  "Top 10 containers por eficiencia (W/TH) en este momento",
  "Consumo total del sitio por hora en las últimas 24 horas",
  "Modulaciones de los últimos 30 días ordenadas por energía perdida",
];

/**
 * Pending is keyed by the conversation the user submitted against. That way,
 * navigating to a different chat hides the spinner here (it belongs to another
 * conversation) but it stays in memory and re-appears if the user returns to
 * the originating conversation before the mutation resolves.
 * `conversationId: null` = the user submitted from the "new conversation"
 * empty state.
 */
type AskPending = { conversationId: string | null; question: string } | null;

function EmptyState({
  onExampleClick,
  disabled,
}: {
  onExampleClick: (q: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-penguin-violet to-penguin-violet/70 text-white shadow-lg shadow-penguin-violet/30">
        <Sparkles className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-content">
        Consultá tus datos en lenguaje natural
      </h2>
      <p className="mt-1 max-w-md text-sm text-content-muted">
        Hacé una pregunta sobre ICS (mining) o SCADA (eléctrico / trafos). La IA genera el SQL, lo
        ejecuta de forma segura (solo lectura) y te devuelve la tabla. El análisis narrativo es
        opt-in.
      </p>
      <div className="mt-8 grid w-full max-w-2xl gap-2">
        {EXAMPLES.map((q) => (
          <button
            key={q}
            type="button"
            disabled={disabled}
            onClick={() => onExampleClick(q)}
            className="rounded-xl border border-surface-border bg-surface px-4 py-3 text-left text-sm text-content shadow-sm transition-all hover:border-penguin-violet/40 hover:bg-penguin-violet/5 hover:shadow-md disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function ErrorBanner({ code, message }: { code: string; message: string }) {
  const humanTitle =
    code === "PRECONDITION_FAILED" || code === "ANTHROPIC_CONFIG_MISSING"
      ? "Configuración faltante"
      : code === "SERVICE_UNAVAILABLE"
        ? "Fuente de datos no disponible"
        : code === "TIMEOUT"
          ? "Timeout / rate limit"
          : "Error al procesar la pregunta";
  return (
    <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/40 dark:bg-rose-950/30">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
      <div className="text-sm">
        <div className="font-medium text-rose-900 dark:text-rose-200">{humanTitle}</div>
        <div className="mt-0.5 text-xs text-rose-700 dark:text-rose-300">{message}</div>
      </div>
    </div>
  );
}

export function ChatPane({ conversationId }: { conversationId: string | null }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<AskPending>(null);
  const [submitError, setSubmitError] = useState<{ code: string; message: string } | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [streamingAnalysisForId, setStreamingAnalysisForId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [followingUpId, setFollowingUpId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = trpc.core.chat.conversations.get.useQuery(
    { id: conversationId ?? "" },
    { enabled: !!conversationId },
  );

  const invalidate = () => {
    if (conversationId) {
      utils.core.chat.conversations.get.invalidate({ id: conversationId });
      utils.core.chat.conversations.list.invalidate();
    }
  };

  const ask = trpc.core.chat.ask.useMutation({
    onSuccess: (res) => {
      setPending(null);
      setSubmitError(null);
      if (!conversationId) {
        router.push(`/analytics?c=${res.conversationId}`);
        router.refresh();
      } else {
        invalidate();
      }
    },
    onError: (err) => {
      setPending(null);
      setSubmitError({ code: err.data?.code ?? "UNKNOWN", message: err.message });
      invalidate();
    },
  });

  async function streamAnalyze(messageId: string) {
    setAnalyzingId(messageId);
    setStreamingAnalysisForId(messageId);
    setStreamingText("");
    setSubmitError(null);

    try {
      const res = await fetch(`/api/analytics/stream-analysis/${messageId}`, {
        method: "POST",
      });
      if (!res.ok) {
        const text = await res.text();
        const [code, ...rest] = text.split(": ");
        throw new Error(rest.join(": ") || text, { cause: { code } });
      }
      if (!res.body) throw new Error("sin respuesta del servidor");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        acc += chunk;
        setStreamingText(acc);
      }
    } catch (err) {
      const cause = (err as { cause?: { code?: string } }).cause;
      setSubmitError({
        code: cause?.code ?? "UNKNOWN",
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setAnalyzingId(null);
      setStreamingAnalysisForId(null);
      setStreamingText("");
      invalidate();
    }
  }

  const followupMut = trpc.core.chat.followup.useMutation({
    onSuccess: () => {
      setFollowingUpId(null);
      invalidate();
    },
    onError: (err) => {
      setFollowingUpId(null);
      setSubmitError({ code: err.data?.code ?? "UNKNOWN", message: err.message });
    },
  });

  const runMut = trpc.core.chat.runSql.useMutation({
    onSuccess: () => {
      setRunningId(null);
      invalidate();
    },
    onError: (err) => {
      setRunningId(null);
      setSubmitError({ code: err.data?.code ?? "UNKNOWN", message: err.message });
      invalidate();
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation.data?.messages.length, pending]);

  function submit(question: string) {
    const trimmed = question.trim();
    if (!trimmed || ask.isPending) return;
    setInput("");
    setSubmitError(null);
    setPending({ conversationId: conversationId ?? null, question: trimmed });
    ask.mutate({ conversationId: conversationId ?? undefined, question: trimmed });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  }

  const messages = (conversation.data?.messages ?? []) as unknown as MessageRow[];
  const isLoadingConversation = !!conversationId && conversation.isLoading;

  // A pending request is visible only in the conversation it belongs to.
  // Switching away keeps pending alive in memory but hides the spinner here.
  const pendingBelongsHere = !!pending && pending.conversationId === (conversationId ?? null);
  const showEmpty = !conversationId && messages.length === 0 && !pendingBelongsHere;

  // Dedup guard: the server inserts the user message into the DB before
  // Claude responds, so a window-focus refetch mid-mutation can return that
  // user message while we're still showing the optimistic `pending` one.
  // If the last message already matches, skip the optimistic render.
  const lastMessage = messages[messages.length - 1];
  const serverAlreadyHasPending =
    pendingBelongsHere && lastMessage?.role === "user" && lastMessage.content === pending.question;

  const actions = {
    onAnalyze: (messageId: string) => {
      streamAnalyze(messageId);
    },
    onFollowup: (messageId: string) => {
      setFollowingUpId(messageId);
      setSubmitError(null);
      followupMut.mutate({ messageId });
    },
    onRun: (messageId: string) => {
      setRunningId(messageId);
      setSubmitError(null);
      runMut.mutate({ messageId });
    },
    // User picked a candidate from a clarification — send it as a new question.
    // Claude will see the prior clarification in history and map it to real SQL.
    onClarify: (answer: string) => submit(answer),
    analyzingId,
    followingUpId,
    runningId,
    streamingAnalysisForId,
    streamingText,
  };

  return (
    <div className="flex h-full min-w-0 flex-col bg-surface-soft">
      <div className="flex-1 overflow-y-auto">
        {isLoadingConversation ? (
          <div className="flex h-full items-center justify-center text-sm text-content-muted">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Cargando conversación...
          </div>
        ) : showEmpty ? (
          <EmptyState onExampleClick={submit} disabled={ask.isPending} />
        ) : (
          <div className="mx-auto max-w-4xl space-y-6 p-6">
            {messages.map((m) =>
              m.role === "user" ? (
                <UserMessage key={m.id} content={m.content} />
              ) : (
                <AssistantMessage key={m.id} message={m} actions={actions} />
              ),
            )}

            {pendingBelongsHere && pending && (
              <>
                {!serverAlreadyHasPending && <UserMessage content={pending.question} />}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-penguin-violet to-penguin-violet/70 text-white shadow-sm shadow-penguin-violet/30">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  </div>
                  <div className="flex flex-col gap-0.5 pt-1 text-sm text-content-muted">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generando SQL...
                    </div>
                    <div className="pl-5 text-[10px] text-content-muted">
                      Después lo podés revisar y ejecutar con el botón Ejecutar.
                    </div>
                  </div>
                </div>
              </>
            )}

            {submitError && !pending && (
              <ErrorBanner code={submitError.code} message={submitError.message} />
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-surface-border bg-surface px-4 py-3">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end gap-2 rounded-lg border border-surface-border bg-surface p-2 focus-within:border-penguin-violet focus-within:ring-1 focus-within:ring-penguin-violet/40">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Escribí tu pregunta... (Enter envía, Shift+Enter salto de línea)"
              rows={1}
              disabled={ask.isPending}
              className="max-h-48 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-content placeholder:text-content-muted focus:outline-none disabled:opacity-60"
              style={{ minHeight: "28px" }}
            />
            <button
              type="button"
              onClick={() => submit(input)}
              disabled={ask.isPending || !input.trim()}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-all",
                ask.isPending || !input.trim()
                  ? "bg-surface-muted text-content-muted"
                  : "bg-penguin-violet text-white shadow-sm shadow-penguin-violet/30 hover:bg-penguin-violet/90 hover:shadow-md",
              )}
            >
              {ask.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar
            </button>
          </div>
          <p className="mt-1.5 px-1 text-[10px] text-content-muted">
            Solo queries de lectura · Sonnet 4.6 · SQL validado antes de ejecutarse · Análisis y
            follow-up son opt-in · El SQL aparece como draft para que lo revises antes de ejecutar
          </p>
        </div>
      </div>
    </div>
  );
}
