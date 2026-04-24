# Site Baseline — Topología, clientes y reglas del negocio

> **Esta es la "base de conocimiento" del sitio que Willian's Hub da por asumida.** Todo agente (Claude en Analytics, futuros módulos, nuevos desarrolladores) tiene que leer este documento antes de escribir una query o una regla. La topología y los nombres acá son los canónicos — si algo difiere en una tabla, gana este doc.
>
> Versión 1.0 — 2026-04-21. Validado con: notas de Willian + VBScript del SCADA AVEVA Edge + Single Line Diagram Penguin + Foreman export + `00_CORE_Client_JV_Master_List.xlsx`.

---

## 1. Jerarquía eléctrica del sitio

```
                    LT 220 kV ANDE (red pública)
                              │
                              ▼
                   ┌──────────────────────────┐
                   │  Subestación 220 kV      │
                   │  TR-1, TR-2, TR-3        │  41.67 MVA cada uno — Toshiba
                   │  Banco capacitores 6MVAR │
                   │  220 kV → 23 kV          │
                   └──────────────┬───────────┘
                                  │
                                  ▼
                         23 kV (Media Tensión)
    ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬──────┬──────┐
    │AL01│AL02│AL03│AL04│AL05│AL06│AL07│AL08│AL09│AL10│AL11│AL12│AL13│AL14│AL15│ BC02 │ SA1  │
    └─┬──┴─┬──┴─┬──┴─┬──┴─┬──┴─┬──┴─┬──┴─┬──┴─┬──┴─┬──┴─┬──┴─┬──┴─┬──┴─┬──┴─┬──┴──┬───┴──┬───┘
      │    │    │    │    │    │    │    │    │    │    │    │    │    │    │     │      │
      ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼     ▼      │
   (trafos de piso por línea — 23 kV / 0.4 kV o 0.48 kV, 1000-2700 kVA)               │
      │                                                                                │
      ▼                                                                                ▼
   380 V – 480 V (Baja Tensión)                                              Servicios Aux:
   PDUs por container (medidos lado A y lado B,                              - Trafo SA1 300 kVA
   multimedidores heterogéneos: Acrel, Schneider, etc)                       - Grupo electrógeno
                                                                                200 kVA emergencia

Contrato con ANDE: 100 MW (objetivo)  |  105 MW (límite duro + 5 MW de umbral)
                   MsgBox dispara cuando PQM_Primario > 105,000 kW
```

### Aclaraciones

- **Villarica** = sobrenombre popular de la **zona E** (Marathon Mara1). No tiene que ver con la línea G.
- **G = AXXA** (no era Villa Rica como dice el SLD).
- **Mara2 NO son líneas aéreas** — eso es Mara1 Eco.
- **La medición en BT no es homogénea.** Cada tablero de fuerza usa multimedidores distintos (Acrel, Schneider, …) — explica por qué las columnas SCADA tienen convenciones dispares (`_Potencia_Activa_Kw_lado_A/B`, `_Active_Power_Total_lado_A/B`, `$M##_A_Potencia_Activa_Kw`, `_lado_A1/A2/B1/B2`).

---

## 2. Jerarquía lógica

```
Clientes
   │
   ├── Proyectos  (varios por cliente: JV#, HC#, MARA1/MARA2, etc)
   │      │
   │      └── Contenedores  (identificados por letra + número: A11, M5, N12, …)
```

- **Un trafo físico puede alimentar contenedores de clientes distintos** (ej: TR-B1 → B11 de ZPJV + B12 de SAZ Hydro). Esos casos son excepciones puntuales en líneas B y D; el patrón general es un trafo por cliente.
- **En ICS `containers`** liga ambos:
  - `containers.customer_id` → `customers.id`
  - `containers.project_id` → `projects.id`
  - `customers` y `projects` no tienen FK directo entre sí → la unión se hace vía `containers`.

### 2.1 Naming convention

