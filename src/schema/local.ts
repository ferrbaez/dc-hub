/**
 * Local DB schema (our own — TimescaleDB). Grow as modules need it.
 * Hypertables are created by raw SQL in a post-migration step; Drizzle
 * only owns the base table DDL.
 */
import {
  bigint,
  bigserial,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  // 'admin' | 'user' — admins can create other users later via UI
  role: text("role").notNull().default("user"),
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
    // For assistant messages that executed a query:
    sqlGenerated: text("sql_generated"),
    dataSource: text("data_source"), // 'ics' | 'scada' | 'local'
    rationale: text("rationale"),
    resultRows: jsonb("result_rows"),
    resultColumns: jsonb("result_columns"),
    rowCount: integer("row_count"),
    durationMs: integer("duration_ms"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    // Telemetry
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    cacheReadTokens: integer("cache_read_tokens"),
    cacheCreationTokens: integer("cache_creation_tokens"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    conversationCreatedIdx: index("idx_chat_messages_conv_created").on(
      t.conversationId,
      t.createdAt,
    ),
  }),
);

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
