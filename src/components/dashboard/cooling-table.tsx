"use client";

import { ColumnFilter } from "@/components/dashboard/column-filter";
import { type CsvColumn, ExportCsvButton } from "@/components/dashboard/export-csv";
import { ExportPdfButton } from "@/components/dashboard/export-pdf";
import {
  type SortState,
  SortableHeader,
  compareValues,
} from "@/components/dashboard/sortable-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAutoRefresh } from "@/lib/shell/auto-refresh";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2, RotateCcw, Settings2, Thermometer } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// PDF export uses ref to snapshot the current DOM view.

type CoolingSortKey =
  | "container"
  | "client"
  | "project"
  | "type"
  | "waterIn"
  | "waterOut"
  | "delta"
  | "flow"
  | "pressure"
  | "coldAisle"
  | "hotAisle";

type Thresholds = {
  ndWaterMax: number; // °C
  hydroWaterMax: number; // °C
  waterWarnMargin: number; // °C — soft warn when within N°C of alert
  caudalMin: number; // m³/h — below this = alert
  deltaWarn: number; // °C — Δ between in/out above this = warn
  deltaAlert: number; // °C — Δ above this = alert
};

const DEFAULT_THRESHOLDS: Thresholds = {
  ndWaterMax: 45,
  hydroWaterMax: 40,
  waterWarnMargin: 3,
  caudalMin: 90,
  deltaWarn: 15,
  deltaAlert: 20,
};

const THRESHOLDS_KEY = "cooling-thresholds-v1";

function useThresholds(): [Thresholds, (next: Thresholds) => void, () => void] {
  const [t, setT] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(THRESHOLDS_KEY);
      if (raw) setT({ ...DEFAULT_THRESHOLDS, ...(JSON.parse(raw) as Partial<Thresholds>) });
    } catch {}
  }, []);
  const update = (next: Thresholds) => {
    setT(next);
    try {
      localStorage.setItem(THRESHOLDS_KEY, JSON.stringify(next));
    } catch {}
  };
  const reset = () => update(DEFAULT_THRESHOLDS);
  return [t, update, reset];
}

