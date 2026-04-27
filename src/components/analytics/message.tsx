"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, HelpCircle, Loader2, Sparkles, TrendingUp, User } from "lucide-react";
import { AnalysisMarkdown } from "./analysis-markdown";
import { ResultTable } from "./result-table";
import { SqlBlock } from "./sql-block";

export type MessageRow = {
  id: string;
  role: string;
  content: string;
  sqlGenerated?: string | null;
  dataSource?: string | null;
  rationale?: string | null;
  resultRows?: unknown;
  resultColumns?: unknown;
  rowCount?: number | null;
  durationMs?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: unknown;
};

type MessageMetadata = {
  kind?: "clarification";
  candidates?: string[];
};

function readMetadata(raw: unknown): MessageMetadata | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  const kind = typeof m.kind === "string" ? (m.kind as MessageMetadata["kind"]) : undefined;
  const candidates = Array.isArray(m.candidates)
    ? (m.candidates.filter((c): c is string => typeof c === "string") as string[])
    : undefined;
  if (!kind && !candidates) return null;
  return { kind, candidates };
}

const DATA_SOURCE_STYLES: Record<string, string> = {
  ics: "bg-penguin-violet/10 text-penguin-violet ring-1 ring-inset ring-penguin-violet/20 dark:bg-penguin-violet/20",
  scada:
    "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30",
  local: "bg-surface-muted text-content-soft ring-1 ring-inset ring-surface-border",
};

function DataSourceChip({ source }: { source: string }) {
  const cls =
    DATA_SOURCE_STYLES[source] ??
    "bg-surface-muted text-content-soft ring-1 ring-inset ring-surface-border";
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        cls,
      )}
    >
      {source}
    </span>
  );
}

export function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-penguin-violet text-white shadow-sm shadow-penguin-violet/30">
        <User className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 rounded-2xl rounded-tl-sm border border-surface-border bg-surface px-4 py-2.5 text-sm text-content shadow-sm">
        {content}
      </div>
    </div>
  );
}

type AssistantActions = {
  onAnalyze: (messageId: string) => void;
  onFollowup: (messageId: string) => void;
  onRun: (messageId: string) => void;
  onClarify: (answer: string) => void;
  analyzingId: string | null;
  followingUpId: string | null;
  runningId: string | null;
  streamingAnalysisForId: string | null;
  streamingText: string;
};

