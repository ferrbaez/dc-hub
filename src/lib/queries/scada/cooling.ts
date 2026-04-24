import "server-only";
import { getScadaRequest } from "@/lib/db/scada";

/**
 * Cooling shapes per SITE_BASELINE §8 + empirical check of SCADA DDL.
 *
 * Three shape families for water-cooled containers:
 *
 *   hydroClassic → A/B/C/D11/D12/D21 series:
 *     {n}_TT01  water in (°C)      {n}_TT02  water out (°C)
 *     {n}_PT01  pressure in (bar)  {n}_PT02  pressure out (bar)
 *     {n}_FIT01 flow (m³/h)
 *     {n}_Internal_Temperature / {n}_Internal_Humidity
 *
 *   hydroAlt → D31, D32, F, G, S series (same physical sensors, different tags):
 *     {n}_TT01 / {n}_TT02 / {n}_PT01 / {n}_PT02 (same)
 *     {n}_FT01  flow (m³/h)            ← NOT FIT01
 *     {n}_TRT01 / {n}_TH01             (return temp / humidity)
 *
 *   ndWaterAir → NORTHERN DATA N1..N12 (water + air pasillos):
 *     {n}_Temperature_In / _Out        water
 *     {n}_Flow / _Pressure / _Pump_Frecuency
 *     {n}_T1_Prom (cold aisle avg)     {n}_T2_Prom (hot aisle avg)
 */
type Shape = "hydroClassic" | "hydroAlt" | "ndWaterAir";
type CoolingType = "Hydro" | "Immersion" | "AirCooled";

type ContainerSpec = {
  name: string;
  client: string;
  project: string;
  type: CoolingType;
  shape: Shape;
};

