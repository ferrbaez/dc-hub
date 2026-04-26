"use client";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

const TONE: Record<"green" | "amber" | "red" | "neutral", string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-rose-500",
  neutral: "bg-slate-300",
};

const SOURCE_LABEL: Record<string, string> = {
  local: "Local DB",
  ics: "ICS",
  scada: "SCADA",
};

export function HealthChip() {
  const { data, isLoading } = trpc.core.health.all.useQuery(undefined, {
    refetchInterval: 120_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
        <span className={cn("h-2 w-2 rounded-full", TONE.neutral)} />
        <span>Estado…</span>
      </div>
    );
  }

  const healthy = data.filter((r) => r.ok).length;
  const tone = healthy === data.length ? "green" : healthy === 0 ? "red" : "amber";
  const tooltip = data
    .map(
      (r) => `${SOURCE_LABEL[r.source] ?? r.source}: ${r.ok ? "OK" : (r.error?.message ?? "down")}`,
    )
    .join("\n");

  return (
    <div
      title={tooltip}
      className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
    >
      <span className={cn("h-2 w-2 rounded-full", TONE[tone])} />
      <span className="tabular-nums">
        {healthy}/{data.length} OK
      </span>
    </div>
  );
}
