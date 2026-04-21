"use client";

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
import { AlertTriangle, Loader2, RefreshCw, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

function formatNumber(value: string | number | null, digits = 2, suffix = "") {
  if (value == null) return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits > 0 ? Math.min(digits, 1) : 0,
  })}${suffix}`;
}

function computeEfficiency(activePowerKw: string | null, hashrateTh: string | null): number | null {
  const kw = Number(activePowerKw);
  const th = Number(hashrateTh);
  if (!Number.isFinite(kw) || !Number.isFinite(th) || th <= 0 || kw <= 0) return null;
  return (kw * 1000) / th; // W / (TH/s) === J/TH for steady-state
}

function efficiencyTone(wth: number) {
  if (wth <= 25) return "text-emerald-600";
  if (wth <= 35) return "text-amber-600";
  return "text-rose-600";
}

function formatClock(d: Date) {
  return d.toLocaleTimeString("es-AR", { hour12: false });
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-penguin-cool-gray">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <div className="text-2xl font-semibold tabular-nums text-penguin-obsidian">{value}</div>
        {unit && <div className="text-sm text-penguin-cool-gray">{unit}</div>}
      </div>
    </div>
  );
}

export default function Home() {
  const { intervalMs } = useAutoRefresh();
  const containers = trpc.containers.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchInterval: intervalMs,
  });

  const [search, setSearch] = useState("");
  const [hashingOnly, setHashingOnly] = useState(false);

  const isUnreachable =
    containers.error?.data?.code === "SERVICE_UNAVAILABLE" ||
    containers.error?.data?.code === "PRECONDITION_FAILED";

  const allRows = containers.data ?? [];
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRows.filter((c) => {
      if (hashingOnly && (Number(c.miners_hashing) || 0) <= 0) return false;
      if (q === "") return true;
      const haystack = [c.name, c.brand, c.model_name].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [allRows, search, hashingOnly]);

  const totalHashrate = rows.reduce((acc, c) => acc + (Number(c.hashrate_total) || 0), 0);
  const totalPower = rows.reduce((acc, c) => acc + (Number(c.active_power) || 0), 0);
  const onlineMiners = rows.reduce((acc, c) => acc + (Number(c.miners_online) || 0), 0);
  const hashingMiners = rows.reduce((acc, c) => acc + (Number(c.miners_hashing) || 0), 0);
  const fleetEff = totalHashrate > 0 && totalPower > 0 ? (totalPower * 1000) / totalHashrate : null;
  const lastUpdated = containers.dataUpdatedAt ? new Date(containers.dataUpdatedAt) : null;
  const hasFilter = search.trim() !== "" || hashingOnly;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-penguin-obsidian">
            Containers live
          </h2>
          <p className="mt-1 text-sm text-penguin-cool-gray">
            {allRows.length === 0
              ? "Cargando snapshot desde ICS..."
              : hasFilter
                ? `Mostrando ${rows.length} de ${allRows.length} containers`
                : `${allRows.length} containers · fuente ICS`}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {lastUpdated && (
            <span className="tabular-nums">Actualizado {formatClock(lastUpdated)}</span>
          )}
          <button
            type="button"
            onClick={() => containers.refetch()}
            disabled={containers.isFetching}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-penguin-obsidian shadow-sm transition-colors hover:border-penguin-lime/60 hover:bg-penguin-lime/10 disabled:opacity-50"
          >
            {containers.isFetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Refrescar
          </button>
        </div>
      </div>

      {isUnreachable && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div className="text-sm">
            <div className="font-medium text-rose-900">ICS unreachable — connect VPN</div>
            <div className="mt-0.5 text-rose-700">{containers.error?.message}</div>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Containers" value={rows.length ? String(rows.length) : "—"} />
        <Stat label="Hashrate" value={formatNumber(totalHashrate, 0)} unit="TH/s" />
        <Stat label="Potencia" value={formatNumber(totalPower, 1)} unit="kW" />
        <Stat
          label="Miners hashing"
          value={`${formatNumber(hashingMiners, 0)} / ${formatNumber(onlineMiners, 0)}`}
        />
      </section>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-penguin-obsidian">Containers</h3>
            <p className="text-xs text-penguin-cool-gray">
              {fleetEff != null
                ? `Eficiencia promedio${hasFilter ? " (filtro)" : " flota"}: ${formatNumber(fleetEff, 1)} W/TH`
                : "Esperando datos"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar container o modelo"
                className="h-8 w-56 rounded-md border border-slate-200 bg-white pl-8 pr-7 text-xs text-penguin-obsidian placeholder:text-slate-400 focus:border-penguin-violet focus:outline-none focus:ring-1 focus:ring-penguin-violet/40"
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
          </div>
        </div>

        {containers.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-penguin-cool-gray">
            <Loader2 className="h-4 w-4 animate-spin" />
            Consultando ICS...
          </div>
        ) : rows.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead>Container</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead className="text-right">Hashrate</TableHead>
                <TableHead className="text-right text-slate-400">Nominal</TableHead>
                <TableHead className="text-right">Miners online</TableHead>
                <TableHead className="text-right">Hashing</TableHead>
                <TableHead className="text-right">Potencia</TableHead>
                <TableHead className="text-right">Eficiencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => {
                const eff = computeEfficiency(c.active_power, c.hashrate_total);
                return (
                  <TableRow key={c.id} className="border-slate-100">
                    <TableCell className="font-medium text-penguin-obsidian">{c.name}</TableCell>
                    <TableCell className="text-penguin-cool-gray">
                      {c.brand && c.model_name
                        ? `${c.brand} ${c.model_name}`
                        : (c.model_name ?? "—")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-penguin-obsidian">
                      {formatNumber(c.hashrate_total, 0)}
                      <span className="ml-1 text-xs text-slate-400">TH/s</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-slate-400">
                      {formatNumber(c.hashrate_nominal, 0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(c.miners_online, 0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(c.miners_hashing, 0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(c.active_power, 1)}
                      <span className="ml-1 text-xs text-slate-400">kW</span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums font-medium",
                        eff != null ? efficiencyTone(eff) : "text-slate-400",
                      )}
                    >
                      {eff != null ? (
                        <>
                          {formatNumber(eff, 1)}
                          <span className="ml-1 text-xs font-normal opacity-70">W/TH</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : !isUnreachable && allRows.length > 0 ? (
          <div className="py-16 text-center text-sm text-penguin-cool-gray">
            Sin resultados con los filtros actuales.
          </div>
        ) : !isUnreachable && containers.error ? (
          <div className="py-16 text-center text-sm text-rose-600">{containers.error.message}</div>
        ) : !isUnreachable ? (
          <div className="py-16 text-center text-sm text-penguin-cool-gray">
            Sin containers — ¿ICS está poblada?
          </div>
        ) : null}
      </div>
    </div>
  );
}
