"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2, Sparkles, TrendingUp, User } from "lucide-react";
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
};

const DATA_SOURCE_STYLES: Record<string, string> = {
  ics: "bg-penguin-violet/10 text-penguin-violet ring-1 ring-inset ring-penguin-violet/20",
  scada: "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200",
  local: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
};

function DataSourceChip({ source }: { source: string }) {
  const cls = DATA_SOURCE_STYLES[source] ?? "bg-slate-100 text-slate-700";
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
      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-penguin-violet text-white">
        <User className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 pt-0.5 text-sm text-penguin-obsidian">{content}</div>
    </div>
  );
}

type AssistantActions = {
  onAnalyze: (messageId: string) => void;
  onFollowup: (messageId: string) => void;
  onRun: (messageId: string) => void;
  analyzingId: string | null;
  followingUpId: string | null;
  runningId: string | null;
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

  const isAnalyzing = actions.analyzingId === message.id;
  const isFollowingUp = actions.followingUpId === message.id;
  const isRunning = actions.runningId === message.id;

  // Error branch (and no SQL — only pre-execution errors)
  if (hasError && !hasSql) {
    return (
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-600">
          <AlertTriangle className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm">
            <div className="font-medium text-rose-900">
              {message.errorCode === "ANTHROPIC_CONFIG_MISSING"
                ? "Falta configurar la API key de Anthropic"
                : message.errorCode === "SERVICE_UNAVAILABLE"
                  ? "Fuente de datos no disponible"
                  : "Error al procesar la pregunta"}
            </div>
            <div className="mt-1 text-xs text-rose-700">{message.errorMessage}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-penguin-obsidian text-penguin-lime">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1 space-y-3 pt-0.5">
        {/* Meta chips */}
        {message.dataSource && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-penguin-cool-gray">
            <DataSourceChip source={message.dataSource} />
            {isDraft && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                Pendiente
              </span>
            )}
            {message.durationMs != null && hasResult && (
              <span className="tabular-nums">· {message.durationMs} ms</span>
            )}
            {message.rationale && (
              <span className="italic text-penguin-cool-gray">· {message.rationale}</span>
            )}
          </div>
        )}

        {/* Execution error with SQL shown */}
        {hasError && hasSql && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div>
              <div className="font-medium text-rose-900">
                {message.errorCode === "SQL_VALIDATION_FAILED"
                  ? "SQL rechazado por el validador"
                  : "Error ejecutando la consulta"}
              </div>
              <div className="mt-0.5 text-xs text-rose-700">{message.errorMessage}</div>
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

        {/* Analysis block */}
        {hasAnalysis && (
          <div className="rounded-lg border border-penguin-lime/30 bg-penguin-lime/5 p-3">
            <div className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-penguin-obsidian">
              <Sparkles className="h-3 w-3 text-penguin-obsidian" />
              Análisis
            </div>
            <AnalysisMarkdown content={message.content} />
          </div>
        )}

        {/* Action buttons */}
        {hasResult && (
          <div className="flex flex-wrap items-center gap-2">
            {!hasAnalysis && (
              <button
                type="button"
                onClick={() => actions.onAnalyze(message.id)}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-1.5 rounded-md border border-penguin-lime/60 bg-penguin-lime/10 px-3 py-1.5 text-xs font-medium text-penguin-obsidian transition-colors hover:bg-penguin-lime/20 disabled:opacity-50"
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
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-penguin-obsidian shadow-sm transition-colors hover:border-penguin-violet/60 hover:bg-penguin-violet/5 disabled:opacity-50"
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
