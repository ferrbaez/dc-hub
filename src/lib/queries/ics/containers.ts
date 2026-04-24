import "server-only";
import { icsQuery } from "@/lib/db/ics";

export type ContainerWithCurrentHashrate = {
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
  energy: string | null;
  details_updated_at: string | null;
  /** % of history samples in the last 24h where miner was online (of total). 0..100 */
  online_uptime_pct: string | null;
  /** % of history samples in the last 24h where miner was hashing (of total). 0..100 */
  hashing_uptime_pct: string | null;
};

/**
 * Current snapshot per container, joined with containers_details + customer + project.
 * Soft-deleted containers are excluded. Uptime is fetched separately (see
 * `listContainersUptime24h`) because the read-only ICS user may not have SELECT
 * on the `container_histories` partitioned table — keeping the joins separate
 * means the dashboard stays alive even when uptime can't be computed.
 */
async function listContainersCore(): Promise<
  Omit<ContainerWithCurrentHashrate, "online_uptime_pct" | "hashing_uptime_pct">[]
> {
  return icsQuery<Omit<ContainerWithCurrentHashrate, "online_uptime_pct" | "hashing_uptime_pct">>(`
    SELECT
      c.id::text                          AS id,
      c.name                              AS name,
      c.brand                             AS brand,
      c.model_name                        AS model_name,
      cu.name                             AS customer_name,
      p.name                              AS project_name,
      cd.hashrate_total::text             AS hashrate_total,
      cd.hashrate_nominal::text           AS hashrate_nominal,
      cd.total_miners::text               AS total_miners,
      cd.miners_online::text              AS miners_online,
      cd.miners_hashing::text             AS miners_hashing,
      cd.miners_offline::text             AS miners_offline,
      cd.miners_sleeping::text            AS miners_sleeping,
      cd.miners_failing::text             AS miners_failing,
      cd.active_power::text               AS active_power,
      cd.theoretical_consumption::text    AS theoretical_consumption,
      cd.energy::text                     AS energy,
      cd.updated_at::text                 AS details_updated_at
    FROM containers c
    LEFT JOIN containers_details cd ON cd.container_id = c.id
    LEFT JOIN customers cu            ON cu.id = c.customer_id AND cu.deleted_at IS NULL
    LEFT JOIN projects p              ON p.id = c.project_id AND p.deleted_at IS NULL
    WHERE c.deleted_at IS NULL
    ORDER BY c.name ASC
  `);
}

type UptimeRow = {
  container_id: string;
  online_uptime_pct: string | null;
  hashing_uptime_pct: string | null;
};

/**
 * Rolling 24h uptime from container_histories. Returns an empty map if the
 * ICS user lacks SELECT permission on the table (fail-soft).
 */
