"use client";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2 } from "lucide-react";

function fmt(v: number | null, digits = 1, suffix = "") {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${v.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: Math.min(digits, 1),
  })}${suffix}`;
}

function oilTempTone(t: number | null) {
  if (t == null) return "text-slate-400";
  if (t >= 80) return "font-semibold text-rose-600";
  if (t >= 70) return "font-semibold text-amber-600";
  return "text-penguin-obsidian";
}

function hydrogenTone(h: number | null) {
  if (h == null) return "text-slate-400";
  // H2 in oil — typical alert levels: > 100 ppm warning, > 500 ppm alert.
  if (h >= 500) return "font-semibold text-rose-600";
  if (h >= 100) return "font-semibold text-amber-600";
  return "text-penguin-obsidian";
}

function chassisTempTone(t: number | null) {
  if (t == null) return "text-slate-400";
  // PT100 chassis typically alert at trafo_alert = EM01_Temperatura + 50°C.
  // As a rough absolute guard, mirror the oil thresholds.
  if (t >= 80) return "font-semibold text-rose-600";
  if (t >= 70) return "font-semibold text-amber-600";
  return "text-penguin-obsidian";
}

export function TrafoExpansion({ feeder }: { feeder: string }) {
  const trafos = trpc.core.site.trafosForFeeder.useQuery(
    { feeder },
    { refetchOnWindowFocus: false, staleTime: 60_000 },
  );

  if (trafos.isLoading) {
    return (
      <div className="flex items-center gap-2 py-3 pl-12 text-xs text-penguin-cool-gray">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Consultando telemetría de trafos para {feeder}...
      </div>
    );
  }

  if (trafos.error) {
    return (
      <div className="flex items-start gap-2 py-3 pl-12 text-xs">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
        <span className="text-rose-700">{trafos.error.message}</span>
      </div>
    );
  }

  const rows = trafos.data ?? [];

  if (rows.length === 0) {
    return (
      <div className="py-3 pl-12 text-xs text-penguin-cool-gray">
        Sin trafos mapeados (ni H2Sense ni PT100 de carcaza) para {feeder}.
      </div>
    );
  }

  const h2Rows = rows.filter((r) => r.source === "h2sense");
  const chassisRows = rows.filter((r) => r.source === "chassis");

  return (
    <div className="space-y-3 border-l-4 border-penguin-violet/40 bg-slate-50/60 px-4 py-3">
      {h2Rows.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2 pl-8 text-[10px] font-semibold uppercase tracking-wider text-penguin-cool-gray">
            <span>Transformadores bajo {feeder}</span>
            <span className="text-slate-400">· H2Sense (aceite + hidrógeno)</span>
          </div>
          <div className="overflow-x-auto pl-8">
            <table className="w-full min-w-[640px] border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[10px] uppercase tracking-wider text-penguin-cool-gray">
                  <th className="py-1.5 pr-4 font-semibold">Trafo</th>
                  <th className="py-1.5 pr-4 text-right font-semibold">Temp aceite</th>
                  <th className="py-1.5 pr-4 text-right font-semibold">Temp PCB</th>
                  <th className="py-1.5 pr-4 text-right font-semibold">Presión</th>
                  <th className="py-1.5 pr-4 text-right font-semibold">Humedad aceite</th>
                  <th className="py-1.5 pr-4 text-right font-semibold">Hidrógeno</th>
                  <th className="py-1.5 pr-4 text-right font-semibold">Actividad agua</th>
                </tr>
              </thead>
              <tbody>
                {h2Rows.map((t) => (
                  <tr key={t.trafoId} className="border-b border-slate-100 last:border-b-0">
                    <td className="py-1.5 pr-4 font-medium text-penguin-obsidian">{t.trafoId}</td>
                    <td
                      className={cn(
                        "py-1.5 pr-4 text-right tabular-nums",
                        oilTempTone(t.temperatureOil),
                      )}
                    >
                      {fmt(t.temperatureOil, 1, " °C")}
                    </td>
                    <td className="py-1.5 pr-4 text-right tabular-nums text-penguin-cool-gray">
                      {fmt(t.temperaturePcb, 1, " °C")}
                    </td>
                    <td className="py-1.5 pr-4 text-right tabular-nums text-penguin-cool-gray">
                      {fmt(t.pressureOil, 2, " bar")}
                    </td>
                    <td className="py-1.5 pr-4 text-right tabular-nums text-penguin-cool-gray">
                      {fmt(t.waterContent, 2, " ppm")}
                    </td>
                    <td
                      className={cn(
                        "py-1.5 pr-4 text-right tabular-nums",
                        hydrogenTone(t.hydrogen),
                      )}
                    >
                      {fmt(t.hydrogen, 1, " ppm")}
                    </td>
                    <td className="py-1.5 pr-4 text-right tabular-nums text-penguin-cool-gray">
                      {fmt(t.waterActivity, 3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {chassisRows.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2 pl-8 text-[10px] font-semibold uppercase tracking-wider text-penguin-cool-gray">
            <span>
              {h2Rows.length > 0 ? "+ Trafos sin H2Sense" : `Transformadores bajo ${feeder}`}
            </span>
            <span className="text-slate-400">· PT100 carcaza (solo temperatura)</span>
          </div>
          <div className="overflow-x-auto pl-8">
            <table className="w-full min-w-[420px] border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[10px] uppercase tracking-wider text-penguin-cool-gray">
                  <th className="py-1.5 pr-4 font-semibold">Trafo</th>
                  <th className="py-1.5 pr-4 text-right font-semibold">Temp carcaza</th>
                  <th className="py-1.5 pr-4 font-semibold">Notas</th>
                </tr>
              </thead>
              <tbody>
                {chassisRows.map((t) => (
                  <tr key={t.trafoId} className="border-b border-slate-100 last:border-b-0">
                    <td className="py-1.5 pr-4 font-medium text-penguin-obsidian">{t.trafoId}</td>
                    <td
                      className={cn(
                        "py-1.5 pr-4 text-right tabular-nums",
                        chassisTempTone(t.chassisTemp),
                      )}
                    >
                      {fmt(t.chassisTemp, 1, " °C")}
                    </td>
                    <td className="py-1.5 pr-4 text-[10px] text-penguin-cool-gray">
                      {t.chassisTemp == null
                        ? "sensor sin lectura (posible desconexión, valor 850)"
                        : "sin instrumentación H2/oil — solo temperatura exterior"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
