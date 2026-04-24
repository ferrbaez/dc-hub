# Site Baseline — Revisión (DRAFT)

> **Qué es esto:** resumen de lo que entendí del sitio después de leer tus notas, el VBScript del SCADA y el diagrama unifilar. Llenás los bloques `Comentario:` con correcciones, confirmaciones o ampliaciones, me lo devolvés, y con eso construyo el `docs/SITE_BASELINE.md` definitivo que se inyecta en el prompt cacheado de Claude.
>
> **Cómo comentar:** después de cada punto hay un bloque `Comentario:` con líneas en blanco. Tachá lo que esté mal, agregá detalles, marcá "ok" si está bien. Se puede imprimir y escribir a mano, o editar en VS Code.

---

## Parte 1 — Jerarquía física y eléctrica del sitio

### 1.1 Cadena de tensión

Interpreto que la energía viaja así:

```
LT 220 kV ANDE (red)
    │
    ▼
Subestación 220 kV (propia)
    ├─ 3 trafos 41.67 MVA Toshiba  (TR-1, TR-2, TR-3)  — 220/23 kV
    └─ Banco de capacitores 6 MVAR 13.8 kV
    │
    ▼
23 kV  (Media Tensión — MT)
    ├─ 15 alimentadores AL01..AL15
    ├─ BC02 (Sazmining Fan)
    ├─ SA1 — Servicios Auxiliares (incluye trafo 300 kVA y grupo electrógeno 200 kVA de emergencia)
    │
    ▼
Trafos de piso por línea (23 kV / 0.4 kV ó 0.48 kV)
    │
    ▼
380 V — 480 V  (Baja Tensión — BT)  → PDUs de containers (medición lado A y lado B)

Contrato de potencia con ANDE: 105,000 kW  (si PQM_Primario > 105,000 dispara MsgBox)
```

**Comentario (completá):**
```
Contrato es de 100 MW, nos dan un umbral de 5 mW, la medicion en BT es mediante multimedidores de diferentes marcas en los tableros de fuerza, Acrel, Schneider, etc, _______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________
```

---

### 1.2 Trafos de piso (BT) identificados en el SLD

| Línea | Trafos | Capacidad unitaria | Cliente principal |
|---|---|---|---|
| ALPHA (A) | TR-A1, A2, A3 | 2500 kVA, 23/0.4 kV | ZPJV |
| BRAVO (B) | TR-B1, B2, B3 | 2500 kVA | ZPJV + SAZ Hydro |
| CHARLIE (C) | TR-C1, C2, C3 | 2500 kVA | ZPJV |
| DELTA (D) | TR-D1, D2, D3 | 2500 kVA | ZPJV + Guy + Thomas + AXXA |
| E (Marathon E) | TR-E11, E12, E21, E22, E31, E32 | 1250 kVA | Marathon Mara1 |
| F (AXXA) | TR-F1, F2, F3 | 2500 kVA | AXXA |
| G (VILLA RICA / AXXA) | TR-G1, G2 | 2500 kVA | AXXA |
| M (Mara2 — líneas aéreas) | TR-M2, TR-M3 (TrafoSur) | n/d | Marathon Mara2 |
| N (NORTHERN) | TR-N1..N12 (agrupados en CDM-14/15/16/17) | 2700 kVA 23/0.48 kV | NORTHERN DATA |
| S | TR-S1/2, S3, S4, S5, S6, S7, S8, S9 | 1500 kVA y 1250 kVA | ZPJV |
| TEXAS (T) | TR-T1, T2, T3, T4 | 1000 kVA | Marathon Mara1 |
| SA1 | TR-SA1 | 300 kVA | Servicios auxiliares |

**Comentario (completá — nombres canónicos, cantidades correctas, clientes reales):**
```
_G es Axxa, Villarica se le dice a la zona E, Mara 2 no son lineas aereas, ese es en Mara1 Eco, en Texas tenemos Zp y Mara, hoy en dia solo mara activo______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________
```

---

## Parte 2 — Jerarquía lógica

### 2.1 Relación Cliente → Proyecto → Contenedor

Entendí que un **trafo físico puede alimentar contenedores de clientes distintos**. Ejemplo: `TR-B1` alimenta `B11` (que pertenece a ZPJV) y `B12` (que pertenece a SAZ Hydro). Por eso el mapping real es cliente→contenedor, no cliente→trafo.

