import "server-only";
import { getLocalDb } from "@/lib/db/local";
import { clientTariffs } from "@/schema/local";

export type TariffAllocation = {
  project_id_external: string;
  client_name: string;
  allocation_mw: number | null;
  client_price_total_usd_kwh: number | null;
};

/**
 * Contracted allocation per project, keyed by `project_id_external` (matches
 * ICS `projects.name`, e.g. "JV1-1", "HC4"). Used by the /graficos NOC view
 * to show real consumption vs contract.
 */
export async function listTariffAllocations(): Promise<TariffAllocation[]> {
  const db = getLocalDb();
  const rows = await db
    .select({
      project_id_external: clientTariffs.projectIdExternal,
      client_name: clientTariffs.clientName,
      allocation_mw: clientTariffs.allocationMw,
      client_price_total_usd_kwh: clientTariffs.clientPriceTotal,
    })
    .from(clientTariffs);
  return rows.map((r) => ({
    project_id_external: r.project_id_external,
    client_name: r.client_name,
    allocation_mw: r.allocation_mw != null ? Number(r.allocation_mw) : null,
    client_price_total_usd_kwh:
      r.client_price_total_usd_kwh != null ? Number(r.client_price_total_usd_kwh) : null,
  }));
}
