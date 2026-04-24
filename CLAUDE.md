# CLAUDE.md — DC Hub

Instructions for Claude Code on this project. Read this first, every session.

---

## What this is

**DC Hub** — the operations platform for Penguin Digital's Data Center. Unifies data
from ICS (Postgres) and SCADA (SQL Server / AVEVA Edge), exposes typed APIs, and
serves as the substrate on which module owners (Heads & Leaders of DC Operations)
build their own tooling with Claude Code.

**This is not a greenfield system.** ICS and SCADA hold the canonical data. The
core's job is to query, cross-reference, cache selectively, and expose clean
endpoints — never to become the source of truth for operational data.

The project is **modular by design**: a small protected core maintained by the
Core Keeper (Willian), and independent modules owned by Department Leaders. See
[`docs/MODULAR_SOP.md`](./docs/MODULAR_SOP.md) for the full working agreement.

---

## Required reading at the start of every session

1. `CLAUDE.md` (this file)
2. `docs/MODULAR_SOP.md` — **modular development SOP**: roles, repo structure,
   git workflow, data access rules, cadence. If you're working on a module, this
   is the contract.
3. `docs/ROADMAP.md` — **State** and **Active** sections
4. `docs/ARCHITECTURE.md` — skim if you don't remember it
5. `docs/DATA_SOURCES.md` — before any query

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

---

## Karpathy Skills — four behavioural principles

> Sourced from https://raw.githubusercontent.com/forrestchang/andrej-karpathy-skills/main/CLAUDE.md
> These sit *on top of* the project rules above. Project rules win on conflicts
> (e.g. YAGNI + SCADA pool=2 are harder constraints than "surgical changes").
> Bias: caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These principles are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