En ICS la relación pasa por `containers`:
- `containers.customer_id` → cliente
- `containers.project_id` → proyecto
- `customers` y `projects` no tienen FK directo entre sí, la unión es por `containers`

**Comentario:**
```
_Super______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________
```

### 2.2 ¿Cuándo un mismo "cliente" tiene 2 proyectos?

Del VBScript veo que **Marathon** está separado en `$Mara1` y `$Mara2`:
- `$Mara1` — containers T11-T42 + E11-E32 (alimentador AL10)
- `$Mara2` — containers M1-M20 (alimentadores AL13, AL14, AL15)

Mi hipótesis: ICS tiene **1 cliente** (MARATHON) con **2 proyectos** (MARA1 y MARA2), o **2 clientes separados** (MARATHON y MARATHON-2), o algún esquema similar.

Lo mismo para **Sazmining** = `$Saz_Hydro` (B12/B22/B32) + `$Saz_Fan` (Z1/Z2/Z3 + D22). Dos tecnologías (agua por inmersión vs. aire por ventilador) bajo un mismo cliente.

**Comentario (confirmá: ¿cómo aparecen Marathon y Sazmining en ICS — un cliente con múltiples proyectos, o dos clientes? ¿Cuáles son los nombres exactos de cada proyecto?):**
```
En el ICS Mara y Saz tienen proyectos diferentes, el de Mara es porque uno es Immersion y el otro air, y el de Saz porque uno es Hydro y el otro AIR_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________
```

---

## Parte 3 — Mapping Cliente → Contenedores (del VBScript SCADA)

### 3.1 ZPJV (`$ZP` en SCADA)

Contenedores: **A11, A12, A21, A22, A31, A32, B11, B21, B31, C11, C12, C21, C22, C31, C32, D11, T41, S1, S2, S3, S4, S5, S6, S7, S8, S9**

Convención de medición: `$X##_Potencia_Activa_Kw_lado_A` + `$X##_Potencia_Activa_Kw_lado_B`

**Comentario:**
```
_______________________________________________________________________________
_______________________________________________________________________________
```

### 3.2 Marathon — Mara1

Contenedores: **T11, T21, T31 (solo lado_B), E11, E12, E21, E22, E31, E32**
Convención: `_Active_Power_Total_lado_A/B`

Duda: `T31` solo tiene `lado_B`. ¿Es que T31 lado_A está caído / no existe / pertenece a otro cliente?

**Comentario:**
```
CORRECTO, SOLAMENTE LADO B, EL LADO A ES DE ZP, Los contenedores de ZP son T12,T22,T32,T42, T41, T31 lado A_______________________________________________________________________________
_______________________________________________________________________________
```

### 3.3 Marathon — Mara2

Contenedores: **M1 a M20 completos** (cada uno con lado A y lado B)
Convención distinta: `$M##_A_Potencia_Activa_Kw` (la A/B va en el medio del nombre, no como sufijo)

**Comentario:**
```
_______________________________________________________________________________
_______________________________________________________________________________
```

### 3.4 Clientes chicos

- **GUY SCHWARZENBACH:** solo D12
- **THOMAS AFTECH:** solo D21

**Comentario:**
```
_______________________________________________________________________________
_______________________________________________________________________________
```

### 3.5 AXXA

Contenedores: **D31, D32, F21, F22, F31, F32, G11, G12, G21, G22**
Convención: `_Potencia_Activa_Kw_lado_A/B`

**Comentario:**
```
_______________________________________________________________________________
_______________________________________________________________________________
```

### 3.6 NORTHERN DATA (`$ND`)

Contenedores: **N1 a N12**
Convención: `_Active_Power_Total_lado_A/B`

**Comentario:**
```
_______________________________________________________________________________
_______________________________________________________________________________
```

### 3.7 SAZ Hydro

Contenedores: **B12, B22, B32** (los "pares" de la línea B)
Convención: `_Potencia_Activa_Kw_lado_A/B`

### 3.8 SAZ Fan

Contenedores: **Z1, Z2, Z3** (cada uno con 4 lados: `A1, A2, B1, B2`) + **D22**
Convención: `_Active_Power_Total_lado_A1/A2/B1/B2`

