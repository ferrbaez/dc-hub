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

type AskPending = { question: string } | null;

function EmptyState({
  onExampleClick,
  disabled,
}: {
  onExampleClick: (q: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-penguin-obsidian text-penguin-lime shadow-sm">
        <Sparkles className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-penguin-obsidian">
        Consultá tus datos en lenguaje natural
      </h2>
      <p className="mt-1 max-w-md text-sm text-penguin-cool-gray">
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
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm text-penguin-obsidian transition-colors hover:border-penguin-lime/60 hover:bg-penguin-lime/5 disabled:opacity-50"
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
    <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
      <div className="text-sm">
        <div className="font-medium text-rose-900">{humanTitle}</div>
        <div className="mt-0.5 text-xs text-rose-700">{message}</div>
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
  const [followingUpId, setFollowingUpId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = trpc.chat.conversations.get.useQuery(
    { id: conversationId ?? "" },
    { enabled: !!conversationId },
  );

  const invalidate = () => {
    if (conversationId) {
      utils.chat.conversations.get.invalidate({ id: conversationId });
      utils.chat.conversations.list.invalidate();
    }
  };

  const ask = trpc.chat.ask.useMutation({
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

  const analyzeMut = trpc.chat.analyze.useMutation({
    onSuccess: () => {
      setAnalyzingId(null);
      invalidate();
    },
    onError: (err) => {
      setAnalyzingId(null);
      setSubmitError({ code: err.data?.code ?? "UNKNOWN", message: err.message });
    },
  });

  const followupMut = trpc.chat.followup.useMutation({
    onSuccess: () => {
      setFollowingUpId(null);
      invalidate();
    },
    onError: (err) => {
      setFollowingUpId(null);
      setSubmitError({ code: err.data?.code ?? "UNKNOWN", message: err.message });
    },
  });

  const runMut = trpc.chat.runSql.useMutation({
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
    setPending({ question: trimmed });
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
  const showEmpty = !conversationId && messages.length === 0 && !pending;

  const actions = {
    onAnalyze: (messageId: string) => {
      setAnalyzingId(messageId);
      setSubmitError(null);
      analyzeMut.mutate({ messageId });
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
    analyzingId,
    followingUpId,
    runningId,
  };

  return (
    <div className="flex h-full min-w-0 flex-col bg-slate-50">
      <div className="flex-1 overflow-y-auto">
        {isLoadingConversation ? (
          <div className="flex h-full items-center justify-center text-sm text-penguin-cool-gray">
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

            {pending && (
              <>
                <UserMessage content={pending.question} />
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-penguin-obsidian text-penguin-lime">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-sm text-penguin-cool-gray">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generando SQL y ejecutando...
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

      <div className="border-t border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end gap-2 rounded-lg border border-slate-200 bg-white p-2 focus-within:border-penguin-violet focus-within:ring-1 focus-within:ring-penguin-violet/40">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Escribí tu pregunta... (Enter envía, Shift+Enter salto de línea)"
              rows={1}
              disabled={ask.isPending}
              className="max-h-48 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-penguin-obsidian placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
              style={{ minHeight: "28px" }}
            />
            <button
              type="button"
              onClick={() => submit(input)}
              disabled={ask.isPending || !input.trim()}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
                ask.isPending || !input.trim()
                  ? "bg-slate-100 text-slate-400"
                  : "bg-penguin-obsidian text-white hover:bg-penguin-obsidian-soft",
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
          <p className="mt-1.5 px-1 text-[10px] text-penguin-cool-gray">
            Solo queries de lectura · Sonnet 4.6 · SQL validado antes de ejecutarse · Análisis y
            follow-up son opt-in
          </p>
        </div>
      </div>
    </div>
  );
}
