import { listProjectsRollup } from "@/lib/queries/ics/containers";
import { listTariffAllocations } from "@/lib/queries/local/tariffs";
import { getCoolingLive } from "@/lib/queries/scada/cooling";
import { getFeedersLive } from "@/lib/queries/scada/electrico";
import {
  getAlimentadoresEnergyHourly,
  getCoolingTempHourly,
  getPowerWithWeatherHourly,
  getPueHourly,
  getWeatherLatest,
} from "@/lib/queries/scada/timeseries";
import { getTrafosForFeeder } from "@/lib/queries/scada/trafos";
import { areaProcedure, protectedProcedure, router } from "@/server/trpc";
import { z } from "zod";

// Time-range selector for the /graficos page.
// Capped at 30 days (720h) to keep SCADA queries bounded.
const hoursInput = z.object({
  hours: z
    .number()
    .int()
    .min(1)
    .max(24 * 30),
});

export const siteRouter = router({
  /** SCADA: per-feeder electrical overview (Kw avg last hour + V/I/FP live). */
  electrico: protectedProcedure.query(async () => {
    return getFeedersLive();
  }),

  /** SCADA: per-container cooling snapshot. Parallel fetches across ~52 containers. */
  cooling: protectedProcedure.query(async () => {
    return getCoolingLive();
  }),

  /**
   * SCADA: H2Sense readings for all transformers under a feeder.
   * Lazy — only called when user expands a feeder row.
   */
  trafosForFeeder: protectedProcedure
    .input(z.object({ feeder: z.string().min(1) }))
    .query(async ({ input }) => {
      return getTrafosForFeeder(input.feeder);
    }),

  /** SCADA: total site MW per hour, derived from Alimentadores energy counters. */
  timeseriesElectric: protectedProcedure.input(hoursInput).query(async ({ input }) => {
    return getAlimentadoresEnergyHourly(input.hours);
  }),

  /** SCADA: hourly avg + max water-out (°C) across ZPJV A-series containers. */
  timeseriesCooling: protectedProcedure.input(hoursInput).query(async ({ input }) => {
    return getCoolingTempHourly(input.hours);
  }),

  /** SCADA: hourly PUE_General from PUE_Registros. */
  timeseriesPue: protectedProcedure.input(hoursInput).query(async ({ input }) => {
    return getPueHourly(input.hours);
  }),

  /** SCADA: weather station latest reading (temp, humidity, pressure, wind, rain). */
  weatherLatest: protectedProcedure.query(async () => {
    return getWeatherLatest();
  }),

  /** SCADA: site MW + weather overlay per hour (for correlated chart). */
  timeseriesPowerWithWeather: protectedProcedure.input(hoursInput).query(async ({ input }) => {
    return getPowerWithWeatherHourly(input.hours);
  }),

  /** ICS: per-project rollup (power, hashrate, miners, uptime). */
  projectsRollup: protectedProcedure.query(async () => {
    return listProjectsRollup();
  }),

  /** Local DB: contract allocations per project (from client_tariffs).
   * Sensitive (commercial data) — restricted to `core` area + admins. */
  tariffAllocations: areaProcedure("core").query(async () => {
    return listTariffAllocations();
  }),
});
