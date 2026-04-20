# CLAUDE.md — Willian's Hub

Instructions for Claude Code on this project. Read this first, every session.

---

## What this is

**Willian's Hub** — a personal operations hub for an Infrastructure Manager running
BTC mining and data-center infrastructure. It unifies data from two existing
production systems (ICS on Postgres, SCADA on SQL Server / AVEVA Edge) and adds
custom analytics on top.

**This is not a greenfield system.** ICS and SCADA hold the canonical data. Our job
is to query, cross-reference, cache selectively, and add modules — never to become
the source of truth for operational data.

The project is **built as a living backlog, not a fixed plan.** See `docs/ROADMAP.md`
for the approach. Willian picks what to build next. Claude Code does not assume
any ordering beyond Module 0 (the scaffold).

---

## Required reading at the start of every session

1. `CLAUDE.md` (this file)
2. `docs/ROADMAP.md` — specifically the **State** and **Active** sections
3. `docs/ARCHITECTURE.md` — skim if you don't remember it
4. `docs/DATA_SOURCES.md` — before any query

Schema details:
- `docs/schemas/ics.sql` — full ICS Postgres DDL
- `docs/schemas/scada.sql` — full SCADA SQL Server DDL (all 180 tables)
- `docs/schemas/scada-summary.md` — dense summary of SCADA patterns (use first)

**When to consult which:**
- For common queries, `scada-summary.md` has grouped patterns and recipes.
- For exact column names / types / constraints of any specific table, go to `scada.sql`.
- For ICS, `ics.sql` is small enough to scan when needed.

---

## How to work in this repo

- Execution over explanation. Ship working code, not essays.
- Read `docs/ROADMAP.md` **State** before doing anything. Do not start a candidate module unless Willian has placed it in **Active**.
- Ask before assuming, especially on business rules, SLA definitions, what a metric means.
- Small, focused changes. One module or capability at a time.
- TypeScript strict. No `any` without a comment explaining why.
- Don't add a dependency without checking whether something already installed solves it.
- YAGNI. If the current module doesn't need it, don't build it.

---

## Stack (fixed — do not change without explicit discussion)

- Node 20 LTS, pnpm
- Next.js 15 (App Router) + TypeScript strict mode
- Tailwind CSS + shadcn/ui + Tremor (dashboards)
- tRPC v11 for the internal API
- Drizzle ORM for the local DB and typed mirrors of ICS
- `pg` (ICS Postgres), `mssql` (SCADA SQL Server) — both with pooling
- Zod for runtime validation at API and DB boundaries
- TanStack Query (via tRPC)
- Biome for lint + format (single tool, no ESLint + Prettier)
- Docker Compose for local services (TimescaleDB, n8n)

---

## Commands

```bash
pnpm install                    # first time
cp .env.example .env.local      # then fill in credentials
docker compose up -d            # local TimescaleDB + n8n
pnpm db:push                    # apply Drizzle schema to local DB
pnpm healthcheck                # verify ICS + SCADA reachable (VPN must be up)
pnpm dev                        # Next.js dev server on :3000
pnpm lint                       # Biome
pnpm typecheck                  # tsc --noEmit
```

When finishing a change, Claude Code should run `pnpm typecheck` and `pnpm lint`
and fix what it can before handing back.

---

## Non-negotiable rules

### SCADA (SQL Server, `Edge DB`, AVEVA Edge 2023)

SCADA SQL Server runs on the same machine as AVEVA Edge. Our queries must not lock
or stress it.

- **NEVER** open more than 2 concurrent connections. Pool `max: 2`.
- **ALWAYS** start a session with `SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED`.
- **ALWAYS** set an explicit query timeout: 30s for live queries, 300000ms (5 min) for analytics jobs. No unbounded queries.
- **READ ONLY.** Any `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, DDL — absolutely not.
- Heavy aggregations over long time ranges go to scheduled jobs, not request handlers.
- Prefer pre-aggregated SCADA tables (`Alimentadores`, `Auxiliar`, `PUE_Registros`) over scanning hundreds of `Registros_*` tables.
- When you need data from many `H2Sense_*` or `Registros_*` tables, issue **parallel queries from app code** — never `UNION ALL` dozens of tables.

### ICS (Postgres)

- Read-only from this app.
- VPN must be up. Wrap connection attempts with a clear error: "ICS unreachable — check VPN".
- Source of truth for: hashrate, miners, active_power, energy, revenue, BTC market data, modulations (maintenance events).
- Use Drizzle schema mirror for type safety (see `src/schema/ics-mirror.ts`).

### Local DB (our Postgres + TimescaleDB)

- Holds our own tables only: SLA definitions, cached aggregates, user preferences, saved ad-hoc queries, job run history, module configuration.
- Migrations via Drizzle. No hand-written SQL migrations.
- TimescaleDB hypertables for anything time-series.

### Secrets

- Never log credentials or connection strings.
- Never commit `.env.local`.
- Never print sensitive values in error messages that may surface in logs.

---

## Repo layout

```
willians-hub/
├── CLAUDE.md                     # this file
├── README.md                     # human quickstart
├── docker-compose.yml
├── .env.example
├── .gitignore
├── biome.json
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (dashboard)/          # main routes
│   │   ├── api/trpc/[trpc]/      # tRPC handler
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                   # shadcn primitives
│   │   └── modules/              # one folder per module (added as they ship)
│   ├── lib/
│   │   ├── db/
│   │   │   ├── ics.ts            # Postgres client + Drizzle
│   │   │   ├── scada.ts          # SQL Server pool + query helpers
│   │   │   ├── local.ts          # local TimescaleDB
│   │   │   └── healthcheck.ts
│   │   ├── queries/              # reusable queries grouped by source
│   │   │   ├── ics/
│   │   │   └── scada/
│   │   └── utils/
│   ├── server/
│   │   ├── routers/              # one tRPC router per module
│   │   ├── context.ts
│   │   └── trpc.ts
│   └── schema/                   # Drizzle schemas
│       ├── ics-mirror.ts         # type mirror of ICS (read-only)
│       └── local.ts              # our local tables
└── docs/
    ├── ARCHITECTURE.md
    ├── DATA_SOURCES.md
    ├── ROADMAP.md                # living backlog, not fixed phases
    └── schemas/
        ├── ics.sql               # full ICS DDL (source of truth)
        ├── scada.sql             # full SCADA DDL, 180 tables
        └── scada-summary.md      # dense pattern reference for SCADA
```

---

## Before writing code

1. Check `docs/ROADMAP.md` — what's the **Active** item? If none is set, ask Willian what to pick from **Candidates**.
2. Check `docs/DATA_SOURCES.md` and relevant `docs/schemas/*` files for how to query the source safely.
3. Scan existing code for similar patterns before creating new ones.
4. If a business rule is unclear (what counts as downtime, how is efficiency computed, what's the contracted hashrate), ask one focused question and stop. Do not guess.

---

## After writing code

- Run `pnpm typecheck` and `pnpm lint`, fix what you can.
- Update `docs/ROADMAP.md` **State** and **Changelog** sections when a module ships or its status changes.
- Leave the repo in a state where `pnpm dev` still works for the next session.

---

## Collaboration style

- Direct, structured, concise. Short paragraphs or bullets.
- No "I'd be happy to..." preambles. No filler.
- When there's a tradeoff, state it briefly, pick a default, explain why in one line.
- When stuck, say so. Don't fabricate.
- When a request is risky, wrong, or will break something later, push back clearly before doing it.
- No emoji.