Duda: ¿Por qué Z tiene 4 lados y no 2? ¿Dos PDUs por lado A y dos por lado B? ¿Son unidades físicamente más grandes?

**Comentario (SAZ Hydro + Fan):**
```
_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________
```

---

## Parte 4 — Mapping Alimentador MT → Contenedores BT

Del VBScript (sección `$PUE_AL##_Baja`) saqué qué contenedores alimenta cada alimentador MT. Esto es crítico para calcular pérdidas parciales.

| Alimentador | Contenedores que alimenta | Cliente predominante |
|---|---|---|
| AL01 | F21, F22, F31, F32, G11, G12, G21, G22 | AXXA |
| AL02 | N4, N5, N6 | ND |
| AL03 | N1, N2, N3 | ND |
| AL04 | N7, N8, N9 | ND |
| AL05 | N10, N11, N12 | ND |
| AL06 | A11, A12, A21, A22, A31, A32 | ZPJV (A) |
| AL07 | B11, B12, B21, B22, B31, B32 | **mixto** ZPJV + SAZ Hydro |
| AL08 | C11, C12, C21, C22, C31, C32 | ZPJV (C) |
| AL09 | D11, D12, D21, D22, D31, D32 | **mixto** ZPJV + Guy + Thomas + AXXA + SAZ Fan |
| AL10 | E11-E32 + T11, T12, T21, T22, T31, T32, T41, T42 | Marathon Mara1 |
| AL11 | S6, S7, S8, S9 | ZPJV |
| AL12 | S1, S2, S3, S4, S5 | ZPJV |
| AL13 | M1, M2, M3, M11, M12, M13 | Marathon Mara2 |
| AL14 | M4, M5, M6, M7, M14, M15, M16, M17 | Marathon Mara2 |
| AL15 | M8, M9, M10, M18, M19, M20 | Marathon Mara2 |
| BC02 | Z1, Z2, Z3 | SAZ Fan |

**Observación:** `AL09` y `AL07` son "alimentadores mezclados" — no pertenecen a un solo cliente. Cualquier query de consumo por cliente que haga fan-out desde alimentador va a dar mal para estos dos.

**Comentario (confirmá el mapping completo, marcá errores, agregá AL faltantes si hay):**
```
_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________
```

---

## Parte 5 — PUE (Power Usage Effectiveness)

### 5.1 Fórmulas de pérdida

Del VBScript:
```
PQM_primario_positivo = $PQM_Potencia_KW_Primario * -1

PUE_AltaBaja  = primario_positivo − ΣCliente_kW      ← pérdida TOTAL del sitio (AT→BT)
PUE_AltaMedia = primario_positivo − ΣMediaTension     ← pérdida en trafos principales (AT→MT)
PUE_MediaBaja = ΣMediaTension − ΣCliente_kW           ← pérdida en alimentadores (MT→BT)
```

Donde:
- `ΣCliente_kW` = suma de todos los contenedores en BT + servicios auxiliares + Sazmining
- `ΣMediaTension` = AL01_Total_Power + ... + AL15_Total_Power + BC02_Total_Power + Servicios Aux (en MT)

**Comentario:**
```
_______________________________________________________________________________
_______________________________________________________________________________
```

### 5.2 PUE por alimentador

Para cada alimentador AL## (y BC02):
```
PUE_AL##_Baja = AL##_Total_Power − Σ(Potencia_Activa de los contenedores que alimenta)
```

Esto te dice cuánta pérdida hay en el trafo BT + cableado asociado a ese alimentador.

**Comentario:**
```
_______________________________________________________________________________
_______________________________________________________________________________
```

---

## Parte 6 — Umbrales operativos (del VBScript)

```
Trafo_Temp_Lim1 = EM01_Temperatura + 50°C   (alerta temperatura trafo vs ambiente)
Trafo_Temp_Lim2 = EM01_Temperatura + 55°C   (crítico)

Limite_temp_ND         = 45°C   (agua cooling NORTHERN DATA)
Limite_temp_Hydro      = 40°C   (agua cooling SAZ Hydro)

Limite_Pressure_Sup_ND = 3.3 bar
Limite_Pressure_Inf_ND = 2.2 bar
```