function fmt(v: number | null | undefined, digits = 1, suffix = "") {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${v.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: Math.min(digits, 1),
  })}${suffix}`;
}

function ThresholdRow({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-1 text-xs">
      <span className="text-penguin-obsidian">{label}</span>
      <span className="inline-flex items-center gap-1">
        <input
          type="number"
          step="0.1"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-7 w-20 rounded border border-slate-200 px-2 text-right tabular-nums text-penguin-obsidian focus:border-penguin-violet focus:outline-none"
        />
        <span className="text-[10px] text-penguin-cool-gray">{suffix}</span>
      </span>
    </label>
  );
}

function ThresholdsPopover({
  thresholds,
  onChange,
  onReset,
}: {
  thresholds: Thresholds;
  onChange: (t: Thresholds) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-penguin-obsidian shadow-sm hover:border-penguin-lime/60 hover:bg-penguin-lime/10"
        title="Configurar umbrales"
      >
        <Settings2 className="h-3.5 w-3.5" />
        Umbrales
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-72 rounded-md border border-slate-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-penguin-cool-gray">
              Umbrales de cooling
            </span>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-[10px] text-penguin-violet hover:underline"
            >
              <RotateCcw className="h-3 w-3" />
              Defaults
            </button>
          </div>
          <div className="space-y-0.5">
            <ThresholdRow
              label="ND agua máx"
              value={thresholds.ndWaterMax}
              onChange={(n) => onChange({ ...thresholds, ndWaterMax: n })}
              suffix="°C"
            />
            <ThresholdRow
              label="Hydro agua máx"
              value={thresholds.hydroWaterMax}
              onChange={(n) => onChange({ ...thresholds, hydroWaterMax: n })}
              suffix="°C"
            />
            <ThresholdRow
              label="Warn margin"
              value={thresholds.waterWarnMargin}
              onChange={(n) => onChange({ ...thresholds, waterWarnMargin: n })}
              suffix="°C"
            />
            <ThresholdRow
              label="Caudal mín"
              value={thresholds.caudalMin}
              onChange={(n) => onChange({ ...thresholds, caudalMin: n })}
              suffix="m³/h"
            />
            <ThresholdRow
              label="Δ warn"
              value={thresholds.deltaWarn}
              onChange={(n) => onChange({ ...thresholds, deltaWarn: n })}
              suffix="°C"
            />
            <ThresholdRow
              label="Δ alert"
              value={thresholds.deltaAlert}
              onChange={(n) => onChange({ ...thresholds, deltaAlert: n })}
              suffix="°C"
            />
          </div>
          <p className="mt-2 text-[10px] leading-snug text-penguin-cool-gray">
            Se guarda en localStorage. Afecta solo esta vista.
          </p>
        </div>
      )}
    </div>
  );
}

function AlertChip({ label, tone }: { label: string; tone: "warn" | "alert" }) {
  const cls =
    tone === "alert"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : "bg-amber-50 text-amber-700 ring-amber-200";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset",
        cls,
      )}
    >
      {label}
    </span>
  );
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

type CoolingCsvRow = {
  container: string;
  client: string;
  project: string;
  type: string;
  waterIn: number | null;
  waterOut: number | null;
  delta: number | null;
  flow: number | null;
  pressure: number | null;
  coldAisle: number | null;
  hotAisle: number | null;
};

const COOLING_CSV_COLUMNS: CsvColumn<CoolingCsvRow>[] = [
  { header: "Container", get: (r) => r.container },
  { header: "Cliente", get: (r) => r.client },
  { header: "Proyecto", get: (r) => r.project },
  { header: "Tipo", get: (r) => r.type },
  { header: "Agua in (°C)", get: (r) => r.waterIn },
  { header: "Agua out (°C)", get: (r) => r.waterOut },
  { header: "Delta (°C)", get: (r) => r.delta },
  { header: "Caudal (m³/h)", get: (r) => r.flow },
  { header: "Presión (bar)", get: (r) => r.pressure },
  { header: "Aire frío (°C)", get: (r) => r.coldAisle },
  { header: "Aire cálido (°C)", get: (r) => r.hotAisle },
];

export function CoolingTable() {
  const { intervalMs } = useAutoRefresh();
  const cooling = trpc.core.site.cooling.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchInterval: intervalMs,
  });
  const [thresholds, setThresholds, resetThresholds] = useThresholds();
  const pdfRef = useRef<HTMLDivElement>(null);
  const [clientFilter, setClientFilter] = useState<Set<string>>(new Set());
  const [projectFilter, setProjectFilter] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortState<CoolingSortKey>>(null);

  const allRows = cooling.data ?? [];

  // Cascading filter options — each column dropdown lists only values that
  // survive the OTHER active filters. Picking "ZPJV" hides non-ZPJV projects.
  const clientOptions = useMemo(
    () =>
      uniqueSorted(
        allRows
          .filter((r) => projectFilter.size === 0 || projectFilter.has(r.project))
          .filter((r) => typeFilter.size === 0 || typeFilter.has(r.type))
          .map((r) => r.client),
      ),
    [allRows, projectFilter, typeFilter],
  );
  const projectOptions = useMemo(
    () =>
      uniqueSorted(
        allRows
          .filter((r) => clientFilter.size === 0 || clientFilter.has(r.client))
          .filter((r) => typeFilter.size === 0 || typeFilter.has(r.type))
          .map((r) => r.project),
      ),
    [allRows, clientFilter, typeFilter],
  );
  const typeOptions = useMemo(
    () =>
      uniqueSorted(
        allRows
          .filter((r) => clientFilter.size === 0 || clientFilter.has(r.client))
          .filter((r) => projectFilter.size === 0 || projectFilter.has(r.project))
          .map((r) => r.type),
      ),
    [allRows, clientFilter, projectFilter],
  );

  const rows = useMemo(() => {
    const filtered = allRows.filter((r) => {
      if (clientFilter.size > 0 && !clientFilter.has(r.client)) return false;
      if (projectFilter.size > 0 && !projectFilter.has(r.project)) return false;
      if (typeFilter.size > 0 && !typeFilter.has(r.type)) return false;
      return true;
    });
    if (!sort) return filtered;
    const { key, dir } = sort;
    return [...filtered].sort((a, b) => compareValues(a[key], b[key], dir));
  }, [allRows, clientFilter, projectFilter, typeFilter, sort]);

  const isUnreachable =
    cooling.error?.data?.code === "SERVICE_UNAVAILABLE" ||
    cooling.error?.data?.code === "PRECONDITION_FAILED";

  if (cooling.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-16 text-sm text-penguin-cool-gray">
        <Loader2 className="h-4 w-4 animate-spin" />
        Consultando SCADA (cooling en paralelo, ~52 containers)...
      </div>
    );
  }

  if (isUnreachable) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
        <div className="text-sm">
          <div className="font-medium text-rose-900">SCADA unreachable</div>
          <div className="mt-0.5 text-rose-700">{cooling.error?.message}</div>
        </div>
      </div>
    );
  }

  const filtersActive = clientFilter.size + projectFilter.size + typeFilter.size > 0;

  return (
    <div ref={pdfRef} className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-penguin-obsidian">Cooling por container</h3>
          <p className="text-xs text-penguin-cool-gray">
            {filtersActive ? `${rows.length} de ${allRows.length}` : `${allRows.length} containers`}{" "}
            · SCADA · umbrales:{" "}
            <span className="text-rose-600">ND &gt; {thresholds.ndWaterMax}°C</span> ·{" "}
            <span className="text-rose-600">Hydro &gt; {thresholds.hydroWaterMax}°C</span> · Q &lt;{" "}
            {thresholds.caudalMin} m³/h
          </p>
        </div>
        <div className="flex items-center gap-2" data-pdf-hide="true">
          <div className="flex items-center gap-1.5 text-[11px] text-penguin-cool-gray">
            <Thermometer className="h-3.5 w-3.5" />
            <span>SITE_BASELINE §8</span>
          </div>
          <ExportCsvButton<(typeof rows)[number]>
            filename={`cooling-${new Date().toISOString().slice(0, 10)}.csv`}
            columns={COOLING_CSV_COLUMNS}
            rows={rows}
          />
          <ExportPdfButton
            filename={`cooling-${new Date().toISOString().slice(0, 10)}.pdf`}
            title="Cooling por container"
            subtitle={`SCADA · ${rows.length} containers · ND>${thresholds.ndWaterMax}°C · Hydro>${thresholds.hydroWaterMax}°C · Q<${thresholds.caudalMin}m³/h`}
            targetRef={pdfRef}
          />
          <ThresholdsPopover
            thresholds={thresholds}
            onChange={setThresholds}
            onReset={resetThresholds}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-slate-200">
            <TableHead>
              <SortableHeader sortKey="container" sort={sort} onSort={setSort}>
                Container
              </SortableHeader>
            </TableHead>
            <TableHead>
              <span className="inline-flex items-center">
                <SortableHeader sortKey="client" sort={sort} onSort={setSort}>
                  Cliente
                </SortableHeader>
                <ColumnFilter
                  label="Cliente"
                  options={clientOptions}
                  selected={clientFilter}
                  onChange={setClientFilter}
                />
              </span>
            </TableHead>
            <TableHead>
              <span className="inline-flex items-center">
                <SortableHeader sortKey="project" sort={sort} onSort={setSort}>
                  Proyecto
                </SortableHeader>
                <ColumnFilter
                  label="Proyecto"
                  options={projectOptions}
                  selected={projectFilter}
                  onChange={setProjectFilter}
                />
              </span>
            </TableHead>
            <TableHead>
              <span className="inline-flex items-center">
                <SortableHeader sortKey="type" sort={sort} onSort={setSort}>
                  Tipo
                </SortableHeader>
                <ColumnFilter
                  label="Tipo"
                  options={typeOptions}
                  selected={typeFilter}
                  onChange={setTypeFilter}
                />
              </span>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader sortKey="waterIn" sort={sort} onSort={setSort} align="right">
                Agua in
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader sortKey="waterOut" sort={sort} onSort={setSort} align="right">
                Agua out
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader sortKey="delta" sort={sort} onSort={setSort} align="right">
                Δ
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader sortKey="flow" sort={sort} onSort={setSort} align="right">
                Caudal
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader sortKey="pressure" sort={sort} onSort={setSort} align="right">
                Presión
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader sortKey="coldAisle" sort={sort} onSort={setSort} align="right">
                Aire frío
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader sortKey="hotAisle" sort={sort} onSort={setSort} align="right">
                Aire cálido
              </SortableHeader>
            </TableHead>
            <TableHead>Alertas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const limit =
              r.client === "NORTHERN DATA" ? thresholds.ndWaterMax : thresholds.hydroWaterMax;
            const waterAlert = r.waterOut != null && r.waterOut >= limit;
            const waterWarn =
              !waterAlert && r.waterOut != null && r.waterOut >= limit - thresholds.waterWarnMargin;
            const caudalAlert = r.flow != null && r.flow < thresholds.caudalMin;
            const deltaAlert = r.delta != null && r.delta >= thresholds.deltaAlert;
            const deltaWarn = !deltaAlert && r.delta != null && r.delta >= thresholds.deltaWarn;
            // "Sin dato" only when SCADA returned no row at all. The query
            // already filters to the last 10 minutes via GETDATE() on the
            // server, so an empty latestTs really does mean the sensor was
            // offline during that window (avoids timezone-skew false positives).
            const noData = r.latestTs == null;

            const alerts: React.ReactNode[] = [];
            if (noData) alerts.push(<AlertChip key="s" label="Sin dato" tone="warn" />);
            if (waterAlert) alerts.push(<AlertChip key="wa" label="Agua alta" tone="alert" />);
            else if (waterWarn) alerts.push(<AlertChip key="ww" label="Agua cerca" tone="warn" />);
            if (caudalAlert) alerts.push(<AlertChip key="c" label="Caudal bajo" tone="alert" />);
            if (deltaAlert) alerts.push(<AlertChip key="da" label="Δ alto" tone="alert" />);
            else if (deltaWarn) alerts.push(<AlertChip key="dw" label="Δ medio" tone="warn" />);

            return (
              <TableRow key={`${r.container}-${r.client}`} className="border-slate-100">
                <TableCell className="font-medium text-penguin-obsidian">{r.container}</TableCell>
                <TableCell className="text-penguin-cool-gray">{r.client}</TableCell>
                <TableCell className="text-penguin-cool-gray">{r.project}</TableCell>
                <TableCell className="text-xs text-penguin-cool-gray">
                  {r.type}
                  {r.shape === "ndWaterAir" && (
                    <span className="ml-1 text-[10px] text-slate-400">· con aire</span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums text-penguin-obsidian">
                  {fmt(r.waterIn, 1, " °C")}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    waterAlert
                      ? "font-semibold text-rose-600"
                      : waterWarn
                        ? "font-semibold text-amber-600"
                        : "text-penguin-obsidian",
                  )}
                  title={`umbral ${limit}°C`}
                >
                  {fmt(r.waterOut, 1, " °C")}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    deltaAlert
                      ? "font-semibold text-rose-600"
                      : deltaWarn
                        ? "font-semibold text-amber-600"
                        : r.delta == null
                          ? "text-slate-400"
                          : "text-penguin-obsidian",
                  )}
                >
                  {fmt(r.delta, 1, " °C")}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    caudalAlert
                      ? "font-semibold text-rose-600"
                      : r.flow == null
                        ? "text-slate-400"
                        : "text-penguin-cool-gray",
                  )}
                  title={`mín ${thresholds.caudalMin} m³/h`}
                >
                  {fmt(r.flow, 1, " m³/h")}
                </TableCell>
                <TableCell className="text-right tabular-nums text-penguin-cool-gray">
                  {fmt(r.pressure, 2, " bar")}
                </TableCell>
                <TableCell className="text-right tabular-nums text-penguin-cool-gray">
                  {r.coldAisle != null ? fmt(r.coldAisle, 1, " °C") : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums text-penguin-cool-gray">
                  {r.hotAisle != null ? fmt(r.hotAisle, 1, " °C") : "—"}
                </TableCell>
                <TableCell>
                  {alerts.length === 0 ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                      OK
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">{alerts}</div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={12} className="py-12 text-center text-sm text-penguin-cool-gray">
                Sin containers con los filtros actuales.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
