import "server-only";
import { getScadaRequest } from "@/lib/db/scada";

/**
 * Feeder → transformer mapping, derived from SITE_BASELINE §5 + inventory of
 * H2Sense_* tables in SCADA DDL. A feeder typically powers 1-3 transformers.
 *
 * Keep this in sync with the feeder map in electrico.ts. Empty array = no
 * H2Sense-instrumented transformer for that feeder. For those, we fall back
 * to the PT100 chassis temperature tables (see `CHASSIS_TRAFOS_BY_FEEDER`).
 */
export const FEEDER_TRAFOS: Record<string, string[]> = {
  AL01: ["F2", "F3", "G1", "G2"], // AXXA F/G
  AL02: ["N4", "N5", "N6"], // ND 4-6
  AL03: ["N1", "N2", "N3"], // ND 1-3
  AL04: ["N7", "N8", "N9"], // ND 7-9
  AL05: ["N10", "N11", "N12"], // ND 10-12
  AL06: ["A1", "A2", "A3"], // ZPJV A-series
  AL07: ["B1", "B2", "B3"], // ZPJV B + SAZ Hydro (mixed)
  AL08: ["C1", "C2"], // ZPJV C-series
  AL09: ["D1", "D2", "D3"], // mixed D
  AL10: [], // MARA1 E + T — no H2Sense instrumentation
  AL11: ["S7", "S8"], // ZPJV S6-S9
  AL12: ["S1_S2", "S5"], // ZPJV S1-S5
  AL13: ["M1", "M2", "M3"], // MARA2 M1-M3 + M11-M13
  AL14: ["M4", "M5", "M6", "M7"], // MARA2 M4-M7 + M14-M17
  AL15: ["M8", "M9", "M10"], // MARA2 M8-M10 + M18-M20
  BC02: ["Z2"], // SAZ Fan
};

export type TrafoHealth = {
  trafoId: string;
  /** 'h2sense' = full oil/H2 instrumentation; 'chassis' = PT100 shell temp only. */
  source: "h2sense" | "chassis";
  latestTs: string | null;
  temperaturePcb: number | null;
  temperatureOil: number | null;
  pressureOil: number | null;
  waterContent: number | null;
  waterActivity: number | null;
  hydrogen: number | null;
  /** Only populated for `source === 'chassis'`. */
  chassisTemp: number | null;
};

// -----------------------------------------------------------------------------
// PT100 / chassis temperature sources for trafos without H2Sense.
// Each entry: { table: SCADA table name, trafoIds: [ids] }.
// The column is always `${id}_Temperatura_Transformador` (verified in DDL).
// Exclude '850' (sensor offset → trafo disconnected) per SITE_BASELINE §9.
// -----------------------------------------------------------------------------

type ChassisSource = { table: string; trafos: string[] };

const CHASSIS_SOURCES_BY_FEEDER: Record<string, ChassisSource[]> = {
  AL01: [{ table: "TempTrafoABCD", trafos: ["F1"] }], // F2/F3/G1/G2 already in H2Sense
  AL02: [{ table: "TempTranfoN", trafos: ["N4", "N5", "N6"] }],
  AL03: [{ table: "TempTranfoN", trafos: ["N1", "N2", "N3", "N1_2", "N3_C"] }],
  AL04: [{ table: "TempTranfoN", trafos: ["N7", "N8", "N9"] }],
  AL05: [{ table: "TempTranfoN", trafos: ["N10", "N11", "N12"] }],
  AL06: [], // A1/A2/A3 all in H2Sense
  AL07: [], // B1/B2/B3 all in H2Sense
  AL08: [{ table: "TempTrafoABCD", trafos: ["C3"] }], // C1/C2 in H2Sense
  AL09: [], // D1/D2/D3 all in H2Sense
  AL10: [
    { table: "Temp_Trafos_Villarrica", trafos: ["E11", "E12", "E21", "E22", "E31", "E32"] },
    { table: "Temp_Trafos_Texas", trafos: ["T11_T12", "T21_T22", "T31_T32", "T41_T42"] },
  ],
  AL11: [{ table: "Temp_Trafos_SM", trafos: ["S6", "S9"] }], // S7/S8 in H2Sense
  AL12: [{ table: "Temp_Trafos_SM", trafos: ["S3", "S4"] }], // S1_S2/S5 in H2Sense
  AL13: [], // M1-M10 all in H2Sense; M11-M13 have no chassis sensor either
  AL14: [],
  AL15: [],
  BC02: [{ table: "Temp_Trafos_Zas", trafos: ["Z1", "Z3"] }], // Z2 in H2Sense
};

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

