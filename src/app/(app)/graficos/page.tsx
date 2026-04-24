"use client";

import { Gauge } from "@/components/dashboard/gauge";
import { getProjectContract } from "@/lib/constants/project-contracts";
import { useAutoRefresh } from "@/lib/shell/auto-refresh";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { AreaChart, BarChart, Card } from "@tremor/react";
import {
  Activity,
  AlertTriangle,
  CloudRain,
  Droplets,
  Loader2,
  Thermometer,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

type RangeKey = "6h" | "24h" | "7d" | "30d";

const RANGES: { key: RangeKey; label: string; hours: number }[] = [
  { key: "6h", label: "6h", hours: 6 },
  { key: "24h", label: "24h", hours: 24 },
  { key: "7d", label: "7d", hours: 24 * 7 },
  { key: "30d", label: "30d", hours: 24 * 30 },
];

// Site-wide contract thresholds per SITE_BASELINE §1.
const CONTRACT_MW = 100;
const CONTRACT_CAP_MW = 105;

function fmt(n: number | null | undefined, digits = 1, suffix = ""): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: Math.min(1, digits),
  })}${suffix}`;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  unit,
  hint,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  tone?: "default" | "lime" | "violet" | "amber" | "rose";
}) {
  const bg = {
    default: "bg-white",
    lime: "bg-penguin-lime/10",
    violet: "bg-penguin-violet/10",
    amber: "bg-amber-50",
    rose: "bg-rose-50",
  }[tone];
  const iconBg = {
    default: "bg-slate-100 text-slate-600",
    lime: "bg-penguin-obsidian text-penguin-lime",
    violet: "bg-penguin-violet text-white",
    amber: "bg-amber-500 text-white",
    rose: "bg-rose-500 text-white",
  }[tone];
  return (
    <div className={cn("rounded-lg border border-slate-200 p-4 shadow-sm", bg)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-penguin-cool-gray">
          {label}
        </span>
        <div className={cn("grid h-6 w-6 place-items-center rounded-md", iconBg)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <div className="text-2xl font-semibold tabular-nums text-penguin-obsidian">{value}</div>
        {unit && <div className="text-xs text-penguin-cool-gray">{unit}</div>}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-penguin-cool-gray">{hint}</div>}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Card className="!bg-white !ring-1 !ring-slate-200 !shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-penguin-cool-gray" />}
            <h3 className="text-sm font-semibold text-penguin-obsidian">{title}</h3>
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-penguin-cool-gray">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center gap-2 text-sm text-penguin-cool-gray">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

function SourceError({ message }: { message?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50 p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
      <div className="text-sm">
        <div className="font-medium text-rose-900">Fuente no disponible</div>
        <div className="mt-0.5 text-rose-700">{message}</div>
      </div>
    </div>
  );
}

export default function GraficosPage() {
  const { intervalMs } = useAutoRefresh();
  const [range, setRange] = useState<RangeKey>("24h");
  const hours = RANGES.find((r) => r.key === range)?.hours ?? 24;

  const common = {
    refetchOnWindowFocus: false,
    refetchInterval: intervalMs,
    staleTime: 30_000,
  };

  // Real-time (no range dependency) — refresh with the auto-refresh interval.
  const projects = trpc.site.projectsRollup.useQuery(undefined, common);
  const tariffs = trpc.site.tariffAllocations.useQuery(undefined, {
    ...common,
    staleTime: 5 * 60_000,
  });
  const weather = trpc.site.weatherLatest.useQuery(undefined, common);
  const feeders = trpc.site.electrico.useQuery(undefined, common);

  // Range-dependent time series.
  const powerWeather = trpc.site.timeseriesPowerWithWeather.useQuery({ hours }, common);
  const pue = trpc.site.timeseriesPue.useQuery({ hours }, common);
  const coolingTemp = trpc.site.timeseriesCooling.useQuery({ hours }, common);

  // Derived KPIs
  const totalSitePowerKw = (feeders.data ?? []).reduce((acc, f) => acc + (f.kwNow ?? 0), 0);
  const totalSitePowerMw = totalSitePowerKw / 1000;

  const totalHashrateTh = (projects.data ?? []).reduce(
    (acc, p) => acc + (p.hashrate_total_ths ?? 0),
    0,
  );
  const totalHashratePh = totalHashrateTh / 1000;

  const totalMiners = (projects.data ?? []).reduce((acc, p) => acc + p.total_miners, 0);
  const hashingMiners = (projects.data ?? []).reduce((acc, p) => acc + p.miners_hashing, 0);
  const onlineMiners = (projects.data ?? []).reduce((acc, p) => acc + p.miners_online, 0);

  // Weighted uptime averages across projects (weighted by total_miners).
  // Falls back to current-snapshot health (hashing/total, online/total) when
  // the 24h history isn't available (ICS user usually lacks SELECT on
  // container_histories).
  const globalUptime = useMemo(() => {
    const rows = (projects.data ?? []).filter(
      (p) => p.online_uptime_pct != null && p.hashing_uptime_pct != null && p.total_miners > 0,
    );
    if (rows.length > 0) {
      let wOnline = 0;
      let wHashing = 0;
      let wTotal = 0;
      for (const p of rows) {
        wOnline += (p.online_uptime_pct ?? 0) * p.total_miners;
        wHashing += (p.hashing_uptime_pct ?? 0) * p.total_miners;
        wTotal += p.total_miners;
      }
      return {
        online: wTotal > 0 ? wOnline / wTotal : null,
        hashing: wTotal > 0 ? wHashing / wTotal : null,
        isSnapshot: false,
      };
    }
    // Fallback: instantaneous health from current snapshot.
    if (totalMiners > 0) {
      return {
        online: (onlineMiners / totalMiners) * 100,
        hashing: (hashingMiners / totalMiners) * 100,
        isSnapshot: true,
      };
    }
    return { online: null, hashing: null, isSnapshot: false };
  }, [projects.data, totalMiners, onlineMiners, hashingMiners]);

  // Merge contract allocations (DB tariffs → Core Clients constants fallback).
  const projectWithContract = useMemo(() => {
    const tariffMap = new Map((tariffs.data ?? []).map((t) => [t.project_id_external, t]));
    return (projects.data ?? []).map((p) => {
      const dbTariff = tariffMap.get(p.project_name);
      const constantContract = getProjectContract(p.project_name);
      const allocationMw = dbTariff?.allocation_mw ?? constantContract?.allocationMw ?? null;
      const clientName =
        dbTariff?.client_name ?? constantContract?.clientName ?? p.customer_name ?? "—";
      return {
        ...p,
        allocation_mw: allocationMw && allocationMw > 0 ? allocationMw : null,
        client_name: clientName,
        consumption_pct:
          allocationMw && allocationMw > 0 ? (p.active_power_kw / 1000 / allocationMw) * 100 : null,
      };
    });
  }, [projects.data, tariffs.data]);

  // Per-project bars — use historical if available, else current snapshot.
  const projectBars = useMemo(
    () =>
      (projects.data ?? [])
        .filter((p) => p.total_miners > 0)
        .map((p) => {
          const online =
            p.online_uptime_pct ??
            (p.total_miners > 0 ? (p.miners_online / p.total_miners) * 100 : 0);
          const hashing =
            p.hashing_uptime_pct ??
            (p.total_miners > 0 ? (p.miners_hashing / p.total_miners) * 100 : 0);
          return {
            project: p.project_name,
            "Online %": Number(online.toFixed(1)),
            "Hashing %": Number(hashing.toFixed(1)),
          };
        }),
    [projects.data],
  );
  const projectBarsIsSnapshot =
    (projects.data ?? []).every((p) => p.online_uptime_pct == null) &&
    (projects.data ?? []).length > 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-end gap-4">
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-0.5 shadow-sm">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={cn(
                "rounded-[4px] px-3 py-1 text-xs font-medium transition-colors",
                range === r.key
                  ? "bg-penguin-obsidian text-white"
                  : "text-penguin-cool-gray hover:bg-slate-100 hover:text-penguin-obsidian",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1 — 5 KPI cards */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          icon={Zap}
          label="Consumo actual"
          value={fmt(totalSitePowerMw, 2)}
          unit="MW"
          hint={`Contrato ${CONTRACT_MW} MW · tope ${CONTRACT_CAP_MW} MW`}
          tone={
            totalSitePowerMw >= CONTRACT_CAP_MW
              ? "rose"
              : totalSitePowerMw >= CONTRACT_MW
                ? "amber"
                : "lime"
          }
        />
        <KpiCard
          icon={Activity}
          label="Hashrate total"
          value={fmt(totalHashratePh, 2)}
          unit="PH/s"
          hint={`${hashingMiners.toLocaleString()} / ${totalMiners.toLocaleString()} miners hashing`}
          tone="violet"
        />
        <KpiCard
          icon={TrendingUp}
          label={globalUptime.isSnapshot ? "Online ahora" : "Online uptime 24h"}
          value={globalUptime.online != null ? fmt(globalUptime.online, 1) : "—"}
          unit="%"
          hint={
            globalUptime.isSnapshot
              ? `${onlineMiners.toLocaleString()} / ${totalMiners.toLocaleString()} miners · histórico no disponible`
              : `${onlineMiners.toLocaleString()} online ahora`
          }
          tone={
            globalUptime.online == null
              ? "default"
              : globalUptime.online >= 95
                ? "lime"
                : globalUptime.online >= 90
                  ? "amber"
                  : "rose"
          }
        />
        <KpiCard
          icon={TrendingUp}
          label={globalUptime.isSnapshot ? "Hashing ahora" : "Hashing uptime 24h"}
          value={globalUptime.hashing != null ? fmt(globalUptime.hashing, 1) : "—"}
          unit="%"
          hint={
            globalUptime.isSnapshot
              ? `${hashingMiners.toLocaleString()} / ${totalMiners.toLocaleString()} miners · histórico no disponible`
              : `${hashingMiners.toLocaleString()} hashing ahora`
          }
          tone={
            globalUptime.hashing == null
              ? "default"
              : globalUptime.hashing >= 95
                ? "lime"
                : globalUptime.hashing >= 90
                  ? "amber"
                  : "rose"
          }
        />
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-penguin-cool-gray">
              Estación meteorológica
            </span>
            <div className="grid h-6 w-6 place-items-center rounded-md bg-sky-100 text-sky-600">
              <CloudRain className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="flex items-center gap-1 text-penguin-cool-gray">
                <Thermometer className="h-3 w-3" />
                <span>Temp</span>
              </div>
              <div className="text-lg font-semibold tabular-nums text-penguin-obsidian">
                {fmt(weather.data?.temperature, 1, " °C")}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-penguin-cool-gray">
                <Droplets className="h-3 w-3" />
                <span>HR</span>
              </div>
              <div className="text-lg font-semibold tabular-nums text-penguin-obsidian">
                {fmt(weather.data?.humidity, 0, " %")}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-penguin-cool-gray">
                <Wind className="h-3 w-3" />
                <span>Viento</span>
              </div>
              <div className="text-sm font-semibold tabular-nums text-penguin-obsidian">
                {fmt(weather.data?.windSpeed, 1, " m/s")}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-penguin-cool-gray">
                <CloudRain className="h-3 w-3" />
                <span>Lluvia</span>
              </div>
              <div className="text-sm font-semibold tabular-nums text-penguin-obsidian">
                {fmt(weather.data?.rain, 1, " mm")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Row 2 — Per-project power vs contract */}
      <SectionCard
        icon={Zap}
        title="Potencia por proyecto vs contrato"
        subtitle="Consumo actual (MW) comparado con asignación contractual del Core Clients List. Verde <90% · ámbar 90-100% · rojo >100%."
      >
        {projects.isLoading ? (
          <Loading label="Consultando ICS + local..." />
        ) : projectWithContract.length === 0 ? (
          <div className="py-8 text-center text-sm text-penguin-cool-gray">
            Sin proyectos con containers activos.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
            {projectWithContract.map((p) => {
              const mw = p.active_power_kw / 1000;
              const max = p.allocation_mw && p.allocation_mw > 0 ? p.allocation_mw : 10;
              return (
                <Gauge
                  key={p.project_id}
                  value={mw}
                  max={max}
                  label={p.project_name}
                  sublabel={
                    p.allocation_mw
                      ? `${fmt(mw, 2)} / ${p.allocation_mw} MW`
                      : `${fmt(mw, 2)} MW (sin contrato)`
                  }
                  unit="MW"
                  decimals={2}
                  thresholds={{ warn: 0.9, alert: 1.0 }}
                />
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Row 3 — Site power + weather */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard
          icon={TrendingUp}
          title={`Consumo total del sitio — últimas ${RANGES.find((r) => r.key === range)?.label}`}
          subtitle={`Contrato objetivo ${CONTRACT_MW} MW · tope ${CONTRACT_CAP_MW} MW. Derivado de Alimentadores.`}
        >
          {powerWeather.isLoading ? (
            <Loading label="Consultando Alimentadores..." />
          ) : powerWeather.error ? (
            <SourceError message={powerWeather.error.message} />
          ) : (
            <div className="lg:col-span-2">
              <AreaChart
                className="h-[320px]"
                data={(powerWeather.data ?? []).map((p) => ({
                  hour: p.hour,
                  MW: p.total_mw,
                }))}
                index="hour"
                categories={["MW"]}
                colors={["emerald"]}
                valueFormatter={(v) => `${v.toFixed(2)} MW`}
                showLegend={false}
                showAnimation
                showGradient
                yAxisWidth={76}
                intervalType="preserveStartEnd"
                curveType="natural"
                minValue={0}
                maxValue={Math.max(
                  CONTRACT_CAP_MW + 5,
                  ...(powerWeather.data ?? []).map((p) => p.total_mw || 0),
                )}
                noDataText={`Sin datos en las últimas ${hours}h.`}
              />
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={Thermometer}
          title="Clima del sitio"
          subtitle="Temperatura + humedad horaria (EM01)."
        >
          {powerWeather.isLoading ? (
            <Loading label="Consultando EM01..." />
          ) : powerWeather.error ? (
            <SourceError message={powerWeather.error.message} />
          ) : (
            <AreaChart
              className="h-[320px]"
              data={(powerWeather.data ?? []).map((p) => ({
                hour: p.hour,
                "Temp (°C)": p.temperature ?? 0,
                "Humedad (%)": p.humidity ?? 0,
              }))}
              index="hour"
              categories={["Temp (°C)", "Humedad (%)"]}
              colors={["amber", "sky"]}
              valueFormatter={(v) => v.toFixed(1)}
              showLegend
              showAnimation
              showGradient
              yAxisWidth={56}
              intervalType="preserveStartEnd"
              curveType="natural"
              noDataText={`Sin datos en las últimas ${hours}h.`}
            />
          )}
        </SectionCard>
      </div>

      {/* Row 4 — Per-project uptime bars + cooling chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          icon={Activity}
          title="Uptime por proyecto (24h)"
          subtitle="Promedio weightedde container_histories. En gris si el dato no está disponible."
        >
          {projects.isLoading ? (
            <Loading label="Consultando ICS..." />
          ) : projectBars.length === 0 ? (
            <div className="py-8 text-center text-sm text-penguin-cool-gray">
              Uptime no disponible (container_histories sin permiso de lectura).
            </div>
          ) : (
            <BarChart
              className="h-[320px]"
              data={projectBars}
              index="project"
              categories={["Online %", "Hashing %"]}
              colors={["emerald", "violet"]}
              valueFormatter={(v) => `${v.toFixed(1)}%`}
              showLegend
              showAnimation
              showGridLines
              yAxisWidth={56}
              maxValue={100}
            />
          )}
        </SectionCard>

        <SectionCard
          icon={Thermometer}
          title={`Temperatura agua out ZPJV — últimas ${RANGES.find((r) => r.key === range)?.label}`}
          subtitle="Promedio + máximo por hora (A11-A32). Umbral Hydro 40°C."
        >
          {coolingTemp.isLoading ? (
            <Loading label="Consultando Registros_A##..." />
          ) : coolingTemp.error ? (
            <SourceError message={coolingTemp.error.message} />
          ) : (
            <AreaChart
              className="h-[320px]"
              data={(coolingTemp.data ?? []).map((p) => ({
                hour: p.hour,
                Promedio: p.avg_water_out,
                Máximo: p.max_water_out,
              }))}
              index="hour"
              categories={["Promedio", "Máximo"]}
              colors={["cyan", "rose"]}
              valueFormatter={(v) => `${v.toFixed(1)} °C`}
              showLegend
              showAnimation
              showGradient
              yAxisWidth={44}
              curveType="natural"
              noDataText={`Sin datos en las últimas ${hours}h.`}
            />
          )}
        </SectionCard>
      </div>

      {/* Row 5 — Overhead energético (ex-PUE) */}
      <SectionCard
        icon={TrendingUp}
        title={`Overhead energético del sitio — últimas ${RANGES.find((r) => r.key === range)?.label}`}
        subtitle="Porcentaje de energía auxiliar sobre la carga útil (PUE − 1). Ideal cercano a 0%. Fuente: PUE_Registros.PUE_General."
      >
        {pue.isLoading ? (
          <Loading label="Consultando PUE_Registros..." />
        ) : pue.error ? (
          <SourceError message={pue.error.message} />
        ) : (
          <AreaChart
            className="h-[240px]"
            data={(pue.data ?? []).map((p) => ({
              hour: p.hour,
              "Overhead %": Number(((p.pue - 1) * 100).toFixed(2)),
            }))}
            index="hour"
            categories={["Overhead %"]}
            colors={["violet"]}
            valueFormatter={(v) => `${v.toFixed(2)}%`}
            showLegend={false}
            showAnimation
            yAxisWidth={50}
            curveType="monotone"
            noDataText={`Sin datos en las últimas ${hours}h.`}
          />
        )}
      </SectionCard>

      {/* Row 6 — Details by project table */}
      <SectionCard
        icon={Activity}
        title="Detalle por proyecto"
        subtitle="Agregado de ICS (potencia, hashrate, miners) + contrato + uptime 24h."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[10px] uppercase tracking-wider text-penguin-cool-gray">
                <th className="py-2 pr-4 font-semibold">Proyecto</th>
                <th className="py-2 pr-4 font-semibold">Cliente</th>
                <th className="py-2 pr-4 text-right font-semibold">Containers</th>
                <th className="py-2 pr-4 text-right font-semibold">Potencia</th>
                <th className="py-2 pr-4 text-right font-semibold">Contrato</th>
                <th className="py-2 pr-4 text-right font-semibold">% uso</th>
                <th className="py-2 pr-4 text-right font-semibold">Hashrate</th>
                <th className="py-2 pr-4 text-right font-semibold">Miners</th>
                <th className="py-2 pr-4 text-right font-semibold">Online 24h</th>
                <th className="py-2 pr-4 text-right font-semibold">Hashing 24h</th>
              </tr>
            </thead>
            <tbody>
              {projectWithContract.map((p) => {
                const mw = p.active_power_kw / 1000;
                const usePct = p.consumption_pct;
                return (
                  <tr key={p.project_id} className="border-b border-slate-100 last:border-b-0">
                    <td className="py-2 pr-4 font-medium text-penguin-obsidian">
                      {p.project_name}
                    </td>
                    <td className="py-2 pr-4 text-penguin-cool-gray">{p.client_name}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{p.container_count}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-penguin-obsidian">
                      {fmt(mw, 2, " MW")}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums text-penguin-cool-gray">
                      {p.allocation_mw ? `${p.allocation_mw} MW` : "—"}
                    </td>
                    <td
                      className={cn(
                        "py-2 pr-4 text-right tabular-nums",
                        usePct == null
                          ? "text-slate-400"
                          : usePct >= 100
                            ? "text-rose-600 font-semibold"
                            : usePct >= 90
                              ? "text-amber-600 font-semibold"
                              : "text-emerald-600",
                      )}
                    >
                      {usePct != null ? `${fmt(usePct, 1)}%` : "—"}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {fmt(p.hashrate_total_ths / 1000, 2, " PH/s")}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums text-penguin-cool-gray">
                      <span className="text-emerald-700">{p.miners_hashing.toLocaleString()}</span>
                      <span className="mx-1 text-slate-400">/</span>
                      <span>{p.total_miners.toLocaleString()}</span>
                    </td>
                    <td
                      className={cn(
                        "py-2 pr-4 text-right tabular-nums",
                        p.online_uptime_pct == null
                          ? "text-slate-400"
                          : p.online_uptime_pct >= 95
                            ? "text-emerald-600"
                            : p.online_uptime_pct >= 90
                              ? "text-amber-600"
                              : "text-rose-600",
                      )}
                    >
                      {p.online_uptime_pct != null ? `${fmt(p.online_uptime_pct, 1)}%` : "—"}
                    </td>
                    <td
                      className={cn(
                        "py-2 pr-4 text-right tabular-nums",
                        p.hashing_uptime_pct == null
                          ? "text-slate-400"
                          : p.hashing_uptime_pct >= 95
                            ? "text-emerald-600"
                            : p.hashing_uptime_pct >= 90
                              ? "text-amber-600"
                              : "text-rose-600",
                      )}
                    >
                      {p.hashing_uptime_pct != null ? `${fmt(p.hashing_uptime_pct, 1)}%` : "—"}
                    </td>
                  </tr>
                );
              })}
              {projectWithContract.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-sm text-penguin-cool-gray">
                    Sin proyectos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
