import "server-only";
import { getScadaRequest } from "@/lib/db/scada";

/**
 * Feeder mapping from SITE_BASELINE §5. Updated manually if topology changes.
 * The string describes what the feeder serves — shown in the UI.
 */
export const FEEDER_MAP: Record<string, string> = {
  AL01: "AXXA F/G",
  AL02: "ND N4,N5,N6",
  AL03: "ND N1,N2,N3",
  AL04: "ND N7,N8,N9",
  AL05: "ND N10,N11,N12",
  AL06: "ZPJV A11–A32",
  AL07: "ZPJV B + SAZ Hydro",
  AL08: "ZPJV C11–C32",
  AL09: "D11–D32 (mixto)",
  AL10: "MARA1 E11–E32 + T11–T42",
  AL11: "ZPJV S6–S9",
  AL12: "ZPJV S1–S5",
  AL13: "MARA2 M1–M3,M11–M13",
  AL14: "MARA2 M4–M7,M14–M17",
  AL15: "MARA2 M8–M10,M18–M20",
  BC02: "SAZ Fan Z1,Z2,Z3",
};

export type FeederLive = {
  feeder: string;
  serves: string;
  latestTs: string | null;
  energyNow: number | null; // raw bigint counter
  energyHourAgo: number | null;
  kwAvgLastHour: number | null; // energy delta / 1h
  kwNow: number | null; // instantaneous from Registros_AL*.Total_Power (media side)
  // 3-phase electrical detail per SCADA Registros_AL*:
  voltageRS: number | null;
  voltageST: number | null;
  voltageTR: number | null;
  currentR: number | null;
  currentS: number | null;
  currentT: number | null;
  fp: number | null;
  frequency: number | null;
  // Baja-side aggregation (sum of container kW under this feeder at 380V)
  bajaKw: number | null;
  overheadKw: number | null; // kwNow − bajaKw (transformer + distribution losses)
  overheadPct: number | null; // overheadKw / kwNow * 100
};

const FEEDERS = Object.keys(FEEDER_MAP);

// -----------------------------------------------------------------------------
// Feeder → container mapping (SITE_BASELINE §5). Used to compute baja-side
// consumption per feeder so we can derive the transformer-level overhead.
// -----------------------------------------------------------------------------

type ContainerShape =
  | "std" // {n}_Potencia_Activa_Kw_lado_A + _lado_B   (most ZPJV/SAZ/AXXA hydro)
  | "activePower" // {n}_Active_Power_Total_lado_A + _Lado_B  (ND, MARA1 T-series, D22)
  | "mara2" // {n}_A_Potencia_Activa_Kw + {n}_B_Potencia_Activa_Kw  (MARA2 M)
  | "eSeries"; //  {n}_Total_system_power_Lado_A + _Lado_B  (MARA1 E series — distinct meter model)

type FeederContainer = { name: string; shape: ContainerShape };

const std = (names: string[]): FeederContainer[] =>
  names.map((name) => ({ name, shape: "std" as const }));
const ap = (names: string[]): FeederContainer[] =>
  names.map((name) => ({ name, shape: "activePower" as const }));
const m2 = (names: string[]): FeederContainer[] =>
  names.map((name) => ({ name, shape: "mara2" as const }));
const es = (names: string[]): FeederContainer[] =>
  names.map((name) => ({ name, shape: "eSeries" as const }));

const FEEDER_CONTAINERS: Record<string, FeederContainer[]> = {
  AL01: std(["F21", "F22", "F31", "F32", "G11", "G12", "G21", "G22"]), // AXXA F/G
  AL02: ap(["N4", "N5", "N6"]),
  AL03: ap(["N1", "N2", "N3"]),
  AL04: ap(["N7", "N8", "N9"]),
  AL05: ap(["N10", "N11", "N12"]),
  AL06: std(["A11", "A12", "A21", "A22", "A31", "A32"]),
  AL07: std(["B11", "B12", "B21", "B22", "B31", "B32"]),
  AL08: std(["C11", "C12", "C21", "C22", "C31", "C32"]),
  // D22 uses Active_Power_Total (not Potencia_Activa_Kw) — split by shape:
  AL09: [...std(["D11", "D12", "D21", "D31", "D32"]), ...ap(["D22"])],
  // MARA1: E-series uses `Total_system_power_Lado_A/B` (unique meter family).
  // T-series (all 8: T11,T12,T21,T22,T31,T32,T41,T42) uses Active_Power_Total.
  AL10: [
    ...es(["E11", "E12", "E21", "E22", "E31", "E32"]),
    ...ap(["T11", "T12", "T21", "T22", "T31", "T32", "T41", "T42"]),
  ],
  AL11: std(["S6", "S7", "S8", "S9"]),
  AL12: std(["S1", "S2", "S3", "S4", "S5"]),
  AL13: m2(["M1", "M2", "M3", "M11", "M12", "M13"]),
  AL14: m2(["M4", "M5", "M6", "M7", "M14", "M15", "M16", "M17"]),
  AL15: m2(["M8", "M9", "M10", "M18", "M19", "M20"]),
  BC02: [], // SAZ Fan Z1-Z3 have 4-side shape — skipping for v1
};

