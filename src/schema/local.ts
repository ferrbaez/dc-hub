/**
 * Local DB schema (our own — TimescaleDB). Grow as modules need it.
 * Hypertables are created by raw SQL in a post-migration step; Drizzle
 * only owns the base table DDL.
 */
import {
  bigint,
  bigserial,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("user"), // 'admin' | 'user'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatConversations = pgTable(
  "chat_conversations",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    userId: bigint("user_id", { mode: "bigint" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userUpdatedIdx: index("idx_chat_conversations_user_updated").on(t.userId, t.updatedAt),
  }),
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    conversationId: bigint("conversation_id", { mode: "bigint" })
      .notNull()
      .references(() => chatConversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // 'user' | 'assistant'
    content: text("content").notNull(),
    sqlGenerated: text("sql_generated"),
    dataSource: text("data_source"), // 'ics' | 'scada' | 'local' | 'revenue_mara' | 'revenue_nd' | 'revenue_zp'
    rationale: text("rationale"),
    resultRows: jsonb("result_rows"),
    resultColumns: jsonb("result_columns"),
    rowCount: integer("row_count"),
    durationMs: integer("duration_ms"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    cacheReadTokens: integer("cache_read_tokens"),
    cacheCreationTokens: integer("cache_creation_tokens"),
    metadata: jsonb("metadata"), // { kind: "clarification", candidates: [...] }
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    conversationCreatedIdx: index("idx_chat_messages_conv_created").on(
      t.conversationId,
      t.createdAt,
    ),
  }),
);

// ---------------------------------------------------------------------------
// Client tariffs — breakdown técnico estilo Bitdeer (ver docs/SITE_BASELINE.md §15)
// ---------------------------------------------------------------------------

/**
 * Current-state tariff per project. One row per project (`project_id_external`
 * matches the name in ICS `projects.name` / revenue DBs `projects.name`, e.g.
 * "JV1-1", "HC4", "MARA1", "MARA2").
 *
 * Every UPDATE goes through `client_tariff_history` first so we never lose
 * historical pricing (used by Rentabilidad to re-bill a past month).
 */
export const clientTariffs = pgTable(
  "client_tariffs",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    projectIdExternal: text("project_id_external").notNull().unique(), // "JV1-1", "HC4", ...
    clientName: text("client_name").notNull(), // "ZP Ltd.", "Grupo F15 (AXXA)"
    contractType: text("contract_type").notNull(), // 'JV' | 'Hosting'
    status: text("status").notNull().default("Active"), // 'Active' | 'Redirected' | 'Inactive'
    allocationMw: numeric("allocation_mw"),
    dominantConfig: text("dominant_config"), // "Hydro: S19 XP", "AirCooled: S19J Pro"

    // Pricing breakdown (USD/kWh)
    energyPassThrough: numeric("energy_pass_through_usd_kwh"),
    hostingFee: numeric("hosting_fee_usd_kwh"),
    socialContribution: numeric("social_contribution_usd_kwh"),
    vatRate: numeric("vat_rate"), // 0.10 default for 10%
    clientPriceTotal: numeric("client_price_total_usd_kwh"), // computed or manual

    // Water (USD/m³) — separate billing line where applicable
    waterRateUsdM3: numeric("water_rate_usd_m3"),

    // Contract window
    effectiveDate: date("effective_date"),
    expirationDate: date("expiration_date"),

    // BTC / pool
    walletType: text("wallet_type"), // "Multisig ZP", "Client", "Multisig Penguin 3 of 5"
    pool: text("pool"), // "Ocean" | "Luxor" | "Luxor & Ocean" | "braiins"
    btcUpsidePct: numeric("btc_upside_pct"), // 0.15 for ZP; NULL for pure hosting

    // Reference profitability (from the master list)
    theoreticalHashratePhs: numeric("theoretical_hashrate_phs"),
    fleetEfficiencyJTh: numeric("fleet_efficiency_j_th"),
    breakevenPureEnergy: numeric("breakeven_pure_energy"),
    breakevenWithOpex: numeric("breakeven_with_opex"),
    breakevenAllIn: numeric("breakeven_all_in"),

    // Metadata
    notes: text("notes"),
    updatedBy: bigint("updated_by", { mode: "bigint" }).references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    clientIdx: index("idx_client_tariffs_client").on(t.clientName),
  }),
);

/**
 * Append-only history. Every time a tariff changes, the previous row is
 * snapshotted here with the effective window. Used for reprocessing past
 * invoices at historically-correct pricing.
 */
export const clientTariffHistory = pgTable(
  "client_tariff_history",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    tariffId: bigint("tariff_id", { mode: "bigint" })
      .notNull()
      .references(() => clientTariffs.id, { onDelete: "cascade" }),
    projectIdExternal: text("project_id_external").notNull(),
    // Snapshot of all pricing fields at the moment of the change
    snapshot: jsonb("snapshot").notNull(), // Full row as JSON
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveUntil: timestamp("effective_until", { withTimezone: true }), // null = current
    changedBy: bigint("changed_by", { mode: "bigint" }).references(() => users.id, {
      onDelete: "set null",
    }),
    changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    byTariffIdx: index("idx_client_tariff_history_tariff").on(t.tariffId, t.effectiveFrom),
  }),
);

/**
 * Machine catalog — nominal spec per miner model. Used to compute theoretical
 * vs. real efficiency. Admin-editable.
 */
export const machineConfigs = pgTable("machine_configs", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  model: text("model").notNull().unique(), // "Antminer S19 XP 141T", "Whatsminer M63 493T", ...
  brand: text("brand").notNull(), // "Bitmain", "MicroBT", ...
  nominalHashrateThs: numeric("nominal_hashrate_ths").notNull(),
  nominalWattage: numeric("nominal_wattage").notNull(),
  efficiencyJTh: numeric("efficiency_j_th").notNull(), // wattage / hashrate
  cooling: text("cooling").notNull(), // 'Air' | 'Hydro' | 'Immersion'
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Operations / observability
// ---------------------------------------------------------------------------

export const jobRuns = pgTable("job_runs", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  jobName: text("job_name").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  status: text("status").notNull(), // 'running' | 'success' | 'error'
  durationMs: integer("duration_ms"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
});