export function AssistantMessage({
  message,
  actions,
}: {
  message: MessageRow;
  actions: AssistantActions;
}) {
  const columns = Array.isArray(message.resultColumns) ? (message.resultColumns as string[]) : null;
  const rows = Array.isArray(message.resultRows)
    ? (message.resultRows as Record<string, unknown>[])
    : null;

  const hasError = !!message.errorCode;
  const hasResult = columns !== null && rows !== null;
  const hasAnalysis = !!message.content && message.content.length > 0;
  const hasSql = !!message.sqlGenerated;
  const isDraft = hasSql && !hasResult && !hasError;
  const metadata = readMetadata(message.metadata);
  const isClarification = metadata?.kind === "clarification";

  const isAnalyzing = actions.analyzingId === message.id;
  const isFollowingUp = actions.followingUpId === message.id;
  const isRunning = actions.runningId === message.id;
  const isStreamingAnalysis = actions.streamingAnalysisForId === message.id;
  const streamingContent = isStreamingAnalysis ? actions.streamingText : "";

  // Clarification branch — question + candidate buttons, no SQL/table
  if (isClarification) {
    return (
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-penguin-violet/15 text-penguin-violet dark:bg-penguin-violet/25">
          <HelpCircle className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          <div className="rounded-2xl rounded-tl-sm border border-penguin-violet/30 bg-penguin-violet/5 p-4 dark:bg-penguin-violet/10">
            <div className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-penguin-violet">
              <HelpCircle className="h-3 w-3" />
              Necesito aclarar algo
            </div>
            <p className="text-sm text-content">{message.content}</p>
            {message.rationale && (
              <p className="mt-2 text-[11px] italic text-content-muted">{message.rationale}</p>
            )}
          </div>
          {metadata.candidates && metadata.candidates.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {metadata.candidates.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => actions.onClarify(c)}
                  className="rounded-lg border border-surface-border bg-surface-soft px-3 py-1.5 text-xs font-medium text-content shadow-sm transition-all hover:border-penguin-violet/60 hover:bg-penguin-violet/10 hover:shadow-md"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Error branch (and no SQL — only pre-execution errors)
  if (hasError && !hasSql) {
    return (
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rose-500/15 text-rose-600 dark:bg-rose-500/25 dark:text-rose-400">
          <AlertTriangle className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm dark:border-rose-900/40 dark:bg-rose-950/30">
            <div className="font-medium text-rose-900 dark:text-rose-200">
              {message.errorCode === "ANTHROPIC_CONFIG_MISSING"
                ? "Falta configurar la API key de Anthropic"
                : message.errorCode === "SERVICE_UNAVAILABLE"
                  ? "Fuente de datos no disponible"
                  : "Error al procesar la pregunta"}
            </div>
            <div className="mt-1 text-xs text-rose-700 dark:text-rose-300">
              {message.errorMessage}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-penguin-violet to-penguin-violet/70 text-white shadow-sm shadow-penguin-violet/30">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1 space-y-3 pt-0.5">
        {/* Meta chips */}
        {message.dataSource && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-content-muted">
            <DataSourceChip source={message.dataSource} />
            {isDraft && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30">
                Pendiente
              </span>
            )}
            {message.durationMs != null && hasResult && (
              <span className="tabular-nums">· {message.durationMs} ms</span>
            )}
            {message.rationale && (
              <span className="italic text-content-muted">· {message.rationale}</span>
            )}
          </div>
        )}

        {/* Execution error with SQL shown */}
        {hasError && hasSql && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm dark:border-rose-900/40 dark:bg-rose-950/30">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <div>
              <div className="font-medium text-rose-900 dark:text-rose-200">
                {message.errorCode === "SQL_VALIDATION_FAILED"
                  ? "SQL rechazado por el validador"
                  : "Error ejecutando la consulta"}
              </div>
              <div className="mt-0.5 text-xs text-rose-700 dark:text-rose-300">
                {message.errorMessage}
              </div>
            </div>
          </div>
        )}

        {/* SQL block — always visible when SQL exists */}
        {hasSql && (
          <SqlBlock
            sql={message.sqlGenerated as string}
            label={isDraft ? "draft" : "query"}
            onExecute={() => actions.onRun(message.id)}
            executing={isRunning}
          />
        )}

        {/* Result table */}
        {hasResult && columns && rows && (
          <ResultTable
            columns={columns}
            rows={rows}
            rowCount={message.rowCount ?? rows.length}
            messageId={message.id}
          />
        )}

        {/* Analysis block — streaming or saved */}
        {(hasAnalysis || isStreamingAnalysis) && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              <Sparkles className={cn("h-3 w-3", isStreamingAnalysis && "animate-pulse")} />
              Análisis{isStreamingAnalysis && streamingContent.length === 0 ? "..." : ""}
            </div>
            {isStreamingAnalysis && streamingContent.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-content-muted">
                <Loader2 className="h-3 w-3 animate-spin" />
                Generando análisis...
              </div>
            ) : (
              <AnalysisMarkdown
                content={isStreamingAnalysis ? streamingContent : message.content}
              />
            )}
          </div>
        )}

        {/* Action buttons */}
        {hasResult && (
          <div className="flex flex-wrap items-center gap-2">
            {!hasAnalysis && !isStreamingAnalysis && (
              <button
                type="button"
                onClick={() => actions.onAnalyze(message.id)}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 transition-all hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/60"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Analizar resultados
              </button>
            )}
            <button
              type="button"
              onClick={() => actions.onFollowup(message.id)}
              disabled={isFollowingUp}
              className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-soft px-3 py-1.5 text-xs font-medium text-content shadow-sm transition-all hover:border-penguin-violet/60 hover:bg-penguin-violet/10 disabled:opacity-50"
            >
              {isFollowingUp ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5" />
              )}
              Consulta complementaria
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