function buildBajaKwSql(c: FeederContainer): string {
  const n = c.name;
  if (c.shape === "std") {
    return `
      SELECT TOP 1
        ISNULL(${n}_Potencia_Activa_Kw_lado_A, 0) + ISNULL(${n}_Potencia_Activa_Kw_lado_B, 0) AS kw
      FROM Registros_${n}
      WHERE Time_Stamp >= DATEADD(minute, -10, GETDATE())
      ORDER BY Time_Stamp DESC
      OPTION (MAXDOP 2);
    `;
  }
  if (c.shape === "activePower") {
    return `
      SELECT TOP 1
        ISNULL(${n}_Active_Power_Total_lado_A, 0) + ISNULL(${n}_Active_Power_Total_Lado_B, 0) AS kw
      FROM Registros_${n}
      WHERE Time_Stamp >= DATEADD(minute, -10, GETDATE())
      ORDER BY Time_Stamp DESC
      OPTION (MAXDOP 2);
    `;
  }
  if (c.shape === "eSeries") {
    return `
      SELECT TOP 1
        ISNULL(${n}_Total_system_power_Lado_A, 0) + ISNULL(${n}_Total_system_power_Lado_B, 0) AS kw
      FROM Registros_${n}
      WHERE Time_Stamp >= DATEADD(minute, -10, GETDATE())
      ORDER BY Time_Stamp DESC
      OPTION (MAXDOP 2);
    `;
  }
  return `
    SELECT TOP 1
      ISNULL(${n}_A_Potencia_Activa_Kw, 0) + ISNULL(${n}_B_Potencia_Activa_Kw, 0) AS kw
    FROM Registros_${n}
    WHERE Time_Stamp >= DATEADD(minute, -10, GETDATE())
    ORDER BY Time_Stamp DESC
    OPTION (MAXDOP 2);
  `;
}

/**
 * Per-feeder total baja-side kW, summed across containers under each feeder.
 * Uses parallel queries respecting pool max=2. Errors per container become 0
 * (don't break the whole row).
 */
async function getBajaKwPerFeeder(): Promise<Map<string, number | null>> {
  const out = new Map<string, number | null>();
  await Promise.all(
    Object.entries(FEEDER_CONTAINERS).map(async ([feeder, containers]) => {
      if (containers.length === 0) {
        out.set(feeder, null);
        return;
      }
      const results = await Promise.allSettled(
        containers.map(async (c) => {
          const req = await getScadaRequest({ timeoutMs: 5_000 });
          const res = await req.query(buildBajaKwSql(c));
          const row = res.recordset?.[0] as { kw: number | null } | undefined;
          return Number(row?.kw ?? 0) || 0;
        }),
      );
      const sum = results.reduce((acc, r) => acc + (r.status === "fulfilled" ? r.value : 0), 0);
      out.set(feeder, sum);
    }),
  );
  return out;
}

/**
 * Fetch electrical overview per feeder using:
 *  1. `Alimentadores` (latest row + ~1h ago row) → energy delta = avg kW
 *  2. Per-feeder `Registros_AL##` latest row → instant Kw + V + I + FP
 *
 * Two main queries + N parallel small queries (N = 16 feeders). Respects pool max=2.
 */
