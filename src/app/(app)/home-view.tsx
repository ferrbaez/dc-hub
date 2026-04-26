"use client";

import { CoolingTable } from "@/components/dashboard/cooling-table";
import { ElectricoTable } from "@/components/dashboard/electrico-table";
import { ProductionTable } from "@/components/dashboard/production-table";
import { useAutoRefresh } from "@/lib/shell/auto-refresh";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Activity, AlertTriangle, Droplet, Loader2, RefreshCw, Zap } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

type View = "produccion" | "cooling" | "electrico";
const VIEWS: View[] = ["produccion", "cooling", "electrico"];

function formatNumber(value: string | number | null, digits = 2, suffix = "") {
  if (value == null) return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits > 0 ? Math.min(digits, 1) : 0,
  })}${suffix}`;
}

function formatClock(d: Date) {
  return d.toLocaleTimeString("es-AR", { hour12: false });
}

function TabCard({
  id,
  label,
  description,
  icon,
  value,
  unit,
  active,
  onSelect,
}: {
  id: View;
  label: string;
  description: string;
  icon: React.ReactNode;
  value: string;
  unit?: string;
  active: boolean;
  onSelect: (v: View) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={cn(
        "group flex flex-col items-start rounded-lg border p-4 text-left transition-all",
        active
          ? "border-penguin-lime/80 bg-penguin-lime/10 shadow-sm ring-1 ring-penguin-lime/40"
          : "border-slate-200 bg-white hover:border-penguin-lime/40 hover:bg-penguin-lime/5",
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div
          className={cn(
            "grid h-8 w-8 place-items-center rounded-md transition-colors",
            active
              ? "bg-penguin-obsidian text-penguin-lime"
              : "bg-slate-100 text-penguin-cool-gray group-hover:bg-penguin-obsidian group-hover:text-penguin-lime",
          )}
        >
          {icon}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-penguin-cool-gray">
          {label}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <div className="text-2xl font-semibold tabular-nums text-penguin-obsidian">{value}</div>
        {unit && <div className="text-sm text-penguin-cool-gray">{unit}</div>}
      </div>
      <div className="mt-1 text-xs text-penguin-cool-gray">{description}</div>
    </button>
  );
}

export function HomeView() {
  const { intervalMs } = useAutoRefresh();
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view") as View | null;
  const activeView: View = VIEWS.includes(viewParam as View) ? (viewParam as View) : "produccion";

  const containers = trpc.core.containers.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchInterval: intervalMs,
  });
  const electrico = trpc.core.site.electrico.useQuery(undefined, {
    refetchOnWindowFocus: false,
    // Only actively refresh when Eléctrico is showing. Other views get a
    // stale snapshot for the summary stat without polling.
    refetchInterval: activeView === "electrico" ? intervalMs : false,
    staleTime: 30_000,
  });
  const cooling = trpc.core.site.cooling.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchInterval: activeView === "cooling" ? intervalMs : false,
    staleTime: 30_000,
  });

  const isUnreachable =
    containers.error?.data?.code === "SERVICE_UNAVAILABLE" ||
    containers.error?.data?.code === "PRECONDITION_FAILED";

  const allRows = containers.data ?? [];
  const totalHashrate = allRows.reduce((acc, c) => acc + (Number(c.hashrate_total) || 0), 0);
  const totalPower = allRows.reduce((acc, c) => acc + (Number(c.active_power) || 0), 0);
  const hashingMiners = allRows.reduce((acc, c) => acc + (Number(c.miners_hashing) || 0), 0);
  const totalMiners = allRows.reduce((acc, c) => acc + (Number(c.total_miners) || 0), 0);

  const totalFeederKwNow = (electrico.data ?? []).reduce((acc, r) => acc + (r.kwNow ?? 0), 0);
  // Summary uses default thresholds (ND 45°C, Hydro 40°C, warn margin 3°C).
  // The table itself honours per-user configured thresholds from localStorage.
  const coolingAlerts = (cooling.data ?? []).filter((r) => {
    const limit = r.client === "NORTHERN DATA" ? 45 : 40;
    return r.waterOut != null && r.waterOut >= limit;
  }).length;
  const coolingWarnings = (cooling.data ?? []).filter((r) => {
    const limit = r.client === "NORTHERN DATA" ? 45 : 40;
    return r.waterOut != null && r.waterOut >= limit - 3 && r.waterOut < limit;
  }).length;

  const lastUpdated = containers.dataUpdatedAt ? new Date(containers.dataUpdatedAt) : null;

  function setView(v: View) {
    const params = new URLSearchParams(searchParams);
    if (v === "produccion") {
      params.delete("view");
    } else {
      params.set("view", v);
    }
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-penguin-obsidian">
            Sitio — vista operativa
          </h2>
          <p className="mt-1 text-sm text-penguin-cool-gray">
            Elegí una tarjeta para cambiar entre <strong>Producción</strong> (ICS),{" "}
            <strong>Cooling</strong> (SCADA térmico) y <strong>Eléctrico</strong> (Alimentadores
            SCADA).
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {lastUpdated && (
            <span className="tabular-nums">Actualizado {formatClock(lastUpdated)}</span>
          )}
          <button
            type="button"
            onClick={() => {
              containers.refetch();
              if (activeView === "electrico") electrico.refetch();
              if (activeView === "cooling") cooling.refetch();
            }}
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

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TabCard
          id="produccion"
          label="Producción"
          description={`${allRows.length} containers · ${formatNumber(hashingMiners, 0)} / ${formatNumber(totalMiners, 0)} miners hashing`}
          icon={<Activity className="h-4 w-4" />}
          value={formatNumber(totalHashrate, 0)}
          unit="TH/s"
          active={activeView === "produccion"}
          onSelect={setView}
        />
        <TabCard
          id="cooling"
          label="Cooling"
          description={
            cooling.isLoading
              ? "Consultando SCADA..."
              : coolingAlerts > 0
                ? `${coolingAlerts} alerta${coolingAlerts === 1 ? "" : "s"} · ${coolingWarnings} warn`
                : coolingWarnings > 0
                  ? `${coolingWarnings} warn · sin alertas`
                  : "Sin alertas en la muestra"
          }
          icon={<Droplet className="h-4 w-4" />}
          value={
            cooling.isLoading
              ? "…"
              : coolingAlerts > 0
                ? String(coolingAlerts)
                : coolingWarnings > 0
                  ? String(coolingWarnings)
                  : "OK"
          }
          unit={coolingAlerts > 0 || coolingWarnings > 0 ? "" : undefined}
          active={activeView === "cooling"}
          onSelect={setView}
        />
        <TabCard
          id="electrico"
          label="Eléctrico"
          description={
            electrico.isLoading
              ? "Consultando SCADA..."
              : `${(electrico.data ?? []).length} alimentadores · ICS ${formatNumber(totalPower / 1000, 2)} MW`
          }
          icon={<Zap className="h-4 w-4" />}
          value={electrico.isLoading ? "…" : formatNumber(totalFeederKwNow / 1000, 2)}
          unit="MW"
          active={activeView === "electrico"}
          onSelect={setView}
        />
      </section>

      {activeView === "produccion" &&
        (containers.isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-16 text-sm text-penguin-cool-gray">
            <Loader2 className="h-4 w-4 animate-spin" />
            Consultando ICS...
          </div>
        ) : (
          <ProductionTable rows={allRows} />
        ))}

      {activeView === "cooling" && <CoolingTable />}
      {activeView === "electrico" && <ElectricoTable />}
    </div>
  );
}