- **JV = Joint Venture** — contratos donde Penguin comparte upside (mining pool va a multisig compartido)
- **HC = Hosting Contract** — contratos puros de hosting (el cliente cobra todo, Penguin cobra hosting fee)
- `JV1-1`, `JV1-2`, `JV2`, … `JV5` — numeración interna de proyectos
- `HC2`, `HC3`, `HC4`, `HC5-1`, `HC5-2` — numeración interna de hostings

---

## 3. Catálogo de clientes + proyectos

| Cliente (ICS `customers.name`) | Tipo | Proyectos | Allocation MW | Wallet / Pool |
|---|---|---|---|---|
| **ZP Ltd.** (ZPJV) | JV | JV1-1 (Hydro), JV1-2 (AirCooled — inactivo), JV4 (S21 Hydro) | 16 + 1.8 + 9.5 | Multisig ZP / Ocean |
| **NORTHERN DATA** | JV | JV5 (Hydro M63/M63S) | 28 | Multisig Penguin 3 of 5 / Ocean |
| **MARATHON (MARA)** | JV | JV2, JV3, OCEAN_MARA_GENERAL; también identificado como MARA1 (Immersion E+T) y MARA2 (Air M) | Variable | Multisig Penguin / Ocean |
| **Grupo F15 (AXXA)** | Hosting | HC4 (Hydro S19 XP 224T) | 10.5 | Multisig Penguin 3 of 5 / Luxor |
| **SAZMINING INC.** | Hosting | HC5-1 (Air S19k Pro + S21), HC5-2 (Hydro S19 XP) — 2 proyectos: **Hydro** y **Air** | 3 + 3 | Client wallet / Luxor & Ocean |
| **GUY SCHWARZENBACH** | Hosting | HC2 | 1 | Client / — |
| **AFTech AG (THOMAS AFTECH)** | Hosting | HC3 | 1 | Client / — |

### 3.1 Alias / abreviaturas comunes

- `ND` → NORTHERN DATA
- `ZP` → ZPJV / ZP Ltd.
- `MARA` / `Marathon` → MARATHON
- `AXXA` → Grupo F15 S.A (AXXA)
- `SAZ` / `Sazmining` / `Saz` → SAZMINING INC.
- `Guy` → GUY SCHWARZENBACH
- `AFTech` / `Thomas` → AFTech AG / THOMAS AFTECH

### 3.2 Wallets y pools

- **Multisig ZP** — Bitcoin multisig, pool: **Ocean**
- **Multisig Penguin 3 of 5** — para ND y AXXA, pools: Ocean (ND), Luxor (AXXA)
- **Client wallet** — para hostings puros (Sazmining, Guy, Thomas)

---

## 4. Mapping cliente → contenedores (del VBScript SCADA)

Estas son las sumatorias reales de potencia activa en BT calculadas por el SCADA en tiempo real.

### 4.1 ZPJV (`$ZP`)

`A11, A12, A21, A22, A31, A32, B11, B21, B31, C11, C12, C21, C22, C31, C32, D11, T41, S1..S9`

Más los containers de la zona T que **hoy están inactivos** pero pertenecen a ZP: `T12, T22, T32, T42, T31 lado_A`.

Convención de medición: `$X##_Potencia_Activa_Kw_lado_A/B`

### 4.2 Marathon — Mara1 (Immersion E + T)

`T11, T21, T31 (solo lado_B), E11, E12, E21, E22, E31, E32`

Convención: `$X##_Active_Power_Total_lado_A/B`

**Nota sobre T31:** `lado_A` = ZPJV (hoy inactivo), `lado_B` = Mara1.

### 4.3 Marathon — Mara2 (Air M)

`M1 .. M20` (los 20, con lado A y lado B cada uno)

Convención distinta: `$M##_A_Potencia_Activa_Kw` + `$M##_B_Potencia_Activa_Kw` (la A/B va en el medio).

### 4.4 GUY SCHWARZENBACH

`D12` (solo)

### 4.5 THOMAS AFTECH / AFTech

`D21` (solo)

### 4.6 AXXA

`D31, D32, F21, F22, F31, F32, G11, G12, G21, G22`