**Comentario (faltan umbrales? corresponden a todos los clientes con agua? Hydro también tiene límites de presión?):**
```
_por el momento solo eso______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________
```

---

## Parte 7 — Temperatura agua en containers ND

Del VBScript:
```
N#_T1_Prom (entrada) = (R#_1_T1 + R#_6_T1 + R#_11_T1) / 3
N#_T2_Prom (salida)  = (R#_1_T2 + R#_6_T2 + R#_11_T2) / 3
```

Cada contenedor N tiene sensores en 3 racks (R1, R6, R11) y cada sensor tiene T1 y T2. Se promedia por contenedor.

Otros caudales:
```
TV_Caudal_D31 = D31A + D31B   (SAZ Hydro total D31)
TV_Caudal_D32 = D32A + D32B   (SAZ Hydro total D32)
```

**Comentario (¿los otros clientes con agua tienen esquema similar — SAZ Hydro, Mara, etc.? ¿De dónde sale la T de entrada/salida para Hydro?):**
```
En este caso no son de agua son sensores de temperatura y humedad puestos en diferentes loops y rack, pasilo frio y caliente _______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________
```

---

## Parte 8 — Preguntas abiertas

### 8.1 `clients_total_power` (tabla SCADA)

En `docs/DATA_SOURCES.md` pusimos "nunca usar, es duplicado de ICS". Pero el VBScript calcula `$SumaCliente_kW` desde los PDU individuales, no de esa tabla. Entonces: ¿qué es `clients_total_power` realmente?

Opciones:
- (a) Pre-agregación en SCADA de la suma de clientes (equivalente a `$SumaCliente_kW` del script), útil como shortcut
- (b) Tabla vieja ya deprecada, no usar
- (c) Copy de algún valor de ICS, no refleja medición real

**Comentario:**
```
opcion a
_______________________________________________________________________________
```

### 8.2 "Cards selectivos" / containers nuevos

Tu nota decía: *"Containers nuevos vistos que tienen que ser cards selectivos (modelo de energía auto-cacheado cuando no tiene papel)"*.

No entiendo bien. ¿Podrías explicar con un ejemplo? Mi interpretación tentativa: contenedores recién instalados donde el sistema todavía no tiene papeles / metadatos registrados, y hay que cargarles el modelo de energía (consumo nominal, eficiencia esperada) a mano.

**Comentario (explicá con ejemplo):**
```
_ah me referi nomas a que esos son las nuevas tablas y vistas que quiero, pero se entiende ahora?, el de Estado de Produccion,Cooling y Electrico ______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________
```

### 8.3 KPI "Producción"

Tu nota lista como métricas de producción por contenedor:
- `online_uptime`
- `hashing_uptime`
- `total_miners` + `miners_pending`
- `reparaciones = total - hashing` (delta)

¿Querés un bloque "Producción" en el dashboard con estos KPIs por contenedor y/o por cliente? ¿Ventana típica 24h? ¿O es sólo un concepto que el chat de Analytics deba conocer para responder preguntas del tipo "cuántos containers están abajo por reparaciones hoy"?

**Comentario:**
```
ya son las nuevas implementaciones de UI_____________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________
```

### 8.4 `hashratedb.hashratebycontainer`

El VBScript del SCADA hace:
```vbs
sql = "SELECT hashrate FROM hashratedb.hashratebycontainer WHERE container='A11'"
resultado = $DBExecute("hashratedb", sql, variableName, 1)
```

O sea, el SCADA pulling de hashrate viene de una DB que se llama `hashratedb`, NO de ICS. ¿Qué es esa DB?

- ¿Está accesible desde el MacBook? ¿Credenciales?
- ¿Es la misma fuente que usa ICS, o una intermedia?
- Foreman la llena directamente?

**Comentario:**
```
ESTO YA NO CUENTA, NO CONSIDERAR_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________
```

### 8.5 Trafos compartidos entre clientes — ¿patrón o excepción?

Casos que veo:
- TR-B1 → B11 (ZPJV) + B12 (SAZ Hydro)
- TR-B2 → B21 (ZPJV) + B22 (SAZ Hydro)
- TR-B3 → B31 (ZPJV) + B32 (SAZ Hydro)
- TR-D... varios clientes mezclados

¿Es patrón general (esperable que cualquier trafo alimente a más de un cliente) o son casos específicos?

