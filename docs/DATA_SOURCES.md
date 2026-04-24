# Data Sources — DC Hub

Operational reference for how to query ICS, SCADA, Local and Revenue safely. Claude Code should
consult this before writing any query.

For **exact schemas** (column names, types, constraints), see:
- `docs/schemas/ics.sql` — full ICS Postgres DDL
- `docs/schemas/scada.sql` — full SCADA SQL Server DDL (180 tables)
- `docs/schemas/scada-summary.md` — dense pattern-based SCADA reference

For **site topology, clients, projects, tariffs, transformer-to-container mapping**, see:
- `docs/SITE_BASELINE.md` — canonical source of truth about the business

This file describes **how to use** the data. The `schemas/` files describe **what
exists**. `SITE_BASELINE.md` describes **what it means**.

---

## ICS — Postgres (mining operations)

### Connection

- Reachable only when VPN is up
- Driver: `pg` via Drizzle (`src/lib/db/ics.ts`)
- Schema: `public`
- Access: read-only credentials (Willian has his own creds)

### Table map (what each holds — see `schemas/ics.sql` for columns)

**Entities (slow-changing)**
- `containers` — one row per mining container, FK to `customer`, `project`, `cooling`, `transformer`
- `customers`, `projects` — catalog
- `transformers` — with warranty info, MVA rating
- `coolings` — type, brand, model, water_required

**Live snapshots (one row per entity, upserted)**
- `containers_details` — current metrics per container
- `customer_details`, `project_details` — same metrics at that aggregation level

**History (partitioned by month on `created_at`)**
- `container_histories` — RANGE partitioned, monthly partitions. Always filter on `created_at` in the WHERE clause to enable partition pruning.
- `customer_histories`, `project_histories` — same fields, not partitioned

**Revenue and market data**
- `pools` — hashrate and revenue per pool, per project, over time
- `blockchain_histories` — BTC market data (price, difficulty, hashprice, block subsidy, fees) over time
- `blockchain_details` — latest snapshot of the same fields

**Maintenance**
- `modulations` — planned derate or shutdown events (see `schemas/ics.sql` for all the impact fields)
- `modulation_containers` — which containers were in each modulation

**Tickets**
- `ticket_statuses`, `ticket_details` — links to `container_histories` via composite FK

### Source-of-truth rules

| Metric | Use |
|---|---|
| Hashrate, miners counts, active_power, energy | **ICS only.** SCADA's `clients_hashrate` / `clients_total_power` duplicate ICS — do not use. |
| Revenue | **ICS `pools`** |
| BTC price, difficulty, hashprice | **ICS `blockchain_histories` / `blockchain_details`** — no need for external APIs |
| Planned maintenance events | **ICS `modulations` + `modulation_containers`** |

### Query patterns

Current container status:
```sql
SELECT
  c.id,
  c.name,
  cd.hashrate_total,
  cd.miners_online,
  cd.miners_hashing,
  cd.active_power
FROM containers c
LEFT JOIN containers_details cd ON cd.container_id = c.id
WHERE c.deleted_at IS NULL;
```

Project time-series, last 24h:
```sql
SELECT created_at, hashrate_total, active_power, energy
FROM project_histories
WHERE project_id = $1
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at;
```

Container history — always bound the window to hit a partition:
```sql
SELECT created_at, hashrate_total, active_power, miners_hashing
FROM container_histories
WHERE container_id = $1
  AND created_at >= $2
  AND created_at <  $3
ORDER BY created_at;
```

Modulation impact, last 30 days:
```sql
SELECT m.id, m.project_id, m.start_date, m.end_date,
       m.power_lost, m.energy_lost_k_wh, m.reason
FROM modulations m
WHERE m.deleted_at IS NULL
  AND m.end_date >= NOW() - INTERVAL '30 days'
ORDER BY m.start_date DESC;
```

---

## SCADA — SQL Server (AVEVA Edge 2023, `Edge DB`)

### Connection

- Same machine as AVEVA Edge — treat as a shared, critical resource
- Driver: `mssql` (tedious) via `src/lib/db/scada.ts`
- **Pool: `max: 2`** — no exceptions
- Query timeout: 30s (live), 300000 ms (5 min, analytics)
- **Every session** begins with `SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED`

### Schema overview

180 tables in 4 categories. For pattern-based query recipes (including exact SQL
for common cases like total site consumption), see **`docs/schemas/scada-summary.md`**.

Quick reference:

| Category | Count | Use for |
|---|---|---|
| `Registros_*` | ~130 | Granular electrical measurements per feeder / container / transformer |
| `H2Sense_*` | 42 | Transformer health sensors (temp, H2, oil, pressure) |
| Pre-aggregated | handful | `Alimentadores`, `Auxiliar`, `PUE_Registros`, `Voltage_Trends`, `Temp_Trafos_*`, `Consumo_Saz_CW1`, `clients_total_power` |
| Logs | 4 | `ALARMHISTORY`, `EVENTHISTORY`, `Auditoria_Tabla`, `AlertasRepeticion` |

