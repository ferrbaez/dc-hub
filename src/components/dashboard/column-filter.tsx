"use client";

import { cn } from "@/lib/utils";
import { Filter } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Dropdown-style multi-select filter for a table column.
 * Empty selected set = "all pass" (no filter). Selecting 1+ values narrows rows.
 */
export function ColumnFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const active = selected.size > 0;
  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className="relative inline-block" ref={ref} data-pdf-hide="true">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "ml-1 inline-flex items-center rounded p-0.5 align-middle transition-colors",
          active
            ? "bg-penguin-lime/40 text-content"
            : "text-content-muted hover:bg-surface-muted hover:text-content",
        )}
        aria-label={`Filtrar ${label}`}
        title={active ? `${selected.size} filtro(s) activo(s)` : "Filtrar"}
      >
        <Filter className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-60 rounded-lg border border-surface-border bg-surface shadow-xl ring-1 ring-black/5 dark:bg-surface-soft dark:shadow-2xl dark:shadow-black/50 dark:ring-white/5">
          <div className="flex items-center justify-between border-b border-surface-border px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-content-muted">
              {label}
            </span>
            {active && (
              <button
                type="button"
                onClick={() => onChange(new Set())}
                className="text-[10px] text-penguin-violet hover:underline"
              >
                Limpiar
              </button>
            )}
          </div>
          {options.length > 8 && (
            <div className="border-b border-surface-border px-2 py-1.5">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="h-6 w-full rounded border border-surface-border px-2 text-xs text-content placeholder:text-content-muted focus:border-penguin-violet focus:outline-none"
              />
            </div>
          )}
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-xs text-content-muted">Sin coincidencias</div>
            )}
            {filtered.map((opt) => {
              const on = selected.has(opt);
              return (
                <label
                  key={opt}
                  className="flex cursor-pointer items-center gap-2 px-3 py-1 text-xs hover:bg-surface-soft"
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => {
                      const next = new Set(selected);
                      if (on) next.delete(opt);
                      else next.add(opt);
                      onChange(next);
                    }}
                    className="h-3 w-3 rounded border-surface-border"
                  />
                  <span className="truncate text-content">{opt || "—"}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
