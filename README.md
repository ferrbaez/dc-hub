# Willian's Hub

Personal operations hub for BTC mining / data-center infrastructure.
Consumes ICS (Postgres) and SCADA (SQL Server — AVEVA Edge) and adds custom modules
for profitability, SLAs, and maintenance analytics.

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

## Project docs

- [`CLAUDE.md`](./CLAUDE.md) — working instructions for Claude Code and project overview
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — how the pieces fit together
- [`docs/DATA_SOURCES.md`](./docs/DATA_SOURCES.md) — ICS and SCADA schemas, connection rules, query patterns
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — living backlog of modules
- [`docs/schemas/`](./docs/schemas/) — full DDLs (`ics.sql`, `scada.sql`) and the dense `scada-summary.md` reference

## Safety notes

- The SCADA SQL Server shares its instance with AVEVA Edge. Connection pool is hard-capped at 2. Every session sets `READ UNCOMMITTED` isolation. Query timeouts are always explicit. No write operations are issued against SCADA from this app, ever.
- ICS and SCADA are read-only from this app. The only database this app writes to is the local TimescaleDB.
- If the VPN drops, ICS and SCADA become unreachable. `pnpm healthcheck` reports which side is down.
