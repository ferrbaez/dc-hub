"use client";

import {
  AUTO_REFRESH_OPTIONS,
  type AutoRefreshValue,
  useAutoRefresh,
} from "@/lib/shell/auto-refresh";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export function AutoRefreshSelect() {
  const { value, setValue } = useAutoRefresh();
  const active = value !== "off";

  return (
    <label
      className={cn(
        "flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs transition-colors",
        active
          ? "border-penguin-lime/60 bg-penguin-lime/10 text-penguin-obsidian"
          : "border-slate-200 bg-white text-slate-600",
      )}
    >
      <RefreshCw className={cn("h-3.5 w-3.5", active && "text-penguin-obsidian")} />
      <span className="hidden sm:inline">Auto-refresh</span>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value as AutoRefreshValue)}
        className={cn(
          "cursor-pointer bg-transparent pr-1 text-xs font-semibold focus:outline-none",
          active ? "text-penguin-obsidian" : "text-slate-900",
        )}
      >
        {AUTO_REFRESH_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
