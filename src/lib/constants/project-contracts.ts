/**
 * Contract allocations per project, from the "Core Clients" master list
 * (00_CORE_Client_JV_Master_List.xlsx) + SITE_BASELINE §15.
 *
 * Used as a fallback when `client_tariffs` table hasn't been seeded yet.
 * Admin UI for editing tariffs will supersede this at that point.
 *
 * Keys match ICS `projects.name` exactly.
 */
export type ProjectContract = {
  clientName: string;
  allocationMw: number;
  coolingType: "Hydro" | "Immersion" | "AirCooled" | "Mixed";
  status: "Active" | "Inactive" | "Redirected";
  notes?: string;
};

export const PROJECT_CONTRACTS: Record<string, ProjectContract> = {
  // --- Hosting contracts ---
  HC2: {
    clientName: "GUY SCHWARZENBACH",
    allocationMw: 1,
    coolingType: "AirCooled",
    status: "Active",
  },
  HC3: {
    clientName: "AFTech AG (Thomas)",
    allocationMw: 1,
    coolingType: "AirCooled",
    status: "Active",
  },
  HC4: {
    clientName: "Grupo F15 (AXXA)",
    allocationMw: 10.5,
    coolingType: "Hydro",
    status: "Active",
  },
  "HC5-1": {
    clientName: "SAZMINING INC.",
    allocationMw: 3,
    coolingType: "AirCooled",
    status: "Active",
  },
  "HC5-2": {
    clientName: "SAZMINING INC.",
    allocationMw: 3,
    coolingType: "Hydro",
    status: "Active",
  },

  // --- JV (Joint Venture) contracts ---
  "JV1-1": {
    clientName: "ZP Ltd. (ZPJV)",
    allocationMw: 16,
    coolingType: "Hydro",
    status: "Active",
  },
  "JV1-2": {
    clientName: "ZP Ltd. (ZPJV)",
    allocationMw: 1.8,
    coolingType: "AirCooled",
    status: "Inactive",
    notes: "Redirected capacity",
  },
  JV2: {
    clientName: "MARATHON (MARA)",
    allocationMw: 15,
    coolingType: "Immersion",
    status: "Active",
    notes: "Mara1 E/T — allocation approximate, varies",
  },
  JV3: {
    clientName: "MARATHON (MARA)",
    allocationMw: 20,
    coolingType: "AirCooled",
    status: "Active",
    notes: "Mara2 M — allocation approximate, varies",
  },
  JV4: { clientName: "ZP Ltd. (ZPJV)", allocationMw: 9.5, coolingType: "Hydro", status: "Active" },
  JV5: { clientName: "NORTHERN DATA", allocationMw: 28, coolingType: "Hydro", status: "Active" },

  // --- Alt MARATHON identifiers (seen in revenue DB) ---
  MARA1: {
    clientName: "MARATHON (MARA)",
    allocationMw: 15,
    coolingType: "Immersion",
    status: "Active",
  },
  MARA2: {
    clientName: "MARATHON (MARA)",
    allocationMw: 20,
    coolingType: "AirCooled",
    status: "Active",
  },
  OCEAN_MARA_GENERAL: {
    clientName: "MARATHON (MARA)",
    allocationMw: 0,
    coolingType: "Mixed",
    status: "Active",
    notes: "Pool aggregator — no dedicated capacity",
  },
};

export function getProjectContract(projectName: string | null | undefined): ProjectContract | null {
  if (!projectName) return null;
  return PROJECT_CONTRACTS[projectName] ?? null;
}