async function fetchH2SenseTrafos(trafos: string[]): Promise<TrafoHealth[]> {
  if (trafos.length === 0) return [];
  const results = await Promise.allSettled(
    trafos.map(async (id) => {
      const req = await getScadaRequest({ timeoutMs: 5_000 });
      const sql = `
        SELECT TOP 1
          Time_Stamp                  AS ts,
          ${id}_Temperature_PCB       AS temp_pcb,
          ${id}_Temperature_Oil       AS temp_oil,
          ${id}_Pressure_Oil          AS pressure_oil,
          ${id}_Water_content_Oil     AS water_content,
          ${id}_Water_activity_Oil    AS water_activity,
          ${id}_Hydrogen              AS hydrogen
        FROM H2Sense_${id}
        WHERE Time_Stamp >= DATEADD(minute, -30, GETDATE())
        ORDER BY Time_Stamp DESC
        OPTION (MAXDOP 2);
      `;
      const res = await req.query(sql);
      const row = res.recordset?.[0] as Record<string, unknown> | undefined;
      return { id, row };
    }),
  );

  const out: TrafoHealth[] = [];
  for (const res of results) {
    if (res.status !== "fulfilled") continue;
    const { id, row } = res.value;
    if (!row) {
      out.push({
        trafoId: id,
        source: "h2sense",
        latestTs: null,
        temperaturePcb: null,
        temperatureOil: null,
        pressureOil: null,
        waterContent: null,
        waterActivity: null,
        hydrogen: null,
        chassisTemp: null,
      });
      continue;
    }
    const ts = (row.ts as Date | null) ?? null;
    out.push({
      trafoId: id,
      source: "h2sense",
      latestTs: ts ? ts.toISOString() : null,
      temperaturePcb: num(row.temp_pcb),
      temperatureOil: num(row.temp_oil),
      pressureOil: num(row.pressure_oil),
      waterContent: num(row.water_content),
      waterActivity: num(row.water_activity),
      hydrogen: num(row.hydrogen),
      chassisTemp: null,
    });
  }
  return out;
}

async function fetchChassisTrafos(sources: ChassisSource[]): Promise<TrafoHealth[]> {
  if (sources.length === 0) return [];
  // One query per table — all trafo columns in that table come back in one row.
  const results = await Promise.allSettled(
    sources.map(async (s) => {
      const req = await getScadaRequest({ timeoutMs: 5_000 });
      const cols = s.trafos.map((id) => `${id}_Temperatura_Transformador AS "${id}"`).join(", ");
      const sql = `
        SELECT TOP 1 Time_Stamp AS ts, ${cols}
        FROM ${s.table}
        WHERE Time_Stamp >= DATEADD(minute, -30, GETDATE())
        ORDER BY Time_Stamp DESC
        OPTION (MAXDOP 2);
      `;
      const res = await req.query(sql);
      const row = res.recordset?.[0] as Record<string, unknown> | undefined;
      return { source: s, row };
    }),
  );

  const out: TrafoHealth[] = [];
  for (const res of results) {
    if (res.status !== "fulfilled") continue;
    const { source, row } = res.value;
    const ts = (row?.ts as Date | null) ?? null;
    for (const id of source.trafos) {
      let temp = num(row?.[id]);
      // 850 = sensor offset → trafo disconnected (SITE_BASELINE §9). Treat as null.
      if (temp != null && temp >= 800) temp = null;
      out.push({
        trafoId: id,
        source: "chassis",
        latestTs: ts ? ts.toISOString() : null,
        temperaturePcb: null,
        temperatureOil: null,
        pressureOil: null,
        waterContent: null,
        waterActivity: null,
        hydrogen: null,
        chassisTemp: temp,
      });
    }
  }
  return out;
}

/**
 * Latest readings for every trafo under `feeder`. H2Sense-instrumented trafos
 * get full oil/H2 telemetry; the rest fall back to the PT100 chassis sensor
 * from the `Temp_Trafos_*` family.
 */
export async function getTrafosForFeeder(feeder: string): Promise<TrafoHealth[]> {
  const h2senseIds = FEEDER_TRAFOS[feeder] ?? [];
  const chassisSources = CHASSIS_SOURCES_BY_FEEDER[feeder] ?? [];
  const [h2, chassis] = await Promise.all([
    fetchH2SenseTrafos(h2senseIds),
    fetchChassisTrafos(chassisSources),
  ]);
  return [...h2, ...chassis];
}
