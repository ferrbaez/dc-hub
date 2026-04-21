# Roadmap — Willian's Hub

A living backlog for Willian's Hub. **This is not a fixed timeline.** It's a backlog of modules and ideas. Willian
picks what to build next based on current priorities. Claude Code does not assume
the order.

The only thing that is sequenced is the scaffold (the "module 0" below). Nothing
else has a predetermined position.

---

## How to use this document

1. **State** — what's built and in use right now.
2. **Active** — what we're working on this session / week.
3. **Candidates** — module ideas with enough detail to be picked up cold.
4. **Principles** — how to decide what's next, and how every module is expected to behave.

Claude Code: when starting a new session, read **State** and **Active** first. Do
not scaffold a candidate unless Willian explicitly picks it.

---

## State (keep updated)

> Claude Code: update this section at the end of each working session.

- [x] Module 0 — scaffold (shipped 2026-04-20)
- [x] Auth (shipped 2026-04-20) — NextAuth v5 credentials + bcrypt, JWT sessions (30d), middleware gating all routes except `/login`, `pnpm user:create` CLI, UserMenu in header, SessionProvider in root
- [x] Analytics chat module (shipped 2026-04-20) — natural-language to SQL against ICS/SCADA/local with Claude Sonnet 4.6, schema prompt cached, SELECT-only validator with SCADA Time_Stamp enforcement, result table + highlighted analysis + Excel export via `exceljs`, per-user conversation history

Scaffold summary:
- Next.js 15 (App Router) + React 18.3 + TypeScript strict (`noUncheckedIndexedAccess`)
- Tailwind + shadcn/ui primitives (`card`, `table`) + Tremor for dashboard widgets
- Biome 1.9.4 — `pnpm lint` / `pnpm typecheck` clean, `pnpm build` passes
- Drizzle ORM + `drizzle-kit`; local schema at `src/schema/local.ts` (seed: `job_runs`); ICS type mirror at `src/schema/ics-mirror.ts` (containers, containers_details, projects, customers)
- DB clients at `src/lib/db/{ics,scada,local}.ts`. SCADA helper enforces pool `max=2`, `READ UNCOMMITTED` on every session, explicit 30s default timeout, and throws a typed `ScadaUnreachableError` on network codes. ICS and local DB have matching `IcsUnreachableError` / `LocalDbUnreachableError`.
- tRPC v11 wired with superjson; error middleware maps typed unreachable errors to `SERVICE_UNAVAILABLE` and config errors to `PRECONDITION_FAILED`. Routers: `containers.list`, `health.all`.
- Demo page at `/` — client component, consumes `trpc.containers.list`, renders Tremor `Metric`s + shadcn `Table`, shows "ICS unreachable — connect VPN" state on `SERVICE_UNAVAILABLE` / `PRECONDITION_FAILED`.
- Docker Compose auto-loads `.env.local` via `env_file:` on both services (TimescaleDB + n8n). Postgres uses native `POSTGRES_*` names; no duplication between app and container env.
- `pnpm healthcheck` — runs all three pings in parallel, colored terminal output, exits non-zero on any failure.
- Corepack-managed pnpm 9.15.0 via `packageManager` field; Node pinned with `.nvmrc` (20).

---

## Active

> What Willian is currently working on. Update when direction changes.

*(empty)*

---

## Module 0 — Scaffold (required first)

The only pre-sequenced work. Everything else depends on it.

**Must include:**
- Next.js 15 + TypeScript strict, Tailwind + shadcn/ui + Tremor installed
- Biome configured, `pnpm lint` and `pnpm typecheck` pass
- Docker Compose services running (TimescaleDB, n8n)
- Drizzle configured for the local DB, `pnpm db:push` works
- Three DB connection helpers working: ICS (`pg`), SCADA (`mssql`, pool max=2, READ UNCOMMITTED), local (`pg` / Drizzle)
- `pnpm healthcheck` verifies all three and prints clear messages when VPN is down
- A single demo page proving the stack is alive: list containers from ICS with current hashrate

**Done when:** the demo page renders real ICS data, all three connections are
healthchecked, and linting/typing are clean.

---

## Candidate modules (pick in any order)

Each candidate is sized so it can be picked up cold. They are not ranked.

### Rentabilidad

**What:** profitability overview per site and per project.
**Data:** ICS only — `containers_details`, `project_details`, `pools`, `blockchain_details`, `container_histories`, `project_histories`.
**Why it's quick:** ICS already holds everything needed. No SCADA required for a v1.
**Notes:** $/kWh per project is user-configurable, stored in local DB.

### Consumo real + drift (SCADA)

**What:** real electrical consumption, cross-checked against ICS-reported active power.
**Data:** SCADA `Alimentadores`, `Auxiliar`, `PUE_Registros` + ICS active_power per project.
**Why it matters:** first real cross-source value. Catches feeders drawing more than expected.
**Notes:** prefer pre-aggregated tables over scanning `Registros_*`.