Convención: `_Potencia_Activa_Kw_lado_A/B`

### 4.7 NORTHERN DATA (`$ND`)

`N1 .. N12`

Convención: `_Active_Power_Total_lado_A/B`

### 4.8 SAZ Hydro

`B12, B22, B32` (los "pares" de la línea B — que comparte trafo con ZP en `B11/B21/B31`)

Convención: `_Potencia_Activa_Kw_lado_A/B`

### 4.9 SAZ Fan

`Z1, Z2, Z3` (cada uno con **4 lados**: A1, A2, B1, B2) + `D22`

Convención: `_Active_Power_Total_lado_A1/A2/B1/B2`

### 4.10 Sazmining total

`Saz_Hydro + Saz_Fan`

---

## 5. Mapping alimentador MT → Contenedores BT

Cada alimentador AL## en media tensión alimenta un grupo específico de contenedores.

| Alimentador | Contenedores | Cliente predominante |
|---|---|---|
| **AL01** | F21, F22, F31, F32, G11, G12, G21, G22 | AXXA |
| **AL02** | N4, N5, N6 | NORTHERN DATA |
| **AL03** | N1, N2, N3 | NORTHERN DATA |
| **AL04** | N7, N8, N9 | NORTHERN DATA |
| **AL05** | N10, N11, N12 | NORTHERN DATA |
| **AL06** | A11, A12, A21, A22, A31, A32 | ZPJV (línea A) |
| **AL07** | B11, B12, B21, B22, B31, B32 | **mixto** ZPJV + SAZ Hydro |
| **AL08** | C11, C12, C21, C22, C31, C32 | ZPJV (línea C) |
| **AL09** | D11, D12, D21, D22, D31, D32 | **mixto** ZPJV + Guy + Thomas + AXXA + SAZ Fan |
| **AL10** | E11..E32 + T11, T12, T21, T22, T31, T32, T41, T42 | Marathon Mara1 |
| **AL11** | S6, S7, S8, S9 | ZPJV |
| **AL12** | S1, S2, S3, S4, S5 | ZPJV |
| **AL13** | M1, M2, M3, M11, M12, M13 | Marathon Mara2 |
| **AL14** | M4, M5, M6, M7, M14, M15, M16, M17 | Marathon Mara2 |
| **AL15** | M8, M9, M10, M18, M19, M20 | Marathon Mara2 |
| **BC02** | Z1, Z2, Z3 | SAZ Fan |

⚠️ **`AL07` y `AL09` son alimentadores "mezclados"** — no pertenecen a un solo cliente. Cualquier query de consumo por cliente basada sólo en AL## va a dar mal ahí. Para esos hay que bajar a container level.

---

## 6. Trafos de piso (BT)

| Línea | Trafos | Capacidad unitaria | Cliente(s) |
|---|---|---|---|
| **ALPHA (A)** | TR-A1, A2, A3 | 2500 kVA, 23/0.4 kV | ZPJV |
| **BRAVO (B)** | TR-B1, B2, B3 | 2500 kVA | **mixto** ZPJV + SAZ Hydro |
| **CHARLIE (C)** | TR-C1, C2, C3 | 2500 kVA | ZPJV |
| **DELTA (D)** | TR-D1, D2, D3 | 2500 kVA | **mixto** ZPJV + Guy + Thomas + AXXA |
| **E / Villarica** | TR-E11, E12, E21, E22, E31, E32 | 1250 kVA | Marathon Mara1 |
| **F** | TR-F1, F2, F3 | 2500 kVA | AXXA |
| **G** | TR-G1, G2 | 2500 kVA | AXXA |
| **M (Mara2 Air)** | TR-M2, TR-M3 (TrafoSur) | n/d | Marathon Mara2 |
| **N (Northern)** | TR-N1..N12 (agrupados en CDM-14/15/16/17) | 2700 kVA 23/0.48 kV | NORTHERN DATA |
| **S** | TR-S1/2, S3, S4, S5, S6, S7, S8, S9 | 1500 kVA y 1250 kVA | ZPJV |
| **TEXAS (T)** | TR-T1, T2, T3, T4 | 1000 kVA | Marathon Mara1 (hoy activo) + ZPJV (hoy inactivo) |
| **SA1** | TR-SA1 | 300 kVA | Servicios auxiliares |

