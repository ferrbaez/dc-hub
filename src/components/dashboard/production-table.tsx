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
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { Fragment, useMemo, useRef, useState } from "react";

type GroupBy = "none" | "customer_name" | "project_name";

type ProdSortKey =
  | "name"
  | "customer_name"
  | "project_name"
  | "hashrate_total"
  | "hashrate_nominal"
  | "hashing"
  | "online_uptime"
  | "hashing_uptime"
  | "repairs"
  | "active_power"
  | "theoretical_consumption"
  | "efficiency";

type Row = {
  id: string;
  name: string;
  brand: string | null;
  model_name: string | null;
  customer_name: string | null;
  project_name: string | null;
  hashrate_total: string | null;
  hashrate_nominal: string | null;
  total_miners: string | null;
  miners_online: string | null;
  miners_hashing: string | null;
  miners_offline: string | null;
  miners_sleeping: string | null;
  miners_failing: string | null;
  active_power: string | null;
  theoretical_consumption: string | null;
  online_uptime_pct: string | null;
  hashing_uptime_pct: string | null;
};

function fmt(value: string | number | null | undefined, digits = 2, suffix = "") {
  if (value == null) return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits > 0 ? Math.min(digits, 1) : 0,
  })}${suffix}`;
}

function computeEfficiency(kw: string | null, th: string | null): number | null {
  const kwN = Number(kw);
  const thN = Number(th);
  if (!Number.isFinite(kwN) || !Number.isFinite(thN) || thN <= 0 || kwN <= 0) return null;
  return (kwN * 1000) / thN;
}

function efficiencyTone(wth: number) {
  if (wth <= 25) return "text-emerald-600";
  if (wth <= 35) return "text-amber-600";
  return "text-rose-600";
}

function uptimeTone(pct: number | null) {
  if (pct == null) return "text-slate-400";
  if (pct >= 95) return "text-emerald-600 font-semibold";
  if (pct >= 90) return "text-amber-600 font-semibold";
  return "text-rose-600 font-semibold";
}

/**
 * Uptime fallback chain:
 *   1) historical 24h average from container_histories (if ICS user has SELECT)
 *   2) current-snapshot health: miners_{online,hashing} / total_miners
 *
 * Returns both the percentage and whether we fell back (for UI hinting).
 */
function uptimePctWithFallback(
  r: Row,
  kind: "online" | "hashing",
): { value: number | null; isSnapshot: boolean } {
  const hist = kind === "online" ? r.online_uptime_pct : r.hashing_uptime_pct;
  if (hist != null) return { value: Number(hist), isSnapshot: false };
  const total = Number(r.total_miners) || 0;
  if (total <= 0) return { value: null, isSnapshot: true };
  const numerator =
    kind === "online" ? Number(r.miners_online) || 0 : Number(r.miners_hashing) || 0;
  return { value: (numerator / total) * 100, isSnapshot: true };
}

function uniqueSorted(values: (string | null | undefined)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => !!v))).sort((a, b) =>
    a.localeCompare(b),
  );
}

const PRODUCTION_CSV_COLUMNS: CsvColumn<Row>[] = [
  { header: "Container", get: (r) => r.name },
  { header: "Cliente", get: (r) => r.customer_name },
  { header: "Proyecto", get: (r) => r.project_name },
  {
    header: "Online uptime 24h (%)",
    get: (r) =>
      r.online_uptime_pct != null ? Math.round(Number(r.online_uptime_pct) * 10) / 10 : null,
  },
  {
    header: "Hashing uptime 24h (%)",
    get: (r) =>
      r.hashing_uptime_pct != null ? Math.round(Number(r.hashing_uptime_pct) * 10) / 10 : null,
  },
  { header: "Hashrate (TH/s)", get: (r) => (r.hashrate_total ? Number(r.hashrate_total) : null) },
  {
    header: "Nominal (TH/s)",
    get: (r) => (r.hashrate_nominal ? Number(r.hashrate_nominal) : null),
  },
  { header: "Total miners", get: (r) => (r.total_miners ? Number(r.total_miners) : null) },
  { header: "Online", get: (r) => (r.miners_online ? Number(r.miners_online) : null) },
  { header: "Hashing", get: (r) => (r.miners_hashing ? Number(r.miners_hashing) : null) },
  { header: "Offline", get: (r) => (r.miners_offline ? Number(r.miners_offline) : null) },
  { header: "Sleeping", get: (r) => (r.miners_sleeping ? Number(r.miners_sleeping) : null) },
  { header: "Failing", get: (r) => (r.miners_failing ? Number(r.miners_failing) : null) },
  {
    header: "En reparación",
    get: (r) => {
      const total = Number(r.total_miners) || 0;
      const hashing = Number(r.miners_hashing) || 0;
      return total > 0 ? total - hashing : 0;
    },
  },
  { header: "Potencia (kW)", get: (r) => (r.active_power ? Number(r.active_power) : null) },
  {
    header: "Teórica (kW)",
    get: (r) => (r.theoretical_consumption ? Number(r.theoretical_consumption) : null),
  },
  {
    header: "Eficiencia (W/TH)",
    get: (r) => {
      const eff = computeEfficiency(r.active_power, r.hashrate_total);
      return eff != null ? Math.round(eff * 10) / 10 : null;
    },
  },
];

export function ProductionTable({ rows: allRows }: { rows: Row[] }) {
  const [search, setSearch] = useState("");
  const [hashingOnly, setHashingOnly] = useState(false);
  const [clientFilter, setClientFilter] = useState<Set<string>>(new Set());
  const [projectFilter, setProjectFilter] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortState<ProdSortKey>>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const pdfRef = useRef<HTMLDivElement>(null);

  // Cascading filter options: each column's dropdown shows only values that
  // pass the OTHER active filters. Selecting ZPJV hides non-ZPJV projects.
  const clientOptions = useMemo(
    () =>
      uniqueSorted(
        allRows
          .filter((r) => projectFilter.size === 0 || projectFilter.has(r.project_name ?? ""))
          .map((r) => r.customer_name),
      ),
    [allRows, projectFilter],
  );
  const projectOptions = useMemo(
    () =>
      uniqueSorted(
        allRows
          .filter((r) => clientFilter.size === 0 || clientFilter.has(r.customer_name ?? ""))
          .map((r) => r.project_name),
      ),
    [allRows, clientFilter],
  );

  function sortValue(c: Row, key: ProdSortKey): string | number | null {
    switch (key) {
      case "name":
        return c.name;
      case "customer_name":
        return c.customer_name;
      case "project_name":
        return c.project_name;
      case "hashrate_total":
        return c.hashrate_total != null ? Number(c.hashrate_total) : null;
      case "hashrate_nominal":
        return c.hashrate_nominal != null ? Number(c.hashrate_nominal) : null;
      case "hashing":
        return Number(c.miners_hashing) || 0;
      case "online_uptime":
        return uptimePctWithFallback(c, "online").value;
      case "hashing_uptime":
        return uptimePctWithFallback(c, "hashing").value;
      case "repairs": {
        const total = Number(c.total_miners) || 0;
        const hashing = Number(c.miners_hashing) || 0;
        return total > 0 ? total - hashing : 0;
      }
      case "active_power":
        return c.active_power != null ? Number(c.active_power) : null;
      case "theoretical_consumption":
        return c.theoretical_consumption != null ? Number(c.theoretical_consumption) : null;
      case "efficiency":
        return computeEfficiency(c.active_power, c.hashrate_total);
    }
  }

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = allRows.filter((c) => {
      if (hashingOnly && (Number(c.miners_hashing) || 0) <= 0) return false;
      if (clientFilter.size > 0 && !clientFilter.has(c.customer_name ?? "")) return false;
      if (projectFilter.size > 0 && !projectFilter.has(c.project_name ?? "")) return false;
      if (q === "") return true;
      const haystack = [c.name, c.customer_name, c.project_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
    if (!sort) return filtered;
    const { key, dir } = sort;
    return [...filtered].sort((a, b) => compareValues(sortValue(a, key), sortValue(b, key), dir));
  }, [allRows, search, hashingOnly, clientFilter, projectFilter, sort]);

  const filtersActive =
    search.trim() !== "" || hashingOnly || clientFilter.size > 0 || projectFilter.size > 0;

  // Group-by: cluster filtered+sorted rows by the chosen key.
  const groups = useMemo(() => {
    if (groupBy === "none") return null;
    const map = new Map<string, Row[]>();
    for (const row of rows) {
      const key = (row[groupBy] as string | null) ?? "(sin asignar)";
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [rows, groupBy]);

  function toggleGroup(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function groupAggregates(groupRows: Row[]) {
    let hashrate = 0;
    let nominal = 0;
    let power = 0;
    let theoretical = 0;
    let hashing = 0;
    let online = 0;
    let total = 0;
    let onlineUpSum = 0;
    let onlineUpCnt = 0;
    let hashingUpSum = 0;
    let hashingUpCnt = 0;
    for (const r of groupRows) {
      hashrate += Number(r.hashrate_total) || 0;
      nominal += Number(r.hashrate_nominal) || 0;
      power += Number(r.active_power) || 0;
      theoretical += Number(r.theoretical_consumption) || 0;
      hashing += Number(r.miners_hashing) || 0;
      online += Number(r.miners_online) || 0;
      total += Number(r.total_miners) || 0;
      if (r.online_uptime_pct != null) {
        onlineUpSum += Number(r.online_uptime_pct);
        onlineUpCnt++;
      }
      if (r.hashing_uptime_pct != null) {
        hashingUpSum += Number(r.hashing_uptime_pct);
        hashingUpCnt++;
      }
    }
    const repairs = Math.max(0, total - hashing);
    // Fallback chain for uptime: historical average → snapshot (online/total, hashing/total).
    const onlineUptimeAvg =
      onlineUpCnt > 0 ? onlineUpSum / onlineUpCnt : total > 0 ? (online / total) * 100 : null;
    const hashingUptimeAvg =
      hashingUpCnt > 0 ? hashingUpSum / hashingUpCnt : total > 0 ? (hashing / total) * 100 : null;
    const eff = hashrate > 0 && power > 0 ? (power * 1000) / hashrate : null;
    return {
      count: groupRows.length,
      hashrate,
      nominal,
      power,
      theoretical,
      hashing,
      online,
      total,
      repairs,
      onlineUptimeAvg,
      hashingUptimeAvg,
      eff,
    };
  }

  function renderRow(c: Row) {
    const eff = computeEfficiency(c.active_power, c.hashrate_total);
    const online = Number(c.miners_online) || 0;
    const hashing = Number(c.miners_hashing) || 0;
    const total = Number(c.total_miners) || 0;
    const repairs = total > 0 ? total - hashing : 0;
    const healthPct = total > 0 ? (hashing / total) * 100 : null;
    const onlineUp = uptimePctWithFallback(c, "online");
    const hashingUp = uptimePctWithFallback(c, "hashing");
    return (
      <TableRow key={c.id} className="border-slate-100">
        <TableCell className="font-medium text-penguin-obsidian">{c.name}</TableCell>
        <TableCell className="text-penguin-cool-gray">{c.customer_name ?? "—"}</TableCell>
        <TableCell className="text-penguin-cool-gray">{c.project_name ?? "—"}</TableCell>
        <TableCell className="text-right tabular-nums text-penguin-obsidian">
          {fmt(c.hashrate_total, 0)}
          <span className="ml-1 text-xs text-slate-400">TH/s</span>
        </TableCell>
        <TableCell className="text-right tabular-nums text-slate-400">
          {fmt(c.hashrate_nominal, 0)}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          <span
            className={cn(
              "font-semibold",
              healthPct == null
                ? "text-slate-400"
                : healthPct >= 95
                  ? "text-emerald-600"
                  : healthPct >= 85
                    ? "text-amber-600"
                    : "text-rose-600",
            )}
          >
            {fmt(hashing, 0)}
          </span>
          <span className="mx-1 text-slate-400">/</span>
          <span className="text-penguin-cool-gray">{fmt(online, 0)}</span>
          <span className="mx-1 text-slate-400">/</span>
          <span className="text-slate-400">{fmt(total, 0)}</span>
        </TableCell>
        <TableCell
          className={cn(
            "text-right tabular-nums",
            repairs > 0 ? "font-medium text-rose-600" : "text-slate-400",
          )}
          title={`total ${total} − hashing ${hashing} = ${repairs}`}
        >
          {repairs > 0 ? fmt(repairs, 0) : "—"}
        </TableCell>
        <TableCell
          className={cn("text-right tabular-nums", uptimeTone(onlineUp.value))}
          title={
            onlineUp.isSnapshot
              ? "snapshot (miners_online / total_miners) — histórico 24h no disponible"
              : "promedio 24h de container_histories"
          }
        >
          {onlineUp.value != null ? `${fmt(onlineUp.value, 1)}%` : "—"}
        </TableCell>
        <TableCell
          className={cn("text-right tabular-nums", uptimeTone(hashingUp.value))}
          title={
            hashingUp.isSnapshot
              ? "snapshot (miners_hashing / total_miners) — histórico 24h no disponible"
              : "promedio 24h de container_histories"
          }
        >
          {hashingUp.value != null ? `${fmt(hashingUp.value, 1)}%` : "—"}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {fmt(c.active_power, 1)}
          <span className="ml-1 text-xs text-slate-400">kW</span>
        </TableCell>
        <TableCell className="text-right tabular-nums text-slate-400">
          {fmt(c.theoretical_consumption, 1)}
        </TableCell>
        <TableCell
          className={cn(
            "text-right tabular-nums font-medium",
            eff != null ? efficiencyTone(eff) : "text-slate-400",
          )}
        >
          {eff != null ? (
            <>
              {fmt(eff, 1)}
              <span className="ml-1 text-xs font-normal opacity-70">W/TH</span>
            </>
          ) : (
            "—"
          )}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div ref={pdfRef} className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-penguin-obsidian">Producción por container</h3>
          <p className="text-xs text-penguin-cool-gray">
            {filtersActive
              ? `${rows.length} de ${allRows.length} containers`
              : `${allRows.length} containers · fuente ICS`}
          </p>
        </div>
        <div className="flex items-center gap-2" data-pdf-hide="true">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar container, cliente, proyecto"
              className="h-8 w-64 rounded-md border border-slate-200 bg-white pl-8 pr-7 text-xs text-penguin-obsidian placeholder:text-slate-400 focus:border-penguin-violet focus:outline-none focus:ring-1 focus:ring-penguin-violet/40"
            />
            {search && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setSearch("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-penguin-obsidian"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setHashingOnly((v) => !v)}
            className={cn(
              "h-8 rounded-md border px-3 text-xs font-medium transition-colors",
              hashingOnly
                ? "border-penguin-lime/60 bg-penguin-lime/20 text-penguin-obsidian"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
            )}
          >
            Solo hashing
          </button>
          <label className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-penguin-obsidian">
            <span className="text-penguin-cool-gray">Agrupar</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="bg-transparent text-xs text-penguin-obsidian focus:outline-none"
            >
              <option value="none">—</option>
              <option value="customer_name">Cliente</option>
              <option value="project_name">Proyecto</option>
            </select>
          </label>
          <ExportCsvButton<Row>
            filename={`produccion-${new Date().toISOString().slice(0, 10)}.csv`}
            columns={PRODUCTION_CSV_COLUMNS}
            rows={rows}
          />
          <ExportPdfButton
            filename={`produccion-${new Date().toISOString().slice(0, 10)}.pdf`}
            title="Producción por container"
            subtitle={`Fuente: ICS · ${rows.length} containers${groupBy !== "none" ? ` · agrupado por ${groupBy === "customer_name" ? "cliente" : "proyecto"}` : ""}`}
            targetRef={pdfRef}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-slate-200">
            <TableHead>
              <SortableHeader sortKey="name" sort={sort} onSort={setSort}>
                Container
              </SortableHeader>
            </TableHead>
            <TableHead>
              <span className="inline-flex items-center">
                <SortableHeader sortKey="customer_name" sort={sort} onSort={setSort}>
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
                <SortableHeader sortKey="project_name" sort={sort} onSort={setSort}>
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
            <TableHead className="text-right">
              <SortableHeader sortKey="hashrate_total" sort={sort} onSort={setSort} align="right">
                Hashrate
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right text-slate-400">
              <SortableHeader sortKey="hashrate_nominal" sort={sort} onSort={setSort} align="right">
                Nominal
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader sortKey="hashing" sort={sort} onSort={setSort} align="right">
                Hashing / Online / Total
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader sortKey="repairs" sort={sort} onSort={setSort} align="right">
                En reparación
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader sortKey="online_uptime" sort={sort} onSort={setSort} align="right">
                Online Uptime
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader sortKey="hashing_uptime" sort={sort} onSort={setSort} align="right">
                Hashing Uptime
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader sortKey="active_power" sort={sort} onSort={setSort} align="right">
                Potencia
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right text-slate-400">
              <SortableHeader
                sortKey="theoretical_consumption"
                sort={sort}
                onSort={setSort}
                align="right"
              >
                Teórica
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader sortKey="efficiency" sort={sort} onSort={setSort} align="right">
                W/TH
              </SortableHeader>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups
            ? groups.map(([key, groupRows]) => {
                const agg = groupAggregates(groupRows);
                const isCollapsed = collapsed.has(key);
                return (
                  <Fragment key={`group-${key}`}>
                    <TableRow className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                      <TableCell className="py-2">
                        <button
                          type="button"
                          onClick={() => toggleGroup(key)}
                          className="flex items-center gap-1.5 text-left"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5 text-penguin-cool-gray" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-penguin-cool-gray" />
                          )}
                          <span className="text-sm font-semibold text-penguin-obsidian">{key}</span>
                        </button>
                      </TableCell>
                      <TableCell className="text-[11px] text-penguin-cool-gray">
                        {groupBy === "customer_name" ? "" : `${agg.count} cont.`}
                      </TableCell>
                      <TableCell className="text-[11px] text-penguin-cool-gray">
                        {groupBy === "project_name" ? "" : `${agg.count} cont.`}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-penguin-obsidian">
                        {fmt(agg.hashrate, 0)}
                        <span className="ml-1 text-xs font-normal text-slate-400">TH/s</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-slate-400">
                        {fmt(agg.nominal, 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className="text-emerald-700">{fmt(agg.hashing, 0)}</span>
                        <span className="mx-1 text-slate-400">/</span>
                        <span className="text-penguin-cool-gray">{fmt(agg.online, 0)}</span>
                        <span className="mx-1 text-slate-400">/</span>
                        <span className="text-slate-500">{fmt(agg.total, 0)}</span>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          agg.repairs > 0 ? "text-rose-600" : "text-slate-400",
                        )}
                      >
                        {agg.repairs > 0 ? fmt(agg.repairs, 0) : "—"}
                      </TableCell>
                      <TableCell
                        className={cn("text-right tabular-nums", uptimeTone(agg.onlineUptimeAvg))}
                      >
                        {agg.onlineUptimeAvg != null ? `${fmt(agg.onlineUptimeAvg, 1)}%` : "—"}
                      </TableCell>
                      <TableCell
                        className={cn("text-right tabular-nums", uptimeTone(agg.hashingUptimeAvg))}
                      >
                        {agg.hashingUptimeAvg != null ? `${fmt(agg.hashingUptimeAvg, 1)}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-penguin-obsidian">
                        {fmt(agg.power, 1)}
                        <span className="ml-1 text-xs font-normal text-slate-400">kW</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-slate-400">
                        {fmt(agg.theoretical, 1)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          agg.eff != null ? efficiencyTone(agg.eff) : "text-slate-400",
                        )}
                      >
                        {agg.eff != null ? (
                          <>
                            {fmt(agg.eff, 1)}
                            <span className="ml-1 text-xs font-normal opacity-70">W/TH</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                    {!isCollapsed && groupRows.map((c) => renderRow(c))}
                  </Fragment>
                );
              })
            : rows.map((c) => renderRow(c))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={12} className="py-12 text-center text-sm text-penguin-cool-gray">
                Sin resultados con los filtros actuales.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
