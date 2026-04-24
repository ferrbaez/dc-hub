"use client";

import { Download } from "lucide-react";

/**
 * Minimal client-side CSV export for a rendered table view. Takes the rows
 * (already filtered + sorted) and a column spec so the CSV reflects what the
 * user actually sees. Opens in Excel natively.
 */
export type CsvColumn<T> = {
  header: string;
  get: (row: T) => string | number | null | undefined;
};

function escapeCell(value: string | number | null | undefined): string {
  if (value == null) return "";
  const s = typeof value === "string" ? value : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportCsv<T>(filename: string, columns: CsvColumn<T>[], rows: T[]) {
  const header = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => escapeCell(c.get(r))).join(",")).join("\n");
  const csv = `${header}\n${body}`;
  // BOM so Excel auto-detects UTF-8 (needed for °, Δ, ñ, etc.)
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportCsvButton<T>({
  filename,
  columns,
  rows,
  disabled,
}: {
  filename: string;
  columns: CsvColumn<T>[];
  rows: T[];
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => exportCsv(filename, columns, rows)}
      disabled={disabled || rows.length === 0}
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-penguin-obsidian shadow-sm transition-colors hover:border-penguin-lime/60 hover:bg-penguin-lime/10 disabled:opacity-40"
      title={`Exportar ${rows.length} filas`}
    >
      <Download className="h-3.5 w-3.5" />
      Exportar CSV
    </button>
  );
}