**Trafos compartidos entre clientes son casos específicos** (líneas B y D principalmente), no patrón general.

---

## 7. Fórmulas de PUE (Power Usage Effectiveness)

Del VBScript:

```
PQM_primario_positivo = $PQM_Potencia_KW_Primario * -1

PUE_AltaBaja   = primario_positivo  − ΣCliente_kW       ← pérdida TOTAL del sitio (AT → BT)
PUE_AltaMedia  = primario_positivo  − ΣMediaTension     ← pérdida AT → MT (trafos principales)
PUE_MediaBaja  = ΣMediaTension      − ΣCliente_kW       ← pérdida MT → BT (alimentadores + trafos de piso)
```

Donde:
- `ΣCliente_kW` = Σ potencia activa de todos los contenedores en BT + Servicios Auxiliares + Sazmining
- `ΣMediaTension` = Σ `AL01_Total_Power + … + AL15_Total_Power + BC02_Total_Power + Servicios_Aux`

### 7.1 PUE por alimentador

```
PUE_AL##_Baja = AL##_Total_Power − Σ(potencia activa de los contenedores que alimenta)
```

Ver §5 para qué contenedores alimenta cada AL.

---

## 8. Umbrales operativos (del VBScript)

```
Trafo_Temp_Lim1        = EM01_Temperatura + 50°C   (alerta)
Trafo_Temp_Lim2        = EM01_Temperatura + 55°C   (crítico)

Limite_temp_ND         = 45°C   (agua cooling NORTHERN DATA)
Limite_temp_Hydro      = 40°C   (agua cooling SAZ Hydro)

Limite_Pressure_Sup_ND = 3.3 bar
Limite_Pressure_Inf_ND = 2.2 bar
```

Regla: cualquier query de "¿algún trafo en alerta?" debe comparar contra `EM01_Temperatura + 50` — no contra un umbral absoluto.

### 8.1 Sentinel values — hay que excluirlos de agregaciones y alertas

Algunas columnas SCADA usan **"números mágicos" cuando el sensor está desconectado o el equipo offline**. No son lecturas reales:

- **Temperatura de trafo = `850`** → sensor offset / **trafo desconectado**. Aplica a columnas como `*_Temperatura_Transformador` en `Temp_Trafos_*` y `TempTrafoABCD`. Excluir con `WHERE temp < 800` antes de cualquier `MAX`/`AVG`/condición de alerta.
- Regla general: si un valor está **órdenes de magnitud por encima del rango físico** de la métrica (ej: temperatura > 200°C), tratarlo como sentinel y filtrar.
- Si una query reporta todos los trafos en estado "CRÍTICO" con exactamente el mismo valor (`850`), es señal inequívoca de que faltó filtrar el sentinel.

---

## 9. Sensado de temperatura en NORTHERN DATA

Los contenedores N tienen **dos sistemas de medición térmica**:

### 9.1 Agua (cooling circuit)

Columnas directas en `Registros_N#`:
- `N#_Temperature_In` — agua entrada
- `N#_Temperature_Out` — agua salida
- `N#_Flow` — caudal
- `N#_Pressure` — presión
- `N#_Pump_Frecuency`, `N#_Pump_Velocity`

### 9.2 Aire (pasillos frío/caliente)

Sensores de temperatura + humedad en 3 racks (R1, R6, R11) por container. Cada rack tiene:
- `T1` = pasillo frío (aire entrando)
- `T2` = pasillo caliente (aire saliendo)
- `H1`, `H2` = humedad respectivamente

Promedios pre-calculados en SCADA:
```
N#_T1_Prom (aire frío promedio) = (R1_T1 + R6_T1 + R11_T1) / 3
N#_T2_Prom (aire caliente prom) = (R1_T2 + R6_T2 + R11_T2) / 3
```

