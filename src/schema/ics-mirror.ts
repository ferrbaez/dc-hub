/**
 * Type mirror of the ICS Postgres schema.
 * Read-only — never run migrations against ICS from this app.
 * Grow this file as modules start querying more tables.
 */
import {
  bigint,
  bigserial,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const containers = pgTable(
  "containers",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    name: varchar("name", { length: 255 }).notNull(),
    sn: varchar("sn", { length: 255 }).notNull(),
    brand: varchar("brand", { length: 255 }),
    modelName: varchar("model_name", { length: 255 }),
    customerId: bigint("customer_id", { mode: "bigint" }),
    coolingId: bigint("cooling_id", { mode: "bigint" }),
    transformerId: bigint("transformer_id", { mode: "bigint" }),
    projectId: bigint("project_id", { mode: "bigint" }),
  },
  (t) => ({
    deletedAtIdx: index("idx_containers_deleted_at").on(t.deletedAt),
  }),
);

export const containersDetails = pgTable("containers_details", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  containerId: bigint("container_id", { mode: "bigint" }),
  hashrateNominal: numeric("hashrate_nominal"),
  hashrateTotal: numeric("hashrate_total"),
  totalMiners: bigint("total_miners", { mode: "bigint" }),
  minersOnline: bigint("miners_online", { mode: "bigint" }),
  minersHashing: bigint("miners_hashing", { mode: "bigint" }),
  minersOffline: bigint("miners_offline", { mode: "bigint" }),
  minersSleeping: bigint("miners_sleeping", { mode: "bigint" }),
  minersFailing: bigint("miners_failing", { mode: "bigint" }),
  theoreticalConsumption: numeric("theoretical_consumption"),
  activePower: numeric("active_power"),
  energy: numeric("energy"),
  totalMinersReal: bigint("total_miners_real", { mode: "bigint" }),
});

export const projects = pgTable("projects", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  name: text("name"),
  targetConsumption: numeric("target_consumption"),
});

export const customers = pgTable("customers", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  name: text("name").notNull(),
  idForeman: bigint("id_foreman", { mode: "bigint" }),
});