async function listContainersUptime24h(): Promise<Map<string, UptimeRow>> {
  try {
    const rows = await icsQuery<UptimeRow>(`
      SELECT
        container_id::text AS container_id,
        (AVG(CASE WHEN total_miners > 0 THEN miners_online::numeric / NULLIF(total_miners, 0) ELSE NULL END) * 100)::text AS online_uptime_pct,
        (AVG(CASE WHEN total_miners > 0 THEN miners_hashing::numeric / NULLIF(total_miners, 0) ELSE NULL END) * 100)::text AS hashing_uptime_pct
      FROM container_histories
      WHERE created_at >= NOW() - INTERVAL '24 hours'
        AND deleted_at IS NULL
      GROUP BY container_id
    `);
    const map = new Map<string, UptimeRow>();
    for (const r of rows) map.set(r.container_id, r);
    return map;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[ics] container_histories uptime skipped: ${msg}`);
    return new Map();
  }
}

/**
 * Current snapshot per container + 24h uptime. Core query and uptime query
 * run in parallel; uptime is merged in when available.
 */
export async function listContainersWithCurrent(): Promise<ContainerWithCurrentHashrate[]> {
  const [core, uptime] = await Promise.all([listContainersCore(), listContainersUptime24h()]);
  return core.map((c) => {
    const up = uptime.get(c.id);
    return {
      ...c,
      online_uptime_pct: up?.online_uptime_pct ?? null,
      hashing_uptime_pct: up?.hashing_uptime_pct ?? null,
    };
  });
}

// -----------------------------------------------------------------------------
// Per-project rollup — powers the NOC-style /graficos page
// -----------------------------------------------------------------------------

export type ProjectRollup = {
  project_id: string;
  project_name: string;
  customer_name: string | null;
  container_count: number;
  active_power_kw: number;
  hashrate_total_ths: number;
  total_miners: number;
  miners_hashing: number;
  miners_online: number;
  online_uptime_pct: number | null;
  hashing_uptime_pct: number | null;
};

/** One row per project with aggregate counters. */
export async function listProjectsRollup(): Promise<ProjectRollup[]> {
  const [rollup, uptime] = await Promise.all([
    icsQuery<{
      project_id: string;
      project_name: string;
      customer_name: string | null;
      container_count: string;
      active_power_kw: string | null;
      hashrate_total_ths: string | null;
      total_miners: string | null;
      miners_hashing: string | null;
      miners_online: string | null;
    }>(`
      SELECT
        p.id::text                              AS project_id,
        COALESCE(p.name, '—')                   AS project_name,
        cu.name                                 AS customer_name,
        COUNT(c.id)::text                       AS container_count,
        SUM(cd.active_power)::text              AS active_power_kw,
        SUM(cd.hashrate_total)::text            AS hashrate_total_ths,
        SUM(cd.total_miners)::text              AS total_miners,
        SUM(cd.miners_hashing)::text            AS miners_hashing,
        SUM(cd.miners_online)::text             AS miners_online
      FROM projects p
      LEFT JOIN containers c            ON c.project_id = p.id AND c.deleted_at IS NULL
      LEFT JOIN containers_details cd   ON cd.container_id = c.id
      LEFT JOIN customers cu            ON cu.id = c.customer_id AND cu.deleted_at IS NULL
      WHERE p.deleted_at IS NULL
      GROUP BY p.id, p.name, cu.name
      HAVING COUNT(c.id) > 0
      ORDER BY p.name
    `),
    listProjectsUptime24h(),
  ]);

  return rollup.map((r) => {
    const up = uptime.get(r.project_id);
    return {
      project_id: r.project_id,
      project_name: r.project_name,
      customer_name: r.customer_name,
      container_count: Number(r.container_count) || 0,
      active_power_kw: Number(r.active_power_kw) || 0,
      hashrate_total_ths: Number(r.hashrate_total_ths) || 0,
      total_miners: Number(r.total_miners) || 0,
      miners_hashing: Number(r.miners_hashing) || 0,
      miners_online: Number(r.miners_online) || 0,
      online_uptime_pct: up?.online ?? null,
      hashing_uptime_pct: up?.hashing ?? null,
    };
  });
}

async function listProjectsUptime24h(): Promise<Map<string, { online: number; hashing: number }>> {
  try {
    const rows = await icsQuery<{
      project_id: string;
      online_pct: string | null;
      hashing_pct: string | null;
    }>(`
      SELECT
        c.project_id::text AS project_id,
        (AVG(CASE WHEN ch.total_miners > 0 THEN ch.miners_online::numeric / NULLIF(ch.total_miners,0) ELSE NULL END) * 100)::text AS online_pct,
        (AVG(CASE WHEN ch.total_miners > 0 THEN ch.miners_hashing::numeric / NULLIF(ch.total_miners,0) ELSE NULL END) * 100)::text AS hashing_pct
      FROM container_histories ch
      JOIN containers c ON c.id = ch.container_id AND c.deleted_at IS NULL
      WHERE ch.created_at >= NOW() - INTERVAL '24 hours'
        AND ch.deleted_at IS NULL
        AND c.project_id IS NOT NULL
      GROUP BY c.project_id
    `);
    const map = new Map<string, { online: number; hashing: number }>();
    for (const r of rows) {
      const online = r.online_pct != null ? Number(r.online_pct) : 0;
      const hashing = r.hashing_pct != null ? Number(r.hashing_pct) : 0;
      map.set(r.project_id, { online, hashing });
    }
    return map;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[ics] per-project uptime skipped: ${msg}`);
    return new Map();
  }
}