**Regla: `T1_Prom` / `T2_Prom` son AIRE, no agua.** Para agua usar `Temperature_In` / `Temperature_Out`.

### 9.3 Caudales SAZ Hydro

```
TV_Caudal_D31 = D31A + D31B
TV_Caudal_D32 = D32A + D32B
```

---

## 10. Energía acumulada — concatenación int64 (solo ND)

Los medidores de energía de los containers N guardan el valor como **dos int32** que hay que concatenar:

```
energia_total_kwh = (N#_Active_Energy_Delivered_Into_Load_lado_A * 2^32) +
                     N#_Active_Energy_Received_Out_of_Load_lado_A
```

**Aplica SOLO a ND (N1..N12).** El resto de los containers guardan energía como float directo.

Si una query contra `Registros_N*` suma directo los campos `Active_Energy_*` sin hacer esta combinación, los resultados van a estar errados por orders of magnitude.

---

## 11. Estación meteorológica — `Registros_EM01`

```
Time_Stamp, Time_Stamp_ms  (PK)
EM01_Temperatura           — temperatura ambiente (°C)
EM01_Humedad               — humedad relativa
EM01_Presion               — presión atmosférica
EM01_Velocidad_Viento      — velocidad viento
EM01_Direccion_Viento      — dirección viento
EM01_Lluvia                — lluvia acumulada / rate
```

Usos habituales:
- **Baseline para umbrales de trafos** (`EM01_Temperatura + 50` → alerta, +55 → crítico)
- **Correlación carga térmica de flota vs clima** (cuando hace calor, suben todas las temperaturas de agua y aire)
- **Correlaciones meteorológicas** (presión atmosférica, viento, lluvia) con eventos operacionales

---

## 12. Fuentes de datos del hub

Willian's Hub consume **cuatro fuentes de datos**:

### 12.1 ICS (PostgreSQL, `172.16.10.5:5432`)

- Source of truth de mining ops: containers, containers_details, container_histories, customers, customer_histories, customer_details, projects, project_histories, project_details, modulations, pools (revenue por pool), blockchain_histories, blockchain_details, transformers, coolings
- VPN requerida
- Read-only (user `dcd_read`)
- Es **"ICS 2.0"** — hay una instancia legacy en `172.16.10.107` que no usamos

### 12.2 SCADA (SQL Server, `172.16.10.3:1433`, `Edge DB`)

- 180 tablas: `Registros_*` (mediciones por container y alimentador), `H2Sense_*` (salud trafos), `Alimentadores` (pre-agg MT), `Auxiliar`, `PUE_Registros`, `Voltage_Trends`, `ALARMHISTORY`, `EVENTHISTORY`, `Temp_Trafos_*`, `Registros_EM01`, etc
- VPN requerida
- Read-only (user `Infra_Manager`)
- Pool **max=2** conexiones, `READ UNCOMMITTED`, timeouts explícitos

### 12.3 Local (nuestra PostgreSQL/TimescaleDB, `localhost:5433`)

- Schema propio: `users`, `chat_conversations`, `chat_messages`, `job_runs`, `client_tariffs`, `client_tariff_history`, `machine_configs`
- Drizzle migrations
- Hypertables para cachés de series temporales

### 12.4 Revenue (PostgreSQL, `172.16.10.107:5432`, **cuatro fuente nueva**)

- **Tres DBs separadas**, una por cliente JV:
  - `mara_reporting` — proyectos: JV2, JV3, OCEAN_MARA_GENERAL
  - `nd_reporting` — proyectos: JV5
  - `zp_reporting` — proyectos: JV1-1, JV1-2, JV4
- Credenciales: user `asu_read` (read-only, misma password en las 3)
- Tablas por DB:
  - `projects (id, name, timestamps)`
  - `energy_consumption (date, project_id, power_consumption, pc, fpc)` — **diario**
  - `energy_consumption_minute (timestamp, project_id, power_consumption, pc, fpc)` — **por minuto**
  - `pools_data (date, hashrate, revenue, pool, project_id, worker?)` — daily revenue por pool
  - `zp_reporting.blocks` — bloques encontrados (solo ZP)