export const COOLING_CONTAINERS: ContainerSpec[] = [
  // ZPJV Hydro — A series (JV1-1)
  { name: "A11", client: "ZPJV", project: "JV1-1", type: "Hydro", shape: "hydroClassic" },
  { name: "A12", client: "ZPJV", project: "JV1-1", type: "Hydro", shape: "hydroClassic" },
  { name: "A21", client: "ZPJV", project: "JV1-1", type: "Hydro", shape: "hydroClassic" },
  { name: "A22", client: "ZPJV", project: "JV1-1", type: "Hydro", shape: "hydroClassic" },
  { name: "A31", client: "ZPJV", project: "JV1-1", type: "Hydro", shape: "hydroClassic" },
  { name: "A32", client: "ZPJV", project: "JV1-1", type: "Hydro", shape: "hydroClassic" },
  // ZPJV + SAZ Hydro — B series (mixed)
  { name: "B11", client: "ZPJV", project: "JV1-1", type: "Hydro", shape: "hydroClassic" },
  { name: "B12", client: "SAZMINING", project: "HC5-2", type: "Hydro", shape: "hydroClassic" },
  { name: "B21", client: "ZPJV", project: "JV1-1", type: "Hydro", shape: "hydroClassic" },
  { name: "B22", client: "SAZMINING", project: "HC5-2", type: "Hydro", shape: "hydroClassic" },
  { name: "B31", client: "ZPJV", project: "JV1-1", type: "Hydro", shape: "hydroClassic" },
  { name: "B32", client: "SAZMINING", project: "HC5-2", type: "Hydro", shape: "hydroClassic" },
  // ZPJV Hydro — C series
  { name: "C11", client: "ZPJV", project: "JV1-1", type: "Hydro", shape: "hydroClassic" },
  { name: "C12", client: "ZPJV", project: "JV1-1", type: "Hydro", shape: "hydroClassic" },
  { name: "C21", client: "ZPJV", project: "JV1-1", type: "Hydro", shape: "hydroClassic" },
  { name: "C22", client: "ZPJV", project: "JV1-1", type: "Hydro", shape: "hydroClassic" },
  { name: "C31", client: "ZPJV", project: "JV1-1", type: "Hydro", shape: "hydroClassic" },
  { name: "C32", client: "ZPJV", project: "JV1-1", type: "Hydro", shape: "hydroClassic" },
  // D series (except D22 per Willian)
  { name: "D11", client: "ZPJV", project: "JV1-1", type: "Hydro", shape: "hydroClassic" },
  {
    name: "D12",
    client: "GUY SCHWARZENBACH",
    project: "HC2",
    type: "Hydro",
    shape: "hydroClassic",
  },
  { name: "D21", client: "AFTech AG", project: "HC3", type: "Hydro", shape: "hydroClassic" },
  { name: "D31", client: "AXXA", project: "HC4", type: "Hydro", shape: "hydroAlt" },
  { name: "D32", client: "AXXA", project: "HC4", type: "Hydro", shape: "hydroAlt" },
  // AXXA Hydro — F series
  { name: "F21", client: "AXXA", project: "HC4", type: "Hydro", shape: "hydroAlt" },
  { name: "F22", client: "AXXA", project: "HC4", type: "Hydro", shape: "hydroAlt" },
  { name: "F31", client: "AXXA", project: "HC4", type: "Hydro", shape: "hydroAlt" },
  { name: "F32", client: "AXXA", project: "HC4", type: "Hydro", shape: "hydroAlt" },
  // AXXA Hydro — G series
  { name: "G11", client: "AXXA", project: "HC4", type: "Hydro", shape: "hydroAlt" },
  { name: "G12", client: "AXXA", project: "HC4", type: "Hydro", shape: "hydroAlt" },
  { name: "G21", client: "AXXA", project: "HC4", type: "Hydro", shape: "hydroAlt" },
  { name: "G22", client: "AXXA", project: "HC4", type: "Hydro", shape: "hydroAlt" },
  // ZPJV Hydro — S series (JV4)
  { name: "S1", client: "ZPJV", project: "JV4", type: "Hydro", shape: "hydroAlt" },
  { name: "S2", client: "ZPJV", project: "JV4", type: "Hydro", shape: "hydroAlt" },
  { name: "S3", client: "ZPJV", project: "JV4", type: "Hydro", shape: "hydroAlt" },
  { name: "S4", client: "ZPJV", project: "JV4", type: "Hydro", shape: "hydroAlt" },
  { name: "S5", client: "ZPJV", project: "JV4", type: "Hydro", shape: "hydroAlt" },
  { name: "S6", client: "ZPJV", project: "JV4", type: "Hydro", shape: "hydroAlt" },
  { name: "S7", client: "ZPJV", project: "JV4", type: "Hydro", shape: "hydroAlt" },
  { name: "S8", client: "ZPJV", project: "JV4", type: "Hydro", shape: "hydroAlt" },
  { name: "S9", client: "ZPJV", project: "JV4", type: "Hydro", shape: "hydroAlt" },
  // NORTHERN DATA water + air
  { name: "N1", client: "NORTHERN DATA", project: "JV5", type: "Hydro", shape: "ndWaterAir" },
  { name: "N2", client: "NORTHERN DATA", project: "JV5", type: "Hydro", shape: "ndWaterAir" },
  { name: "N3", client: "NORTHERN DATA", project: "JV5", type: "Hydro", shape: "ndWaterAir" },
  { name: "N4", client: "NORTHERN DATA", project: "JV5", type: "Hydro", shape: "ndWaterAir" },
  { name: "N5", client: "NORTHERN DATA", project: "JV5", type: "Hydro", shape: "ndWaterAir" },
  { name: "N6", client: "NORTHERN DATA", project: "JV5", type: "Hydro", shape: "ndWaterAir" },
  { name: "N7", client: "NORTHERN DATA", project: "JV5", type: "Hydro", shape: "ndWaterAir" },
  { name: "N8", client: "NORTHERN DATA", project: "JV5", type: "Hydro", shape: "ndWaterAir" },
  { name: "N9", client: "NORTHERN DATA", project: "JV5", type: "Hydro", shape: "ndWaterAir" },
  { name: "N10", client: "NORTHERN DATA", project: "JV5", type: "Hydro", shape: "ndWaterAir" },
  { name: "N11", client: "NORTHERN DATA", project: "JV5", type: "Hydro", shape: "ndWaterAir" },
  { name: "N12", client: "NORTHERN DATA", project: "JV5", type: "Hydro", shape: "ndWaterAir" },
];

