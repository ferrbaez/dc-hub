import "server-only";
import { icsQuery } from "@/lib/db/ics";

export type ContainerWithCurrentHashrate = {
  id: string;
  name: string;
  brand: string | null;
  model_name: string | null;
  hashrate_total: string | null;
  hashrate_nominal: string | null;
  miners_online: string | null;
  miners_hashing: string | null;
  miners_offline: string | null;
  active_power: string | null;
  details_updated_at: string | null;
};

/**
 * Current snapshot per container, joined with containers_details.
 * Soft-deleted containers are excluded. Source of truth: ICS.
 */
export async function listContainersWithCurrent(): Promise<ContainerWithCurrentHashrate[]> {
  return icsQuery<ContainerWithCurrentHashrate>(`
    SELECT
      c.id::text                          AS id,
      c.name                              AS name,
      c.brand                             AS brand,
      c.model_name                        AS model_name,
      cd.hashrate_total::text             AS hashrate_total,
      cd.hashrate_nominal::text           AS hashrate_nominal,
      cd.miners_online::text              AS miners_online,
      cd.miners_hashing::text             AS miners_hashing,
      cd.miners_offline::text             AS miners_offline,
      cd.active_power::text               AS active_power,
      cd.updated_at::text                 AS details_updated_at
    FROM containers c
    LEFT JOIN containers_details cd ON cd.container_id = c.id
    WHERE c.deleted_at IS NULL
    ORDER BY c.name ASC
  `);
}
