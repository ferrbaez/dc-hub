import "server-only";
import { getScadaRequest } from "@/lib/db/scada";

/**
 * Time-series queries for the /graficos dashboard.
 *
 * All queries:
 *   - Bounded by Time_Stamp (WHERE Time_Stamp >= DATEADD(hour, -N, GETDATE()))
 *   - Use OPTION (MAXDOP 2) for aggregates
 *   - Respect pool max=2 (parallel queries naturally serialize)
 *
 * Output shape is designed for Tremor AreaChart/LineChart:
 *   - `hour` is a short human label ("2026-04-21 14:00")
 *   - numeric fields are plain `number` (Tremor won't render strings)
 */

/**
 * Chart-axis label format adapts to the range. Tremor uses the `index` string
 * as the categorical x-axis label, so this is also what the user sees.
 *   ≤ 24h:  "HH:00"           → "14:00"   (time-of-day, stays readable with many points)
 *   ≤ 7d:   "dd/MM HH:00"     → "21/04 14:00"
 *   > 7d:   "dd/MM"           → "21/04"   (day granularity is enough at 30d)
 */
function fmtHour(d: Date, rangeHours: number): string {
  if (rangeHours <= 24) {
    return d.toLocaleString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  if (rangeHours <= 7 * 24) {
    return d.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return d.toLocaleString("es-AR", { day: "2-digit", month: "2-digit" });
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

// -----------------------------------------------------------------------------
// Alimentadores → total site MW per hour
// -----------------------------------------------------------------------------

const ALIMENTADORES_FEEDERS = [
  "AL01",
  "AL02",
  "AL03",
  "AL04",
  "AL05",
  "AL06",
  "AL07",
  "AL08",
  "AL09",
  "AL10",
  "AL11",
  "AL12",
  "AL13",
  "AL14",
  "AL15",
  "BC02",
] as const;

export type EnergyHourPoint = {
  hour: string;
  total_mw: number;
};

/**
 * Total site MW per hour over the last `hours` window.
 *
 * Alimentadores stores one row per Time_Stamp with cumulative bigint energy
 * counters per feeder. To get avg kW over an hour we need:
 *   (last_counter_in_bucket - first_counter_in_bucket) / hours_covered / 1000
 *
 * We implement this in SQL using FIRST_VALUE / LAST_VALUE within each hour
 * bucket, then subtract to get the delta, summed across all feeders → MW.
 */
export async function getAlimentadoresEnergyHourly(hours: number): Promise<EnergyHourPoint[]> {
  const safeHours = Math.max(1, Math.min(hours, 24 * 60));
  const req = await getScadaRequest({ timeoutMs: 60_000 });

  // Build per-feeder SUM(last - first) expressions.
  const deltaExpr = ALIMENTADORES_FEEDERS.map((f) => `(MAX(${f}_Energy) - MIN(${f}_Energy))`).join(
    " + ",
  );

  // We approximate the hour bucket by using DATEADD/DATEDIFF to hour-floor the
  // Time_Stamp, then group by that. (MAX - MIN) within the bucket gives the
  // cumulative delta, which is kWh consumed in that hour window across all
  // feeders. Divide by the actual time span of samples within the bucket to
  // turn it into an average kW, then /1000 for MW.
  const sqlText = `
    ;WITH bucketed AS (
      SELECT
        DATEADD(hour, DATEDIFF(hour, 0, Time_Stamp), 0) AS hour_ts,
        Time_Stamp,
        ${ALIMENTADORES_FEEDERS.map((f) => `${f}_Energy`).join(", ")}
      FROM Alimentadores
      WHERE Time_Stamp >= DATEADD(hour, -${safeHours}, GETDATE())
    )
    SELECT
      hour_ts,
      MIN(Time_Stamp) AS first_ts,
      MAX(Time_Stamp) AS last_ts,
      ${deltaExpr} AS total_kwh_delta
    FROM bucketed
    GROUP BY hour_ts
    ORDER BY hour_ts
    OPTION (MAXDOP 2);
  `;

  const res = await req.query(sqlText);
  const rows = (res.recordset ?? []) as Array<{
    hour_ts: Date;
    first_ts: Date;
    last_ts: Date;
    total_kwh_delta: number | string | null;
  }>;

  const out: EnergyHourPoint[] = [];
  for (const r of rows) {
    const first = r.first_ts instanceof Date ? r.first_ts : new Date(r.first_ts);
    const last = r.last_ts instanceof Date ? r.last_ts : new Date(r.last_ts);
    const hrs = (last.getTime() - first.getTime()) / 3_600_000;
    const delta = num(r.total_kwh_delta);
    // Fall back to 1h if samples are clustered (avoid div by 0). If hrs is
    // too small, the point is effectively "kWh in that sample" ≈ avg kW.
    const effectiveHours = hrs > 0 ? hrs : 1;
    // Energy counter is Wh (bigint); delta/hours = W; /1_000_000 = MW.
    const total_mw = delta != null ? delta / effectiveHours / 1_000_000 : 0;
    const hourTs = r.hour_ts instanceof Date ? r.hour_ts : new Date(r.hour_ts);
    out.push({
      hour: fmtHour(hourTs, hours),
      total_mw: Number.isFinite(total_mw) ? Math.max(0, Number(total_mw.toFixed(3))) : 0,
    });
  }
  return out;
}

// -----------------------------------------------------------------------------
// Cooling (ZPJV A-series water out °C) → avg + max per hour
// -----------------------------------------------------------------------------

const ZPJV_A_CONTAINERS = ["A11", "A12", "A21", "A22", "A31", "A32"] as const;

export type CoolingHourPoint = {
  hour: string;
  avg_water_out: number;
  max_water_out: number;
};

/**
 * Hourly avg + max of water-out (TT02) across ZPJV A-series containers.
 *
 * Each container has its own Registros_A## table. We fire one aggregate query
 * per container in parallel (pool max=2 naturally serializes to 2 at a time),
 * then merge in JS by hour bucket.
 */
export async function getCoolingTempHourly(hours: number): Promise<CoolingHourPoint[]> {
  const safeHours = Math.max(1, Math.min(hours, 24 * 60));

  type PerContainerRow = {
    hour_ts: Date;
    avg_tt02: number | string | null;
    max_tt02: number | string | null;
  };

  const perContainer = await Promise.all(
    ZPJV_A_CONTAINERS.map(async (c) => {
      const req = await getScadaRequest({ timeoutMs: 60_000 });
      const sqlText = `
        SELECT
          DATEADD(hour, DATEDIFF(hour, 0, Time_Stamp), 0) AS hour_ts,
          AVG(CAST(${c}_TT02 AS float))  AS avg_tt02,
          MAX(${c}_TT02)                 AS max_tt02
        FROM Registros_${c}
        WHERE Time_Stamp >= DATEADD(hour, -${safeHours}, GETDATE())
          AND ${c}_TT02 IS NOT NULL
        GROUP BY DATEADD(hour, DATEDIFF(hour, 0, Time_Stamp), 0)
        ORDER BY hour_ts
        OPTION (MAXDOP 2);
      `;
      const res = await req.query(sqlText);
      return (res.recordset ?? []) as PerContainerRow[];
    }),
  );

  // Merge: hour_ts → { sumAvg, count, max }
  const byHour = new Map<number, { sumAvg: number; count: number; max: number }>();
  for (const rows of perContainer) {
    for (const row of rows) {
      const ts = row.hour_ts instanceof Date ? row.hour_ts : new Date(row.hour_ts);
      const key = ts.getTime();
      const avg = num(row.avg_tt02);
      const max = num(row.max_tt02);
      if (avg == null && max == null) continue;
      const entry = byHour.get(key) ?? { sumAvg: 0, count: 0, max: Number.NEGATIVE_INFINITY };
      if (avg != null) {
        entry.sumAvg += avg;
        entry.count += 1;
      }
      if (max != null && max > entry.max) entry.max = max;
      byHour.set(key, entry);
    }
  }

  const sortedKeys = Array.from(byHour.keys()).sort((a, b) => a - b);
  return sortedKeys.map((key) => {
    const entry = byHour.get(key);
    if (!entry) {
      return { hour: fmtHour(new Date(key), hours), avg_water_out: 0, max_water_out: 0 };
    }
    const avg = entry.count > 0 ? entry.sumAvg / entry.count : 0;
    const max = Number.isFinite(entry.max) ? entry.max : 0;
    return {
      hour: fmtHour(new Date(key), hours),
      avg_water_out: Number(avg.toFixed(2)),
      max_water_out: Number(max.toFixed(2)),
    };
  });
}

// -----------------------------------------------------------------------------
// PUE hourly — from PUE_Registros.PUE_General (pre-aggregated over time)
// -----------------------------------------------------------------------------

export type PueHourPoint = {
  hour: string;
  pue: number;
};

/**
 * Hourly avg of PUE_General over the last `hours` window.
 *
 * PUE_Registros has raw samples (Time_Stamp + PUE_* floats). We bucket to
 * hourly averages in SQL, filtering out 0/negative samples (sensor glitches).
 */
export async function getPueHourly(hours: number): Promise<PueHourPoint[]> {
  const safeHours = Math.max(1, Math.min(hours, 24 * 60));
  const req = await getScadaRequest({ timeoutMs: 60_000 });

  const sqlText = `
    SELECT
      DATEADD(hour, DATEDIFF(hour, 0, Time_Stamp), 0) AS hour_ts,
      AVG(CAST(PUE_General AS float)) AS avg_pue
    FROM PUE_Registros
    WHERE Time_Stamp >= DATEADD(hour, -${safeHours}, GETDATE())
      AND PUE_General IS NOT NULL
      AND PUE_General > 0
    GROUP BY DATEADD(hour, DATEDIFF(hour, 0, Time_Stamp), 0)
    ORDER BY hour_ts
    OPTION (MAXDOP 2);
  `;

  const res = await req.query(sqlText);
  const rows = (res.recordset ?? []) as Array<{
    hour_ts: Date;
    avg_pue: number | string | null;
  }>;

  return rows
    .map((r) => {
      const ts = r.hour_ts instanceof Date ? r.hour_ts : new Date(r.hour_ts);
      const pue = num(r.avg_pue);
      return {
        hour: fmtHour(ts, hours),
        pue: pue != null ? Number(pue.toFixed(3)) : 0,
      };
    })
    .filter((p) => p.pue > 0);
}

// -----------------------------------------------------------------------------
// Weather station — EM01 latest + short-range series
// -----------------------------------------------------------------------------

export type WeatherSnapshot = {
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  rain: number | null;
  latestTs: string | null;
};

export async function getWeatherLatest(): Promise<WeatherSnapshot> {
  const req = await getScadaRequest({ timeoutMs: 5_000 });
  const res = await req.query(`
    SELECT TOP 1
      Time_Stamp                AS ts,
      EM01_Temperatura          AS temperature,
      EM01_Humedad              AS humidity,
      EM01_Presion              AS pressure,
      EM01_Velocidad_Viento     AS wind_speed,
      EM01_Direccion_Viento     AS wind_dir,
      EM01_Lluvia               AS rain
    FROM Registros_EM01
    WHERE Time_Stamp >= DATEADD(minute, -15, GETDATE())
    ORDER BY Time_Stamp DESC
    OPTION (MAXDOP 2);
  `);
  const row = res.recordset?.[0] as Record<string, unknown> | undefined;
  if (!row) {
    return {
      temperature: null,
      humidity: null,
      pressure: null,
      windSpeed: null,
      windDirection: null,
      rain: null,
      latestTs: null,
    };
  }
  const ts = (row.ts as Date | null) ?? null;
  return {
    temperature: num(row.temperature),
    humidity: num(row.humidity),
    pressure: num(row.pressure),
    windSpeed: num(row.wind_speed),
    windDirection: num(row.wind_dir),
    rain: num(row.rain),
    latestTs: ts ? ts.toISOString() : null,
  };
}

export type EnvPoint = {
  hour: string;
  total_mw: number;
  temperature: number | null;
  humidity: number | null;
};

/**
 * Site MW + environment overlay (temperature + humidity) per hour.
 * Used to visualise how weather correlates with consumption.
 */
export async function getPowerWithWeatherHourly(hours: number): Promise<EnvPoint[]> {
  const req = await getScadaRequest({ timeoutMs: 30_000 });

  // Alimentadores: hourly MW (same logic as getAlimentadoresEnergyHourly, condensed)
  const energyCols = ALIMENTADORES_FEEDERS.map(
    (f) => `MAX(${f}_Energy) - MIN(${f}_Energy) AS ${f}_delta`,
  ).join(", ");
  const sumExpr = ALIMENTADORES_FEEDERS.map((f) => `ISNULL(${f}_delta, 0)`).join(" + ");

  const powerSql = `
    WITH buckets AS (
      SELECT
        DATEADD(hour, DATEDIFF(hour, 0, Time_Stamp), 0) AS hour_ts,
        MIN(Time_Stamp) AS min_ts,
        MAX(Time_Stamp) AS max_ts,
        ${energyCols}
      FROM Alimentadores
      WHERE Time_Stamp >= DATEADD(hour, -${hours}, GETDATE())
      GROUP BY DATEADD(hour, DATEDIFF(hour, 0, Time_Stamp), 0)
    )
    SELECT
      hour_ts,
      CAST(DATEDIFF(SECOND, min_ts, max_ts) AS float) / 3600.0 AS hours_span,
      ${sumExpr} AS total_delta
    FROM buckets
    ORDER BY hour_ts
    OPTION (MAXDOP 2);
  `;

  const weatherSql = `
    SELECT
      DATEADD(hour, DATEDIFF(hour, 0, Time_Stamp), 0) AS hour_ts,
      AVG(CAST(EM01_Temperatura AS float)) AS avg_temp,
      AVG(CAST(EM01_Humedad AS float)) AS avg_hum
    FROM Registros_EM01
    WHERE Time_Stamp >= DATEADD(hour, -${hours}, GETDATE())
    GROUP BY DATEADD(hour, DATEDIFF(hour, 0, Time_Stamp), 0)
    OPTION (MAXDOP 2);
  `;

  const [powerRes, weatherRes] = await Promise.all([req.query(powerSql), req.query(weatherSql)]);

  const weatherMap = new Map<number, { temp: number | null; hum: number | null }>();
  for (const r of weatherRes.recordset ?? []) {
    const row = r as { hour_ts: Date; avg_temp: number | null; avg_hum: number | null };
    const ts = row.hour_ts instanceof Date ? row.hour_ts : new Date(row.hour_ts);
    weatherMap.set(ts.getTime(), { temp: num(row.avg_temp), hum: num(row.avg_hum) });
  }

  const out: EnvPoint[] = [];
  for (const r of powerRes.recordset ?? []) {
    const row = r as { hour_ts: Date; hours_span: number; total_delta: number | null };
    const ts = row.hour_ts instanceof Date ? row.hour_ts : new Date(row.hour_ts);
    const span = row.hours_span && row.hours_span > 0 ? row.hours_span : 1;
    const delta = num(row.total_delta) ?? 0;
    const w = weatherMap.get(ts.getTime());
    // Alimentadores.*_Energy is a Wh counter: delta / hours = W, /1_000_000 = MW.
    out.push({
      hour: fmtHour(ts, hours),
      total_mw: Number((delta / span / 1_000_000).toFixed(2)),
      temperature: w?.temp ?? null,
      humidity: w?.hum ?? null,
    });
  }
  return out;
}