### SLAs por cliente

**What:** SLA compliance dashboard, fully custom per customer.
**Data:** local DB (SLA definitions) + `customer_histories` (ICS) + optionally `Alimentadores` (SCADA).
**Why non-trivial:** SLAs are per-contract, so the schema must accept custom metrics and thresholds per customer.
**Notes:** rolling 30d window, alert at configurable % of breach threshold.

### Impacto de mantenimientos

**What:** quantify downtime — hours, kWh, revenue lost.
**Data:** ICS `modulations` + `modulation_containers`, correlated with `pools` (revenue) and optionally `Alimentadores` (real consumption during the window).
**Why it's clean:** `modulations` already has `power_before`, `power_during`, `power_lost`, `energy_lost_k_wh` — just needs good visualization and cross-joins.

### Analytics ad-hoc (SQL surface)

**What:** a SQL editor with schema explorer over ICS, SCADA, and local DB.
**Data:** all three, read-only.
**Requires:** Monaco editor, saved queries (local DB), guardrails on SCADA (auto-prepend READ UNCOMMITTED, enforce timeout, warn on no `WHERE Time_Stamp`).
**Why last-ish:** it's powerful but open-ended; better after you've built a few focused modules and know the query patterns.

### Salud de transformadores

**What:** transformer health dashboard — H2, oil temp, water content, pressure trending.
**Data:** SCADA `H2Sense_*` tables + ICS `transformers` (warranty, MVA).
**Notes:** needs parallel queries (42 tables), not `UNION ALL`. Good candidate for nightly aggregation.

### Incidentes

**What:** reconstruct incidents by correlating `ALARMHISTORY` (SCADA) with `container_histories` (ICS) and `modulations`.
**Data:** SCADA alarms + ICS history around the alarm window.
**Notes:** good "on-call" tool — pick an alarm, show what was happening.

### Alertas (motor n8n)

**What:** threshold breaches trigger workflows in n8n (already running in docker compose).
**Data:** polls local DB for computed metrics; n8n sends to Slack / email / webhook.
**Notes:** requires at least one module producing metrics worth alerting on.

### Vistas móviles

**What:** simplified read-only views optimized for phone access via Tailscale.
**Data:** whichever modules are worth checking at 3 AM.
**Notes:** not a full responsive pass — targeted phone-first routes.

### Reports / exports

**What:** scheduled PDF or Excel exports for rentabilidad, SLAs, mantenimientos.
**Data:** whatever the source modules already compute.
**Notes:** build after the source modules are stable.

### (Add your own)

*Willian: when an idea comes up, drop it here as a one-paragraph candidate. Claude
Code can flesh it out when you pick it.*

---

## Principles (apply to every module)

### Contract with the user
Each module must justify itself in real daily use. If after a week you're not using it, archive it — don't maintain dead code.

### Data source discipline
- Use the source of truth per `docs/DATA_SOURCES.md`. Don't duplicate what already exists.
- New module → think first about which source has the data, then how to query safely, then the UI.

### Pacing
- One module at a time. Ship end-to-end (data → API → UI) before starting the next.
- Prefer a v1 that works over a v2 that's complete.

### Complexity ceiling
- If a module needs more than ~500 lines of module-specific code in its first version, we're over-engineering. Split it.

### Don't break the rules
- Never escalate SCADA pool size.
- Never write to ICS or SCADA.
- Never hardcode secrets.
- Never add a dependency without checking what's already installed.

---

## Changelog

> Record when modules ship, graduate, or are archived.

- 2026-04-20 — Module 0 (scaffold) shipped. Next.js 15 + tRPC v11 + Drizzle + Biome + docker compose (TimescaleDB + n8n) + healthcheck script + demo page listing ICS containers.
- 2026-04-20 — Shell polish: collapsible sidebar with Penguin palette (obsidian + lime + violet), header with auto-refresh selector (off/1m/5m/30m, localStorage-persisted), VPN/ICS/SCADA health chip, search + "solo hashing" filter on containers table, W/TH efficiency column with color encoding (≤25 green, ≤35 amber, >35 red).
- 2026-04-20 — Auth module shipped. NextAuth v5 (Auth.js beta.31) with credentials provider, JWT sessions, bcryptjs (12 rounds), Edge-safe middleware split (auth.config.ts vs auth.ts), login page at `(auth)/login`, CLI `pnpm user:create`, tRPC `protectedProcedure`.
- 2026-04-20 — Analytics chat module shipped. `/analytics` route with conversation list + chat UI + highlighted analysis block + result table + SQL collapsible + Excel download. Backend: Anthropic SDK (Sonnet 4.6 with adaptive thinking + effort high), schema prompt caching (~90% token reduction on repeat queries), SELECT-only SQL validator, SCADA Time_Stamp filter enforcement, per-user conversation history with jsonb-stored results. Known follow-up: streaming the analysis token-by-token (v1 is one-shot).
