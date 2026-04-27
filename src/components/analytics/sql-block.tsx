"use client";

import { cn } from "@/lib/utils";
import { Check, Copy, Loader2, Play, RotateCw } from "lucide-react";
import { useState } from "react";

type Props = {
  sql: string;
  label?: "query" | "draft"; // draft = not yet executed, show Ejecutar instead of Re-ejecutar
  onExecute?: () => void;
  executing?: boolean;
};

export function SqlBlock({ sql, label = "query", onExecute, executing = false }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // best-effort
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-surface-border bg-penguin-obsidian">
      <div className="flex items-center justify-between border-b border-penguin-obsidian-soft/40 bg-penguin-obsidian px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-content-muted">
          SQL
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-slate-300 transition-colors hover:bg-penguin-obsidian-soft hover:text-white"
            title="Copiar al portapapeles"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-penguin-lime" />
                <span className="text-penguin-lime">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copiar
              </>
            )}
          </button>
          {onExecute && (
            <button
              type="button"
              onClick={onExecute}
              disabled={executing}
              className={cn(
                "inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50",
                label === "draft"
                  ? "bg-penguin-lime text-content hover:bg-penguin-lime/90"
                  : "text-slate-300 hover:bg-penguin-obsidian-soft hover:text-white",
              )}
              title={label === "draft" ? "Ejecutar esta consulta" : "Volver a ejecutar"}
            >
              {executing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : label === "draft" ? (
                <Play className="h-3 w-3" />
              ) : (
                <RotateCw className="h-3 w-3" />
              )}
              {label === "draft" ? "Ejecutar" : "Re-ejecutar"}
            </button>
          )}
        </div>
      </div>
      <pre className="max-h-80 overflow-auto bg-penguin-obsidian px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-100">
        {sql}
      </pre>
    </div>
  );
}
