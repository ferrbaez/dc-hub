"use client";

import { cn } from "@/lib/utils";

/**
 * Semicircular gauge with a colored arc. Used for NOC-style KPI tiles on the
 * /graficos dashboard. Zero external deps — pure SVG.
 *
 * `value` and `max` are in the same unit (whatever the caller chose).
 * `thresholds` defines the color zones as fractions of max:
 *   { warn: 0.8, alert: 1.0 }  →  0-80% green, 80-100% amber, >100% red
 */
export type GaugeThresholds = { warn: number; alert: number };

const DEFAULT_THRESHOLDS: GaugeThresholds = { warn: 0.9, alert: 1.0 };

function toneFor(pct: number, t: GaugeThresholds) {
  if (pct >= t.alert) return { fill: "#dc2626", text: "text-rose-600" }; // rose-600
  if (pct >= t.warn) return { fill: "#f59e0b", text: "text-amber-600" }; // amber-500
  return { fill: "#10b981", text: "text-emerald-600" }; // emerald-500
}

export function Gauge({
  value,
  max,
  label,
  unit,
  decimals = 1,
  thresholds = DEFAULT_THRESHOLDS,
  sublabel,
}: {
  value: number | null;
  max: number;
  label: string;
  unit?: string;
  decimals?: number;
  thresholds?: GaugeThresholds;
  sublabel?: string;
}) {
  const v = value ?? 0;
  const clamped = Math.max(0, Math.min(v, max * 1.1));
  const pct = max > 0 ? clamped / max : 0;
  const tone = toneFor(pct, thresholds);

  // Semicircle geometry. Start at 180°, end at 0° (left to right).
  const cx = 60;
  const cy = 60;
  const r = 48;
  const circumference = Math.PI * r;
  const dash = Math.min(pct, 1) * circumference;

  const display =
    value != null && Number.isFinite(value)
      ? value.toLocaleString("en-US", {
          maximumFractionDigits: decimals,
          minimumFractionDigits: Math.min(1, decimals),
        })
      : "—";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 70" className="h-20 w-28">
        <title>{label}</title>
        {/* Background arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={10}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={tone.fill}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: "stroke-dasharray 400ms ease-out" }}
        />
      </svg>
      <div className={cn("-mt-6 text-center", tone.text)}>
        <div className="text-lg font-semibold tabular-nums leading-tight">
          {display}
          {unit && (
            <span className="ml-0.5 text-[10px] font-normal text-penguin-cool-gray">{unit}</span>
          )}
        </div>
      </div>
      <div className="mt-1 text-center text-[11px] font-medium text-penguin-obsidian">{label}</div>
      {sublabel && <div className="text-[10px] text-penguin-cool-gray">{sublabel}</div>}
    </div>
  );
}
