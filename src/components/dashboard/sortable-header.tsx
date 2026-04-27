"use client";

import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";

export type SortState<K extends string = string> = { key: K; dir: "asc" | "desc" } | null;

/**
 * Click-to-sort header. Tri-state: unsorted → asc → desc → unsorted.
 * `align` controls where the label sits inside the cell (right for numeric cols).
 */
export function SortableHeader<K extends string>({
  sortKey,
  sort,
  onSort,
  align = "left",
  children,
}: {
  sortKey: K;
  sort: SortState<K>;
  onSort: (next: SortState<K>) => void;
  align?: "left" | "right";
  children: ReactNode;
}) {
  const active = sort?.key === sortKey;
  const dir = active ? sort?.dir : null;

  function handleClick() {
    if (!active) onSort({ key: sortKey, dir: "asc" });
    else if (dir === "asc") onSort({ key: sortKey, dir: "desc" });
    else onSort(null);
  }

  const Icon = dir === "asc" ? ArrowUp : dir === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group inline-flex w-full items-center gap-1 font-medium",
        align === "right" ? "justify-end" : "justify-start",
        active ? "text-content" : "text-content-muted hover:text-content",
      )}
    >
      <span>{children}</span>
      <Icon
        className={cn(
          "h-3 w-3 shrink-0",
          active ? "text-content" : "text-slate-300 group-hover:text-content-muted",
        )}
      />
    </button>
  );
}

/**
 * Compare helper that handles null (always last), numbers, and strings.
 */
export function compareValues(a: unknown, b: unknown, dir: "asc" | "desc"): number {
  const aNull = a == null;
  const bNull = b == null;
  if (aNull && bNull) return 0;
  if (aNull) return 1; // nulls always at bottom regardless of dir
  if (bNull) return -1;

  let cmp: number;
  if (typeof a === "number" && typeof b === "number") {
    cmp = a - b;
  } else {
    cmp = String(a).localeCompare(String(b), "es", { numeric: true });
  }
  return dir === "asc" ? cmp : -cmp;
}
