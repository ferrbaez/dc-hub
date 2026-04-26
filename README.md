# DC Hub

Operations platform for Penguin Digital's Data Center. Unifies ICS (Postgres)
and SCADA (SQL Server — AVEVA Edge) behind typed APIs, and hosts modules built
by Department Leaders using Claude Code.

- **Core Keeper:** Willian Baez (Infrastructure Manager)
- **Sponsor:** Ricardo Galeano (VP of DC Operations)
- **Modular SOP:** see [`docs/MODULAR_SOP.md`](./docs/MODULAR_SOP.md)

## Requirements

- macOS (primary dev target), Node 20+, pnpm 9+
- Docker Desktop
- VPN connection to the ICS network (manual)
- Network reachability to the SCADA host (same VPN or direct)

## Quick start

```bash
# 0. enable corepack once (provides pnpm automatically from package.json)
corepack enable

# 1. install
pnpm install

# 2. env
cp .env.example .env.local
# fill in ICS and SCADA credentials

# 3. local services (docker compose auto-loads .env.local)
docker compose up -d

# 4. schema for local DB
pnpm db:push

# 5. verify all three connections (connect VPN first)
pnpm healthcheck

# 6. dev server
pnpm dev
```

Open http://localhost:3000.

## Development workflow (module owners)

Each owner builds modules under `src/modules/<area>/<nombre>/` against the
protected `core.*` tRPC namespace. The full contract is in
[`docs/MODULAR_SOP.md`](./docs/MODULAR_SOP.md). Quick reference:

```bash
# 0. create your dev user (interactive — asks email, name, password, areas)
pnpm user:create

# 1. start a feature branch off main
git checkout main && git pull
git checkout -b feat/<modulo>-<descripcion-corta>

# 2. scaffold a new module (e.g. mining/reporting)
pnpm new:module mining/reporting

# 3. implement against core.* and your own router; restart pnpm dev to pick up the route
pnpm dev

# 4. before push: typecheck + lint (also runs in pre-commit and CI)
pnpm typecheck && pnpm lint

# 5. open PR; CODEOWNERS routes core/SOP changes to Willian automatically
git push -u origin HEAD
gh pr create --base main --assignee ferrbaez
```

Hard rules (enforced by `lefthook` pre-commit and `.github/workflows/ci.yml`):

- **Modules are siloed.** A file under `src/modules/<area>/<modulo>/` may not
  import from another module's folder. Share via `@/lib`, `@/components`, or
  `@/server` (the core).
- **No direct DB drivers outside `src/lib/db/`.** Modules consume `core.*`
  endpoints — never `pg`, `mssql`, or Drizzle drivers directly.
- **Need data the core doesn't expose?** Open a core-request: see
  [`docs/core-requests/README.md`](./docs/core-requests/README.md). Don't
  hardcode the query as a workaround.

Areas (slugs used in `users.areas` and `areaProcedure`):
`core`, `maintenance`, `substation`, `mining`, `networking`,
`microelectronics`, `automation`, `facilities`, `safety`. See
[`src/lib/areas.ts`](./src/lib/areas.ts).

## Project docs

- [`CLAUDE.md`](./CLAUDE.md) — working instructions for Claude Code and project overview
- [`docs/PARA_OWNERS.md`](./docs/PARA_OWNERS.md) — guía rápida no-técnica para owners (leer primero)
- [`docs/MODULAR_SOP.md`](./docs/MODULAR_SOP.md) — modular development SOP (roles, git flow, data rules, cadence)
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — how the pieces fit together
- [`docs/DATA_SOURCES.md`](./docs/DATA_SOURCES.md) — ICS and SCADA schemas, connection rules, query patterns
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — living backlog of modules
- [`docs/core-requests/`](./docs/core-requests/) — backlog of endpoints pedidos por owners
- [`docs/schemas/`](./docs/schemas/) — full DDLs (`ics.sql`, `scada.sql`) and the dense `scada-summary.md` reference

## Safety notes

- The SCADA SQL Server shares its instance with AVEVA Edge. Connection pool is hard-capped at 2. Every session sets `READ UNCOMMITTED` isolation. Query timeouts are always explicit. No write operations are issued against SCADA from this app, ever.
- ICS and SCADA are read-only from this app. The only database this app writes to is the local TimescaleDB.
- If the VPN drops, ICS and SCADA become unreachable. `pnpm healthcheck` reports which side is down.