**`pc` y `fpc`** son tarifas ANDE:
- `pc` = **Punta de Carga** (horario pico con tarifa más alta)
- `fpc` = **Fuera de Punta de Carga** (horario valle, tarifa menor)

`power_consumption` = `pc` + `fpc` (verificar en producción).

Los pools vistos en `pools_data`: `braiins`, `ocean`, `luxos`.

### 12.5 Luxor CSVs (manual, para AXXA y GUY)

Los clientes que minan a través de **Luxor pool** no están en las revenue DBs — exportan su data desde el portal de Luxor y llega como CSV manual al operador. Columnas típicas:

```
Date, Hashrate (PH/s), Shares Efficiency, Uptime, Workers count,
Mining (BTC), Referrals (BTC), LuxOS (BTC),
Price (BTC/PH/s/Day), Price (USD/PH/s/Day), BTC/USD Price
```

**Para v1 queda como data manual-load en Local DB** (vía CLI o upload).

---

## 13. Foreman — inventario de miners

El sitio usa **Foreman Mining** como fleet manager. Exporta CSV con ~18,000 miners del sitio (un registro por cada unidad física).

### 13.1 Columnas clave

| Campo | Uso |
|---|---|
| `miner_id` | PK |
| `miner_name` | Nombre local (ej: `IMM-S21-1`, `Z3-R1-E5-old`) |
| `status` | `online`, `fail`, `disabled`, `idle`, … |
| `miner_type` | Modelo + hashrate nominal (ej: `Antminer S19 XP (141T)`) |
| `wattage` | Potencia nominal de fábrica |
| `power_mode` | `normal`, `idle`, … |
| `hash_rate` | Hashrate live |
| `max_temp`, `temps` | Temperatura live |
| `accepted_shares`, `rejected_shares`, `stale_shares` | Calidad de mining |
| `active_pool`, `active_worker`, `pool_1/2/3_url`, `pool_1/2/3_worker` | A qué pool/worker apunta |
| **`miner_rack_group`** | **Identificador del container** (matchea `ICS.containers.name`) |
| `miner_row`, `miner_index`, `miner_rack` | Posición dentro del container |
| `miner_control_board` | Board ID |
| `Reparado por`, `Fecha de ultima reparacion`, `Proforma de Reparación` | Ops / mantenimiento |
| `luxos_*` | Config LuxOS (para miners bajo ese firmware) |

### 13.2 Regla de mapeo

```
foreman.miner_rack_group == ICS.containers.name == prefijo Registros_*
```

93 valores distintos (A11…G22, M1…M20, N1…N12, S1…S9, T11…T42, Z1…Z3), plus edge cases como `Immersion Test` y vacío.

### 13.3 Client name en Foreman no es el cliente real

Todos los miners tienen `client_name = "Penguin Digital"`. El cliente real (ZP/ND/Mara/AXXA/…) hay que inferirlo vía **ICS** (`containers.customer_id` → `customers.name`) mediante el `miner_rack_group`.

---

## 14. Convenciones de unidades

- **Potencia activa**: siempre en **kW** en ICS y SCADA.
- **Hashrate**: siempre en **TH/s** en ICS (`hashrate_total`, `hashrate_nominal`); PH/s en algunos reportes (Luxor usa PH/s).
- **Energía**: **kWh**. Excepción: ND en SCADA usa int64 concatenado (ver §10).
- **Eficiencia**: **W/TH** o equivalentemente **J/TH** (para steady-state son el mismo número).
- **Timezone**: operaciones en **America/Asuncion (UTC-3)**, datos en SCADA/ICS guardados en UTC.
- **Moneda tarifa**: **USD/kWh** para energía, **USD/m³** para agua.

---

## 15. Tarifas por cliente (del Master Client List)

El modelo de tarifa por cliente tiene **6 componentes desglozables** (estilo Bitdeer technical breakdown, no un solo número):