export async function getFeedersLive(): Promise<FeederLive[]> {
  const req = await getScadaRequest({ timeoutMs: 15_000 });

  // --- Step 1: Alimentadores latest + ~1h ago in one round-trip via two SELECTs ---
  const energyCols = FEEDERS.map((f) => `${f}_Energy`).join(", ");
  const alimentadoresSql = `
    ;WITH t_now AS (
      SELECT TOP 1 Time_Stamp, ${energyCols}
      FROM Alimentadores
      WHERE Time_Stamp <= GETDATE()
      ORDER BY Time_Stamp DESC
    ),
    t_prev AS (
      SELECT TOP 1 Time_Stamp, ${energyCols}
      FROM Alimentadores
      WHERE Time_Stamp <= DATEADD(hour, -1, GETDATE())
      ORDER BY Time_Stamp DESC
    )
    SELECT
      (SELECT Time_Stamp FROM t_now) AS now_ts,
      (SELECT Time_Stamp FROM t_prev) AS prev_ts,
      ${FEEDERS.map((f) => `(SELECT ${f}_Energy FROM t_now) AS ${f}_now, (SELECT ${f}_Energy FROM t_prev) AS ${f}_prev`).join(", ")}
    OPTION (MAXDOP 2);
  `;

  const alimRes = await req.query(alimentadoresSql);
  const alimRow = (alimRes.recordset?.[0] ?? {}) as Record<string, unknown>;
  const latestTs = (alimRow.now_ts as Date | null) ?? null;
  const prevTs = (alimRow.prev_ts as Date | null) ?? null;
  const hoursElapsed =
    latestTs && prevTs ? (latestTs.getTime() - prevTs.getTime()) / 3_600_000 : null;

  // --- Step 2: per-feeder latest Registros_AL## row with full 3-phase detail ---
  // mssql pool max=2 naturally serialises; fire all 16 in parallel.
  type Live = {
    kw: number | null;
    vRS: number | null;
    vST: number | null;
    vTR: number | null;
    iR: number | null;
    iS: number | null;
    iT: number | null;
    fp: number | null;
    freq: number | null;
  };
  const perFeeder: Record<string, Live> = {};
  const results = await Promise.allSettled(
    FEEDERS.map(async (f) => {
      const r = await getScadaRequest({ timeoutMs: 5_000 });
      const q = await r.query(`
        SELECT TOP 1
          ${f}_Total_Power    AS kw,
          ${f}_Voltaje_RS     AS v_rs,
          ${f}_Voltaje_ST     AS v_st,
          ${f}_Voltaje_TR     AS v_tr,
          ${f}_Corriente_IR   AS i_r,
          ${f}_Corriente_IS   AS i_s,
          ${f}_Corriente_IT   AS i_t,
          ${f}_FP             AS fp,
          ${f}_Frecuencia     AS freq
        FROM Registros_${f}
        WHERE Time_Stamp >= DATEADD(minute, -10, GETDATE())
        ORDER BY Time_Stamp DESC
        OPTION (MAXDOP 2);
      `);
      return { feeder: f, row: q.recordset?.[0] };
    }),
  );
  for (const res of results) {
    if (res.status !== "fulfilled") continue;
    const row = (res.value.row ?? {}) as Record<string, unknown>;
    perFeeder[res.value.feeder] = {
      kw: num(row.kw),
      vRS: num(row.v_rs),
      vST: num(row.v_st),
      vTR: num(row.v_tr),
      iR: num(row.i_r),
      iS: num(row.i_s),
      iT: num(row.i_t),
      fp: num(row.fp),
      freq: num(row.freq),
    };
  }

  // --- Step 3: sum baja-side container kW per feeder ---
  const bajaMap = await getBajaKwPerFeeder();

  return FEEDERS.map<FeederLive>((f) => {
    const nowCounter = num(alimRow[`${f}_now`]);
    const prevCounter = num(alimRow[`${f}_prev`]);
    const delta = nowCounter != null && prevCounter != null ? nowCounter - prevCounter : null;
    // *_Energy is a Wh counter (bigint): delta / hours = W. /1000 = kW.
    const kwAvgLastHour = delta != null && hoursElapsed ? delta / hoursElapsed / 1000 : null;
    const live = perFeeder[f] ?? {
      kw: null,
      vRS: null,
      vST: null,
      vTR: null,
      iR: null,
      iS: null,
      iT: null,
      fp: null,
      freq: null,
    };
    const bajaKw = bajaMap.get(f) ?? null;
    const overheadKw = live.kw != null && bajaKw != null && bajaKw > 0 ? live.kw - bajaKw : null;
    const overheadPct =
      overheadKw != null && live.kw != null && live.kw > 0 ? (overheadKw / live.kw) * 100 : null;
    return {
      feeder: f,
      serves: FEEDER_MAP[f] ?? "—",
      latestTs: latestTs ? latestTs.toISOString() : null,
      energyNow: nowCounter,
      energyHourAgo: prevCounter,
      kwAvgLastHour,
      kwNow: live.kw,
      voltageRS: live.vRS,
      voltageST: live.vST,
      voltageTR: live.vTR,
      currentR: live.iR,
      currentS: live.iS,
      currentT: live.iT,
      fp: live.fp,
      frequency: live.freq,
      bajaKw,
      overheadKw,
      overheadPct,
    };
  });
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