**Comentario:**
```
__ESPECIFICOS_____________________________________________________________________________
_______________________________________________________________________________
```

### 8.6 `Registros_EM01` — estación meteorológica

Tu nota menciona `Registros_EM01` como la estación meteorológica del sitio y `$EM01_Temperatura` aparece como baseline para umbrales de trafos. ¿Qué más tiene además de temperatura? Humedad, viento, presión atmosférica, lluvia?

**Comentario:**
```
VE TU Y SEPAS QUE PUEDES ENCONTRAR EN CADA TABLA DE ESTAS PARA CONFIRMAR SU ESTRUCTURA, SE ENTIENDE?_______________________________________________________________________________
_______________________________________________________________________________
```

### 8.7 Energía acumulada — int64 concatenado

Al final del VBScript aparece:
```vbs
$Tag_auxiliar_01 = ($N1_Active_Energy_Delivered_Into_Load_lado_A * 2^32) +
                   $N1_Active_Energy_Received_Out_of_Load_lado_A
```

Interpreto: los medidores guardan energía como dos int32 (parte alta + baja) y hay que concatenarlos para formar el valor real int64. Eso significa que las columnas de **energía** en `Registros_N*` no deben sumarse directamente sin hacer esta combinación.

¿Aplica a todos los contenedores o sólo a N (ND)?

**Comentario:**
```
_SOLO A ND______________________________________________________________________________
_______________________________________________________________________________
```

---

## Parte 9 — Cosas adicionales que necesito saber

### 9.1 ¿Hay documentación del FOREMAN / pool / hashrate externa que me puedas pasar?

El hashrate/revenue viene de ICS (según DATA_SOURCES) pero el SCADA también lo consume de `hashratedb`. ¿Quién es la fuente de verdad real y cómo se relacionan?

**Comentario:**
```
TE PASO NUESTRO ARCCHIVO DE FOREMAN, Y TAMBIEN LAS POOLS Y OTRAS BASE DE DATOS QUE USAMOS PARA REVENUE Y HASHRATE DESDE LA POOL DE AQUELLOS QUE SI TENEMOS DATOS______________________________________________________________________________
_____________________________________________________________________________ __
```

### 9.2 ¿Modelo de miners por contenedor?

Para cálculos de eficiencia teórica (W/TH esperado por modelo vs real), necesito saber qué miners hay en cada contenedor. ¿Hay una tabla en ICS que diga "container X tiene 200 miners modelo S19 XP"? ¿O sólo sabemos el modelo global del container?

**Comentario:**
```
_______________________________________________________________________________
_______________________________________________________________________________
```

### 9.3 Precio de energía por cliente

Para Rentabilidad (candidato de roadmap) necesitamos `$/kWh` por cliente/proyecto. ¿Está en algún lado hoy? En ICS hay `projects.target_consumption`, pero no veo tarifa. ¿Lo vamos a cargar manual en Local DB?

**Comentario:**
```
_______________________________________________________________________________
_______________________________________________________________________________
```

### 9.4 Algo importante que no te pregunté

Si hay algo estructural del sitio que creas que el sistema tiene que saber pero no lo cubrí, agregalo acá.

**Comentario:**
```
_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________
```

---

## Parte 10 — Qué hago con esto una vez confirmado

Con tus respuestas, genero dos artefactos:

1. **`docs/SITE_BASELINE.md`** — doc definitivo con el mapeo validado, imprimible, que queda en el repo y se cita desde `docs/DATA_SOURCES.md`.
2. **Inyección al prompt Claude** — agrego una sección "CANONICAL SITE TOPOLOGY" al `buildSqlSystemPrompt()` cacheada junto al schema. Cada pregunta del chat Analytics va a tener ese mapa disponible, así que cuando el usuario diga "consumo línea N" Claude sabe que son N1-N12 con lado A+B, alimentado por AL02-AL05, cliente NORTHERN DATA.

Costo estimado de la inyección: ~3-5K tokens extra en cache (~$0.001 extra por pregunta con cache hit). Trade-off: precisión altísima sobre la operación real del sitio.

**Comentario final (algún ajuste al plan?):**
```
_______________________________________________________________________________
_______________________________________________________________________________
```

---

*Última edición: 2026-04-21 — entregado por Claude para revisión de Willian Báez.*