```
Client Price (USD/kWh) = Energy Pass Through  +  Hosting Fee  +
                         Social Contribution  +  VAT (sobre base)

Water (USD/m³)        — se factura aparte cuando aplica (hydro cooling)
```

Muestra real de la hoja `Jan 2026 — Effective Price`:

| Cliente | Proyecto | kWh consumidos | USD pre-VAT | VAT (10%) | Total USD | Precio efectivo |
|---|---|---|---|---|---|---|
| ZP Ltd. | JV 1 | 19,925,470 | $1,090,948 | $109,095 | $1,200,042 | **$0.0602/kWh** |
| AXXA (HC4) | HC4 | 7,521,884 | $507,671 | $49,639 | $557,310 | **$0.0741/kWh** |
| AFTech (HC3) | HC3 | 667,033 | $45,660 | $4,566 | $50,226 | **$0.0753/kWh** |
| Northern Data | JV 5 | 18,277,090 | $843,949 | $84,394 | $928,343 | **$0.0508/kWh** |

Se maneja en Local DB en la tabla `client_tariffs` (ver `src/schema/local.ts`).

### 15.1 Reference Profitability Metrics (por proyecto)

Del Master List, cada contrato tiene asociado:

- **Theoretical Hashrate (PH/s)** — capacidad nominal total
- **Breakeven Hashprice – Pure Energy** — hashprice break-even si sólo se paga energía
- **Breakeven Hashprice – E + OPEX** — + opex operativo
- **Breakeven Hashprice – All-In** — + capex + todo lo demás
- **Fleet Efficiency (J/TH)** — eficiencia promedio de la flota ese cliente

---

## 16. Hardware / machine catalog

Modelos de miners vistos en el sitio (catálogo abierto):

| Modelo | Hashrate nominal | Wattage nominal | Efficiency J/TH | Tecnología |
|---|---|---|---|---|
| Antminer S19 XP | 141 T | 3,010 W | 21.4 | Air |
| Antminer S19 XP Hydro 224T | 224 T | 5,304 W | 23.7 | Hydro |
| Antminer S19j Pro 110T | 110 T | 3,250 W | 29.5 | Air |
| Antminer S19k Pro 120T | 120 T | 2,760 W | 23.0 | Air |
| Antminer S21 | 200 T | 3,500 W | 17.5 | Air |
| Antminer S21 Hydro 302T | 302 T | 5,360 W | 17.75 | Hydro |
| Antminer S21 Pro (LuxOS) | ~230 T | 3,530 W | 15.3 | Air |
| Whatsminer M63 / M63S | 442 / 493 T | ~7,700 W | 17.5 | Hydro |
| Bitmain A3 Pro Hyd | 660 T | 8,250 W | 12.5 | Hydro (referencia Bitdeer) |

Mantenido en `machine_configs` tabla local (actualizable por admin). Nominal hashrate y wattage usados para cálculos de eficiencia teórica.

---

## 17. Roadmap implícito derivado de este doc

Módulos que ahora se habilitan gracias a tener esta baseline:

- **Rentabilidad** — antes bloqueado por no tener tarifas + revenue; ahora desbloqueado (Revenue DBs + `client_tariffs`)
- **Estado de Producción** — card/vista nueva (pedido en nota del Willian): uptime, miners hashing vs total, reparaciones = delta
- **Cooling** — card/vista nueva: temperaturas agua in/out + delta, pasillo frío/caliente (aire), caudal, presión, contra umbrales
- **Eléctrico** — card/vista nueva: potencia activa por fase, corriente, tensión, factor de potencia, por container
- **Impacto de mantenimientos** — correlación `modulations` con revenue + tarifa → USD perdidos por ventana de downtime
- **Consumo real + drift (SCADA)** — ahora se puede cross-check: `energy_consumption_minute` (revenue) vs AL## (SCADA) vs `container_histories` (ICS active_power)
- **Alertas n8n** — thresholds de §8 como primeras reglas

---

*Última actualización: 2026-04-21 — validado contra VBScript SCADA + Master Client List + SLD Penguin Infrastructure 100MW.*