export type CoolingRow = {
  container: string;
  client: string;
  project: string;
  type: CoolingType;
  shape: Shape;
  waterIn: number | null;
  waterOut: number | null;
  delta: number | null;
  flow: number | null;
  pressure: number | null;
  pressureOut: number | null;
  coldAisle: number | null;
  hotAisle: number | null;
  latestTs: string | null;
};

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function buildSql(spec: ContainerSpec): string {
  const n = spec.name;
  if (spec.shape === "ndWaterAir") {
    return `
      SELECT TOP 1
        Time_Stamp                     AS ts,
        ${n}_Temperature_In            AS water_in,
        ${n}_Temperature_Out           AS water_out,
        ${n}_Flow                      AS flow,
        ${n}_Pressure                  AS pressure,
        ${n}_T1_Prom                   AS cold_aisle,
        ${n}_T2_Prom                   AS hot_aisle
      FROM Registros_${n}
      WHERE Time_Stamp >= DATEADD(minute, -10, GETDATE())
      ORDER BY Time_Stamp DESC
      OPTION (MAXDOP 2);
    `;
  }
  const flowCol = spec.shape === "hydroClassic" ? "FIT01" : "FT01";
  return `
    SELECT TOP 1
      Time_Stamp                       AS ts,
      ${n}_TT01                        AS water_in,
      ${n}_TT02                        AS water_out,
      ${n}_${flowCol}                  AS flow,
      ${n}_PT01                        AS pressure,
      ${n}_PT02                        AS pressure_out
    FROM Registros_${n}
    WHERE Time_Stamp >= DATEADD(minute, -10, GETDATE())
    ORDER BY Time_Stamp DESC
    OPTION (MAXDOP 2);
  `;
}

/**
 * Fetch cooling snapshot for all hydro containers in parallel. mssql pool max=2
 * naturally limits concurrency; we just kick off all 52 and wait.
 */
export async function getCoolingLive(): Promise<CoolingRow[]> {
  const results = await Promise.allSettled(
    COOLING_CONTAINERS.map(async (spec) => {
      const req = await getScadaRequest({ timeoutMs: 5_000 });
      const res = await req.query(buildSql(spec));
      const row = res.recordset?.[0] as Record<string, unknown> | undefined;
      return { spec, row };
    }),
  );

  const rows: CoolingRow[] = [];
  for (const res of results) {
    if (res.status !== "fulfilled") continue;
    const { spec, row } = res.value;
    if (!row) {
      rows.push({
        container: spec.name,
        client: spec.client,
        project: spec.project,
        type: spec.type,
        shape: spec.shape,
        waterIn: null,
        waterOut: null,
        delta: null,
        flow: null,
        pressure: null,
        pressureOut: null,
        coldAisle: null,
        hotAisle: null,
        latestTs: null,
      });
      continue;
    }
    const ts = (row.ts as Date | null) ?? null;
    const waterIn = num(row.water_in);
    const waterOut = num(row.water_out);
    rows.push({
      container: spec.name,
      client: spec.client,
      project: spec.project,
      type: spec.type,
      shape: spec.shape,
      waterIn,
      waterOut,
      delta: waterIn != null && waterOut != null ? waterOut - waterIn : null,
      flow: num(row.flow),
      pressure: num(row.pressure),
      pressureOut: spec.shape === "ndWaterAir" ? null : num(row.pressure_out),
      coldAisle: spec.shape === "ndWaterAir" ? num(row.cold_aisle) : null,
      hotAisle: spec.shape === "ndWaterAir" ? num(row.hot_aisle) : null,
      latestTs: ts ? ts.toISOString() : null,
    });
  }
  return rows;
}
