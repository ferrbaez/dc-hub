"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { useMemo, useState } from "react";

const PREVIEW_ROWS = 50;

type Props = {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated?: boolean;
  messageId?: string | null;
};

function renderCell(value: unknown): { text: string; numeric: boolean } {
  if (value == null) return { text: "—", numeric: false };
  if (typeof value === "boolean") return { text: value ? "Sí" : "No", numeric: false };
  if (typeof value === "number") {
    return {
      text: value.toLocaleString("en-US", { maximumFractionDigits: 4 }),
      numeric: true,
    };
  }
  if (typeof value === "string") {
    // Detect numeric strings (pg returns bigint/numeric as string)
    const n = Number(value);
    if (value.trim() !== "" && Number.isFinite(n) && !/[a-zA-Z]/.test(value)) {
      const looksInt = !value.includes(".");
      return {
        text: n.toLocaleString("en-US", { maximumFractionDigits: looksInt ? 0 : 4 }),
        numeric: true,
      };
    }
    // ISO date-time
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:/.test(value)) {
      try {
        const d = new Date(value);
        if (!Number.isNaN(d.getTime())) {
          return { text: d.toLocaleString("es-AR", { hour12: false }), numeric: false };
        }
      } catch {
        // fall through
      }
    }
    return { text: value, numeric: false };
  }
  if (value instanceof Date) {
    return { text: value.toLocaleString("es-AR", { hour12: false }), numeric: false };
  }
  try {
    return { text: JSON.stringify(value), numeric: false };
  } catch {
    return { text: String(value), numeric: false };
  }
}

export function ResultTable({ columns, rows, rowCount, truncated, messageId }: Props) {
  const [expanded, setExpanded] = useState(false);
  const displayRows = useMemo(
    () => (expanded ? rows : rows.slice(0, PREVIEW_ROWS)),
    [rows, expanded],
  );
  const hasMore = rows.length > PREVIEW_ROWS;

  return (
    <div className="rounded-lg border border-surface-border bg-surface">
      <div className="flex items-center justify-between border-b border-surface-border px-3 py-2">
        <div className="text-xs text-content-muted">
          <span className="font-medium text-content">{rowCount.toLocaleString("en-US")}</span>{" "}
          {rowCount === 1 ? "fila" : "filas"}
          {truncated && (
            <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              truncado a 10.000
            </span>
          )}
          {" · "}
          <span>{columns.length} columnas</span>
        </div>
        {messageId && rowCount > 0 && (
          <a
            href={`/api/chat/export/${messageId}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-surface-border bg-surface px-2.5 py-1 text-xs font-medium text-content shadow-sm transition-colors hover:border-penguin-lime/60 hover:bg-penguin-lime/10"
            download
          >
            <Download className="h-3.5 w-3.5" />
            Descargar Excel
          </a>
        )}
      </div>

      {rowCount === 0 ? (
        <div className="px-3 py-8 text-center text-sm text-content-muted">
          Consulta ejecutada, sin resultados.
        </div>
      ) : (
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-surface-soft">
              <tr className="border-b border-surface-border">
                {columns.map((col) => (
                  <th
                    key={col}
                    className="whitespace-nowrap px-3 py-2 text-left font-medium text-content-muted"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, i) => (
                <tr
                  // Read-only snapshot — rows never reorder; index is a stable
                  // key and we have no semantic id to use instead.
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable snapshot
                  key={i}
                  className={cn(
                    "border-b border-surface-border",
                    i % 2 === 1 && "bg-surface-soft/40",
                  )}
                >
                  {columns.map((col) => {
                    const { text, numeric } = renderCell(row[col]);
                    return (
                      <td
                        key={col}
                        className={cn(
                          "whitespace-nowrap px-3 py-1.5 text-content",
                          numeric && "text-right tabular-nums",
                          row[col] == null && "text-content-muted",
                        )}
                        title={text.length > 80 ? text : undefined}
                      >
                        {text.length > 80 ? `${text.slice(0, 77)}…` : text}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-surface-border bg-surface-soft px-3 py-2 text-xs font-medium text-content-muted transition-colors hover:bg-surface-muted hover:text-content"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Mostrar solo las primeras {PREVIEW_ROWS}
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Mostrar las {rows.length.toLocaleString("en-US")} filas
            </>
          )}
        </button>
      )}
    </div>
  );
}
