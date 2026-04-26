"use client";

import { ColumnFilter } from "@/components/dashboard/column-filter";
import { type CsvColumn, ExportCsvButton } from "@/components/dashboard/export-csv";
import { ExportPdfButton } from "@/components/dashboard/export-pdf";
import {
  type SortState,
  SortableHeader,
  compareValues,
} from "@/components/dashboard/sortable-header";
import { TrafoExpansion } from "@/components/dashboard/trafo-expansion";
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
import { AlertTriangle, ChevronDown, ChevronRight, Loader2, Zap } from "lucide-react";
import { Fragment, useMemo, useRef, useState } from "react";

type ElecSortKey =
  | "feeder"
  | "serves"
  | "kwNow"
  | "kwAvgLastHour"
  | "voltage"
  | "current"
  | "fp"
  | "frequency"
  | "energyNow";

function maxNonNull(...values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  return nums.length > 0 ? Math.max(...nums) : null;
}

function fmt(v: number | null | undefined, digits = 1, suffix = "") {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${v.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: Math.min(digits, 1),
  })}${suffix}`;
}

function fpTone(fp: number | null) {
  if (fp == null) return "text-slate-400";
  const abs = Math.abs(fp);
  if (abs >= 0.95) return "text-emerald-600";
  if (abs >= 0.9) return "text-amber-600";
  return "text-rose-600";
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

type ElecCsvRow = {
  feeder: string;
  serves: string;
  kwNow: number | null;
  kwAvgLastHour: number | null;
  voltageRS: number | null;
  voltageST: number | null;
  voltageTR: number | null;
  currentR: number | null;
  currentS: number | null;
  currentT: number | null;
  fp: number | null;
  frequency: number | null;
  energyNow: number | null;
  bajaKw: number | null;
  overheadKw: number | null;
  overheadPct: number | null;
};

const ELEC_CSV_COLUMNS: CsvColumn<ElecCsvRow>[] = [
  { header: "Alimentador", get: (r) => r.feeder },
  { header: "Sirve a", get: (r) => r.serves },
  { header: "Kw ahora", get: (r) => r.kwNow },
  { header: "Kw prom 1h", get: (r) => r.kwAvgLastHour },
  { header: "V_RS (V)", get: (r) => r.voltageRS },
  { header: "V_ST (V)", get: (r) => r.voltageST },
  { header: "V_TR (V)", get: (r) => r.voltageTR },
  { header: "I_R (A)", get: (r) => r.currentR },
  { header: "I_S (A)", get: (r) => r.currentS },
  { header: "I_T (A)", get: (r) => r.currentT },
  { header: "FP", get: (r) => r.fp },
  { header: "Frec. (Hz)", get: (r) => r.frequency },
  { header: "Baja kW", get: (r) => r.bajaKw },
  { header: "Overhead kW", get: (r) => r.overheadKw },
  { header: "Overhead %", get: (r) => r.overheadPct },
  { header: "Energía (counter)", get: (r) => r.energyNow },
];

/**
 * Three mini-cells stacked for R / S / T phases of a 3-phase value.
 * Dim the row when all values are null (offline / no data).
 */
function TriPhaseCell({
  a,
  b,
  c,
  digits = 1,
  unit,
}: {
  a: number | null;
  b: number | null;
  c: number | null;
  digits?: number;
  unit: string;
}) {
  const allNull = a == null && b == null && c == null;
  // Three-column grid: [label | value | unit] — keeps values right-aligned in
  // a single column and the unit suffix in its own column so it doesn't push
  // the last row's number off from the ones above.
  return (
    <div
      className={cn(
        "ml-auto inline-grid grid-cols-[auto_1fr_auto] items-baseline gap-x-1 text-[11px] leading-tight tabular-nums",
        allNull ? "text-slate-400" : "text-penguin-obsidian",
      )}
    >
      <span className="text-[9px] font-semibold uppercase text-slate-400">R</span>
      <span className="text-right">{fmt(a, digits)}</span>
      <span className="text-[9px] text-slate-400">{unit}</span>
      <span className="text-[9px] font-semibold uppercase text-slate-400">S</span>
      <span className="text-right">{fmt(b, digits)}</span>
      <span />
      <span className="text-[9px] font-semibold uppercase text-slate-400">T</span>
      <span className="text-right">{fmt(c, digits)}</span>
      <span />
    </div>
  );
}

export function ElectricoTable() {
  const { intervalMs } = useAutoRefresh();
  const electrico = trpc.core.site.electrico.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchInterval: intervalMs,
  });
  const [servesFilter, setServesFilter] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortState<ElecSortKey>>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const pdfRef = useRef<HTMLDivElement>(null);

  function toggleExpanded(feeder: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(feeder)) next.delete(feeder);
      else next.add(feeder);
      return next;
    });
  }

  function expandAll(feeders: string[]) {
    setExpanded(new Set(feeders));
  }

  function collapseAll() {
    setExpanded(new Set());
  }

  const isUnreachable =
    electrico.error?.data?.code === "SERVICE_UNAVAILABLE" ||
    electrico.error?.data?.code === "PRECONDITION_FAILED";

  const allRows = electrico.data ?? [];
  const servesOptions = useMemo(() => uniqueSorted(allRows.map((r) => r.serves)), [allRows]);

  type FeederRow = (typeof allRows)[number];
  function sortValue(r: FeederRow, key: ElecSortKey): string | number | null {
    switch (key) {
      case "feeder":
        return r.feeder;
      case "serves":
        return r.serves;
      case "kwNow":
        return r.kwNow;
      case "kwAvgLastHour":
        return r.kwAvgLastHour;
      case "voltage":
        return maxNonNull(r.voltageRS, r.voltageST, r.voltageTR);
      case "current":
        return maxNonNull(r.currentR, r.currentS, r.currentT);
      case "fp":
        return r.fp;
      case "frequency":
        return r.frequency;
      case "energyNow":
        return r.energyNow;
    }
  }

  const rows = useMemo(() => {
    const filtered = allRows.filter((r) => servesFilter.size === 0 || servesFilter.has(r.serves));
    if (!sort) return filtered;
    const { key, dir } = sort;
    return [...filtered].sort((a, b) => compareValues(sortValue(a, key), sortValue(b, key), dir));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRows, servesFilter, sort]);

  if (electrico.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-16 text-sm text-penguin-cool-gray">
        <Loader2 className="h-4 w-4 animate-spin" />
        Consultando SCADA (Alimentadores + Registros_AL##)...
      </div>
    );
  }

  if (isUnreachable) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
        <div className="text-sm">
          <div className="font-medium text-rose-900">SCADA unreachable</div>
          <div className="mt-0.5 text-rose-700">{electrico.error?.message}</div>
        </div>
      </div>
    );
  }

  const totalKwNow = rows.reduce((acc, r) => acc + (r.kwNow ?? 0), 0);
  const totalKwAvg = rows.reduce((acc, r) => acc + (r.kwAvgLastHour ?? 0), 0);
  const filtersActive = servesFilter.size > 0;

  return (
    <div ref={pdfRef} className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-penguin-obsidian">Eléctrico por alimentador</h3>
          <p className="text-xs text-penguin-cool-gray">
            {filtersActive ? `${rows.length} de ${allRows.length}` : `${rows.length} alimentadores`}{" "}
            · total ahora{" "}
            <span className="tabular-nums font-medium text-penguin-obsidian">
              {fmt(totalKwNow / 1000, 2, " MW")}
            </span>{" "}
            · promedio 1h{" "}
            <span className="tabular-nums text-penguin-cool-gray">
              {fmt(totalKwAvg / 1000, 2, " MW")}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2" data-pdf-hide="true">
          <div className="flex items-center gap-1.5 text-[11px] text-penguin-cool-gray">
            <Zap className="h-3.5 w-3.5" />
            <span>Alimentadores + Registros_AL*</span>
          </div>
          <button
            type="button"
            onClick={() =>
              expanded.size === rows.length ? collapseAll() : expandAll(rows.map((r) => r.feeder))
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-penguin-obsidian shadow-sm transition-colors hover:border-penguin-lime/60 hover:bg-penguin-lime/10"
          >
            {expanded.size === rows.length ? (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Colapsar todos
              </>
            ) : (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                Expandir todos
              </>
            )}
          </button>
          <ExportCsvButton<ElecCsvRow>
            filename={`electrico-${new Date().toISOString().slice(0, 10)}.csv`}
            columns={ELEC_CSV_COLUMNS}
            rows={rows}
          />
          <ExportPdfButton
            filename={`electrico-${new Date().toISOString().slice(0, 10)}.pdf`}
            title="Eléctrico por alimentador"
            subtitle={`SCADA · ${rows.length} alimentadores · ${fmt(totalKwNow / 1000, 2, " MW")} totales · ${expanded.size} expandidos`}
            targetRef={pdfRef}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-slate-200">
            <TableHead>
              <SortableHeader sortKey="feeder" sort={sort} onSort={setSort}>
                Alimentador
              </SortableHeader>
            </TableHead>
            <TableHead>
              <span className="inline-flex items-center">
                <SortableHeader sortKey="serves" sort={sort} onSort={setSort}>
                  Sirve a
                </SortableHeader>
                <ColumnFilter
                  label="Sirve a"
                  options={servesOptions}
                  selected={servesFilter}
                  onChange={setServesFilter}
                />
              </span>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader sortKey="kwNow" sort={sort} onSort={setSort} align="right">
                Kw ahora
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader sortKey="kwAvgLastHour" sort={sort} onSort={setSort} align="right">
                Kw prom 1h
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader sortKey="voltage" sort={sort} onSort={setSort} align="right">
                Tensión (L-L)
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader sortKey="current" sort={sort} onSort={setSort} align="right">
                Corriente
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader sortKey="fp" sort={sort} onSort={setSort} align="right">
                FP
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader sortKey="frequency" sort={sort} onSort={setSort} align="right">
                Frec.
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <span title="Suma del kW medido en los containers (380V)">Baja kW</span>
            </TableHead>
            <TableHead className="text-right">
              <span title="kW media (feeder) − kW baja (containers) = pérdida de trafo">
                Overhead
              </span>
            </TableHead>
            <TableHead className="text-right text-slate-400">
              <SortableHeader sortKey="energyNow" sort={sort} onSort={setSort} align="right">
                Energía
              </SortableHeader>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const isExpanded = expanded.has(r.feeder);
            return (
              <Fragment key={r.feeder}>
                <TableRow className="border-slate-100">
                  <TableCell className="font-medium text-penguin-obsidian">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(r.feeder)}
                      className="flex items-center gap-1.5 text-left hover:text-penguin-violet"
                      title={isExpanded ? "Ocultar trafos" : "Ver trafos"}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-penguin-violet" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      )}
                      {r.feeder}
                    </button>
                  </TableCell>
                  <TableCell className="text-penguin-cool-gray">{r.serves}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-penguin-obsidian">
                    {fmt(r.kwNow, 1, " kW")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-penguin-cool-gray">
                    {fmt(r.kwAvgLastHour, 1, " kW")}
                  </TableCell>
                  <TableCell className="text-right">
                    <TriPhaseCell
                      a={r.voltageRS}
                      b={r.voltageST}
                      c={r.voltageTR}
                      digits={1}
                      unit="V"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <TriPhaseCell
                      a={r.currentR}
                      b={r.currentS}
                      c={r.currentT}
                      digits={1}
                      unit="A"
                    />
                  </TableCell>
                  <TableCell className={cn("text-right tabular-nums", fpTone(r.fp))}>
                    {fmt(r.fp, 3)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-penguin-cool-gray">
                    {fmt(r.frequency, 2, " Hz")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-penguin-cool-gray">
                    {fmt(r.bajaKw, 1, " kW")}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      r.overheadPct == null
                        ? "text-slate-400"
                        : r.overheadPct >= 10
                          ? "text-rose-600 font-semibold"
                          : r.overheadPct >= 5
                            ? "text-amber-600"
                            : "text-emerald-600",
                    )}
                    title={
                      r.overheadKw != null
                        ? `${fmt(r.kwNow, 1, " kW")} media − ${fmt(r.bajaKw, 1, " kW")} baja = ${fmt(r.overheadKw, 1, " kW")}`
                        : "Sin suficiente data de baja"
                    }
                  >
                    {r.overheadPct != null ? (
                      <>
                        {fmt(r.overheadKw, 1)}
                        <span className="ml-1 text-xs text-slate-400">kW</span>
                        <div className="text-[10px] font-normal">{fmt(r.overheadPct, 1)}%</div>
                      </>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-slate-400">
                    {fmt(r.energyNow, 0)}
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="bg-slate-50/60">
                    <TableCell colSpan={11} className="p-0">
                      <TrafoExpansion feeder={r.feeder} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={11} className="py-12 text-center text-sm text-penguin-cool-gray">
                Sin resultados con los filtros actuales.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