**Always prefer pre-aggregated tables when they answer the question.** They're
cheap, already indexed, and designed for this kind of use. Example: total site
consumption comes from one `Alimentadores` query, not 15 separate `Registros_AL*` queries.

**Note about `clients_total_power`**: this IS a valid pre-aggregation — a running sum of active power across all client containers (the `$SumaCliente_kW` computed in the SCADA VBScript). An earlier revision of this doc incorrectly said to avoid it; that guidance is superseded. For hashrate, however, **still prefer ICS** over `clients_hashrate` — ICS is the source of truth there.

### Query template

Every SCADA helper should follow this shape:

```typescript
import { getScadaPool } from "@/lib/db/scada";
import sql from "mssql";

export async function fetchFeederEnergy(start: Date, end: Date) {
  const pool = await getScadaPool();   // singleton, max=2 connections
  const req = pool.request();
  req.timeout = 30_000;                // explicit timeout

  // required: do not lock AVEVA writes
  await req.query("SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED");

  const res = await req
    .input("start", sql.DateTime2, start)
    .input("end",   sql.DateTime2, end)
    .query(`
      SELECT Time_Stamp,
             AL01_Energy, AL02_Energy, AL03_Energy, AL04_Energy, AL05_Energy,
             AL06_Energy, AL07_Energy, AL08_Energy, AL09_Energy, AL10_Energy,
             AL11_Energy, AL12_Energy, AL13_Energy, AL14_Energy, AL15_Energy,
             BC02_Energy
      FROM Alimentadores
      WHERE Time_Stamp BETWEEN @start AND @end
      ORDER BY Time_Stamp
      OPTION (MAXDOP 2);
    `);

  return res.recordset;
}
```

### Do not

- `SELECT *` from any large table without a `Time_Stamp` filter
- Join across multiple `Registros_*` tables in one query — run them in parallel in app code and merge
- `UNION ALL` across 40+ `H2Sense_*` tables in a single query
- Any query without an explicit timeout
- Any write operation, ever

---

## Local DB — TimescaleDB (our own)

Managed by us, Drizzle migrations, hypertables for time-series caches.

### Purpose

- SLA definitions per customer (contracts, thresholds — fully custom per customer)
- Cached aggregates driving live widgets (so the dashboard stays responsive and survives VPN drops)
- User preferences, saved ad-hoc queries, module configuration
- Job run history (what ran when, outcome, duration)

### Guidelines

- Convert time-series tables to hypertables with `SELECT create_hypertable(...)`
- Index on `(entity_id, time)` for all time-series queries
- Retention policies for cached data (e.g. drop cache older than 90 days)
- Continuous aggregates for common rollups (hourly, daily)

### Core tables shipped

- `users`, `chat_conversations`, `chat_messages` — auth + analytics chat
- `client_tariffs`, `client_tariff_history`, `machine_configs` — manually maintained technical breakdown per client/project (see `docs/SITE_BASELINE.md` §15 and §16)
- `job_runs` — batch job history

---

## Revenue DBs — PostgreSQL (per-client reporting portals)

Three separate Postgres databases on the **same host** `172.16.10.107:5432`, each one belonging to a JV client. Read-only credentials in `.env.local` (`REVENUE_DB_*`).

| Database | Client | Projects |
|---|---|---|
| `mara_reporting` | MARATHON | JV2, JV3, OCEAN_MARA_GENERAL |
| `nd_reporting`   | NORTHERN DATA | JV5 |
| `zp_reporting`   | ZPJV (ZP Ltd.) | JV1-1, JV1-2, JV4 |

All three share the same table layout:

- `projects (id, name, created_at, updated_at)`
- `energy_consumption (id, date, project_id, power_consumption, pc, fpc, timestamps)` — **daily granularity**
- `energy_consumption_minute (id, timestamp, project_id, power_consumption, pc, fpc, timestamps)` — **per-minute granularity, timezone-aware**
- `pools_data (id, date, hashrate, revenue, pool, project_id, timestamps)` — daily revenue/hashrate per pool/project. `nd_reporting` also has `worker`.
- `users` — portal users (not ours)
- `zp_reporting.blocks` — blocks found (ZP only)

### Semantics of `pc` / `fpc`

- `pc` = **Punta de Carga** (peak-hour ANDE tariff window, higher rate)
- `fpc` = **Fuera de Punta de Carga** (off-peak window, lower rate)
- `power_consumption` ≈ `pc + fpc`

### Query guidance

- Read-only. Pool max=3 per database, connection timeout 5s, statement timeout 30s.
- For cross-client analytics, run **three parallel queries** in app code and merge — **NOT** foreign data wrappers or any cross-DB join.
- Refresh cadence observed: daily rows created ~07:00 UTC; minute rows streaming.
- Use `projects.name` for display — see `docs/SITE_BASELINE.md` §3 for the full alias map (`JV5` → NORTHERN DATA, etc).

### Clients NOT in revenue DBs (Luxor CSV)

AXXA and GUY mine through Luxor pool; their revenue arrives as manual CSV exports (not via Postgres). For v1 we load those manually into the local DB if/when needed.
