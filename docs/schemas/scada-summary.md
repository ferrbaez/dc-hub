# SCADA schema summary (`Edge DB`)

Fast-path reference for Claude Code. Use this for common queries.
For exact column names / types / constraints of any specific table, consult
`scada.sql` in this same folder (full DDL).

AVEVA Edge 2023, SQL Server. 180 tables total, 53 distinct structural shapes.
Most of the variance is because feeders, containers, and transformers at different
sites were instrumented with different tag sets over time — the *category* of each
table is more important than its exact column list.

---

## Category 1 — `Registros_*` (≈130 tables)

Time-series of electrical measurements per physical unit.

**Common shape** (not every table has every column — check `scada.sql` for the exact unit):
```sql
Time_Stamp     datetime2   NOT NULL   -- part of PK
Time_Stamp_ms  int         NOT NULL   -- part of PK
-- measurement columns, prefixed with the unit ID, e.g. for Registros_AL01:
AL01_Vab       float
AL01_Vbc       float
AL01_Vca       float
AL01_Ia        float
AL01_Ib        float
AL01_Ic        float
AL01_Kw        float        -- active power
AL01_Energy    float        -- cumulative energy
-- some tables also have Kvar, PF, frequency, neutral current, etc.
PRIMARY KEY (Time_Stamp, Time_Stamp_ms)
```

**Naming convention**: `Registros_{UnitID}` where `{UnitID}` identifies a feeder,
container, or transformer position. Examples:

| Prefix | Meaning | Count |
|---|---|---|
| `AL01`..`AL15`, `BC02`, `EM01` | Feeders (alimentadores) | 17 |
| `M1`..`M20` | Containers in zone M | 20 |
| `N1`..`N12` | Containers in zone N | 12 |
| `S1`..`S9` | Containers in zone S | 9 |
| `A11`, `A12`, `A21`, `A22`, `A31`, `A32` ... (B, C, D, E, F, G, T letters) | Container grid positions (letter = column, first digit = row, second digit = sub-position) | ~70 |
| `TR_1`..`TR_3` | Transformers | 3 |
| `Z1`..`Z3` | Zone aggregates | 3 |
| `Caudalimetros`, `Consumo_Agua`, `Tablero_Movil_Consumo`, `ND_Tablero_Aux`, `PUE_alimentadores`, `Pruebas_OC` | Special | 6 |

**Query pattern** — always filter by `Time_Stamp` range. Build the table name safely
(whitelist of known unit IDs, never raw user input). Prefer parallel queries from
app code over `UNION ALL` across many tables.

---

## Category 2 — `H2Sense_*` (42 tables)

Transformer health sensors. All share the same columns (modulo one or two variants
with an extra `Hydrogen_Avg` field — see `scada.sql`).

**Common shape**:
```sql
Time_Stamp            datetime2   NOT NULL   -- part of PK
Time_Stamp_ms         int         NOT NULL   -- part of PK
{ID}_Temperature_PCB  float
{ID}_Temperature_Oil  float
{ID}_Pressure_Oil     float
{ID}_Water_content_Oil float
{ID}_Water_activity_Oil float
{ID}_Hydrogen         float
PRIMARY KEY (Time_Stamp, Time_Stamp_ms)
```

**Naming**: `H2Sense_{TransformerID}`, where `{TransformerID}` matches transformer
positions across the site. Examples: `H2Sense_A1`..`A3`, `H2Sense_B1`..`B3`,
`H2Sense_C1`..`C2`, `H2Sense_D1`..`D3`, `H2Sense_F2`..`F3`, `H2Sense_G1`..`G2`,
`H2Sense_M1`..`M10`, `H2Sense_N1`..`N12`, `H2Sense_S1_S2`, `H2Sense_S5`, `H2Sense_S7`,
`H2Sense_S8`, `H2Sense_Z2`.

---

## Category 3 — Pre-aggregated / cross-entity tables

Use these first when possible — much cheaper than scanning dozens of `Registros_*`.

| Table | What it has |
|---|---|
| `Alimentadores` | Energy for 15 feeders (`AL01_Energy`..`AL15_Energy`) + `BC02_Energy` in one row per `Time_Stamp`. Fastest total-site consumption. |
| `Auxiliar` | Auxiliary services: total power, total energy, plus Norte site split |
| `PUE_Registros` | PUE over time |
| `Voltage_Trends` | Voltage trending at the site level |
| `Temp_Trafos_SM`, `Temp_Trafos_Texas`, `Temp_Trafos_Villarrica`, `Temp_Trafos_Zas` | Transformer temperatures grouped by site |
| `TempTrafoABCD`, `TempTrafoMara2`, `TempTranfoN` | Additional trafo temperature groupings |
| `Consumo_Saz_CW1` | Mobile consumption meter (VRS/VST/VTR, IR/IS/IT, Kw, Energia, IN) |
| `clients_hashrate`, `clients_total_power` | **Duplicated from ICS — do not use.** ICS is source of truth for hashrate and power. |

---

## Category 4 — Logs, events, audit

| Table | What it has | Index |
|---|---|---|
| `ALARMHISTORY` | Alarm events: tag, message, priority, ack/active flags, user, station | `(Al_Event_Time, Al_Event_Time_ms)` |
| `EVENTHISTORY` | System events: type, time, info, user, message, value, station | `(Ev_Time, Ev_Time_ms)` |
| `Auditoria_Tabla` | Custom audit log: table, action, user, date, details | `Id` PK |
| `AlertasRepeticion` | Stuck-value alert tracking | `Id` PK |

---

## Safe query recipes

**Total site consumption, hourly, last 7 days** (cheap — one table):
```sql
SELECT
  DATEADD(hour, DATEDIFF(hour, 0, Time_Stamp), 0) AS hour,
  SUM(AL01_Energy + AL02_Energy + AL03_Energy + AL04_Energy + AL05_Energy +
      AL06_Energy + AL07_Energy + AL08_Energy + AL09_Energy + AL10_Energy +
      AL11_Energy + AL12_Energy + AL13_Energy + AL14_Energy + AL15_Energy +
      BC02_Energy) AS total_energy
FROM Alimentadores
WHERE Time_Stamp >= DATEADD(day, -7, GETDATE())
GROUP BY DATEADD(hour, DATEDIFF(hour, 0, Time_Stamp), 0)
ORDER BY hour
OPTION (MAXDOP 2);
```

**Container power for one unit, last 24h** — don't forget the `Time_Stamp` filter:
```sql
SELECT Time_Stamp, M1_Kw, M1_Energy
FROM Registros_M1
WHERE Time_Stamp >= DATEADD(hour, -24, GETDATE())
ORDER BY Time_Stamp
OPTION (MAXDOP 2);
```

**Transformer oil temperature, multiple trafos in parallel** (do this in app code):
```typescript
// Fire N parallel queries (each hitting one H2Sense_* table), merge results in JS.
// Do NOT UNION ALL 40 tables in a single query — SCADA will hate you.
const trafos = ["A1", "A2", "A3", "B1", "B2"];
const results = await Promise.all(
  trafos.map(id => fetchH2Sense(id, start, end))
);
```

---

## Reminder — the hard rules (see `CLAUDE.md`)

- Pool `max: 2`. Never more.
- Every session: `SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED`.
- Every query: explicit timeout (30s live, 300000ms for analytics).
- Every `SELECT` against a `Registros_*` or `H2Sense_*` table: bounded `Time_Stamp` range.
- `OPTION (MAXDOP 2)` on any non-trivial aggregate.
- No writes. Ever.
