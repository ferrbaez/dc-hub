# DC Hub — SOP de Desarrollo Modular

> Este documento define **cómo** el equipo del Departamento de Operaciones del
> Data Center construye módulos sobre el núcleo de DC Hub. Sirve tres usos:
>
> 1. **Brief para Claude Code** — pegalo al arrancar la sesión y ya tiene las
>    reglas del juego.
> 2. **`CLAUDE.md` del repo** — copiá este archivo a la raíz del repositorio.
>    Cada Claude Code que abra el proyecto (en cualquier laptop) lo lee
>    automáticamente y hereda las mismas reglas.
> 3. **SOP para el equipo humano** — los owners lo leen una vez antes de la
>    primera sesión.
>
> Documentos complementarios que este SOP da por leídos:
> `SITE_BASELINE.md` · `SYSTEM_SNAPSHOT.md` · `ARCHITECTURE.md` · `DATA_SOURCES.md`.

---

## 0. Para Claude Code — qué esperamos de vos

Cuando abras este repositorio:

1. Leé **primero** este archivo, después `ARCHITECTURE.md`, después
   `DATA_SOURCES.md`, después `SITE_BASELINE.md`.
2. Si el trabajo es sobre un módulo, leé también el `README.md` de ese módulo.
3. Nunca escribas contra ICS ni SCADA. Nunca abras conexión nueva a esas
   bases desde un módulo — solo el núcleo lo hace (ver §7).
4. Antes de proponer un cambio que cruce dos módulos → pará y preguntá.
   Módulos acoplados es bug de arquitectura, no feature.
5. Antes de mergear a `main` ejecutá: `pnpm typecheck && pnpm lint`.
   Si alguno falla, no mergees.
6. Estilo de código: el que ya está. No introduzcas libs nuevas sin aprobación
   explícita del Core Keeper.

---

## 1. Organigrama relevante y roles en este proyecto

### 1.1 Departamento de Operaciones del Data Center (contexto completo)

```
                    Ricardo Galeano
                 VP of DC Operations
                        │
          ┌─────────────┴─────────────┐
          │                           │
    Willian Baez                Katherine Delvalle
 Infrastructure Manager          Facilities Manager
          │                           │
   ┌──────┼──────┬─────────┐   ┌──────┼──────────┐
   │      │      │         │   │      │          │
Software  Head   Head      │ Leader  Safety  Occupational
Developer  of    of        │ of      Officer  Health
         Maint  Mining     │ Facilities
       (Marcelo) (Allan)   │    │
                           │    ├── Warehouse
   (bajo Maintenance)      │    ├── Cleaning Crew
   ├─ Maintenance Leader   │    ├── MSU
   │  └─ Maint. Technician │    └─ General Services
   └─ Sub-Station Leader   │
      └─ Sub. Operator     │
                           │
   (bajo Mining)           │
   ├─ Networking &         │
   │  Cybersecurity Leader │
   │  ├─ NOC               │
   │  ├─ Net. Supervisor   │
   │  └─ Net. Technician   │
   ├─ Microelectronics     │
   │  Leader               │
   │  └─ Micro. Technician │
   ├─ Mining Leader        │
   │  └─ Mining Technician │
   └─ Automation Leader    │
      └─ Automation Tech.  │
```

### 1.2 Roles en el proyecto DC Hub

| Rol en el proyecto | Persona | Puesto en el organigrama | Responsabilidad |
|---|---|---|---|
| Sponsor | **Ricardo Galeano** | VP of DC Operations | Aprobador de la iniciativa. Se le reporta avance mensual. |
| Core Keeper | **Willian Baez** | Infrastructure Manager | Dueño del núcleo. Habilita endpoints nuevos. Revisa PRs. Deploy a servidor. |
| Core Dev (apoyo) | *Software Developer* | Desarrollador de Software (reporta a Willian) | Apoya al Core Keeper en tareas de núcleo y endpoints. |
| Module Owner — Maintenance | **Marcelo Cardozo** | Head of Maintenance | Prioriza módulos del área. Delega ejecución en los leaders. |
| Module Owner — Mining | **Allan Fernández** | Head of Mining | Prioriza módulos del área. Delega ejecución en los leaders. |
| Module Owner — Networking & Ciberseguridad | **Alexis Fernández** | Networking & Cybersecurity Leader | Ejecuta módulos de red, NOC, ciberseguridad. |
| Module Owner — Mining | **Ronaldo Chávez** | Mining Leader | Ejecuta módulos operativos de minería (reporting, turnos). |
| Module Owner — Automation | **Carlos González** | Automation Leader | Ejecuta módulos de automatización / alertas. |
| Module Owner — Mantenimiento | **Mario** *(apellido a confirmar)* | Maintenance Leader | Ejecuta módulos de mantenimiento preventivo, tickets. |
| Module Owner — Explotación (⚠ fuera del organigrama DC Ops) | **Jorge Caballero** | Líder de Explotación | Confirmar a qué estructura pertenece antes de asignar alcance. |
| Pair programmer | Claude Code | — | Escribe el código junto al owner. Respeta este SOP. |

**Potenciales owners de Fase 2** (no activos en la primera ronda pero sí candidatos):

- Sub-Station Leader — módulos de subestación y energía primaria.
- Microelectronics Leader — módulos de salud de placas / microelectrónica.
- Katherine Delvalle (Facilities Manager) — módulos de servicios generales,
  safety, salud ocupacional.

**Regla:** un módulo tiene **un solo owner ejecutor**. Si necesita datos o
cambios fuera de su alcance, el owner abre una *core-request* (§7.3), no
modifica otro módulo.

---

## 2. Topología de ambientes

### 2.1 Producción — servidor de la empresa (único)

- **Host:** `172.16.10.113` (cuenta `n8n`).
- **Path:** `/opt/dc-hub` (clon del repo + `.env.local` de prod).
- **Qué corre ahí:** Next.js 15 + tRPC + NextAuth servido por `pm2` (proceso
  `dc-hub`), + Docker (`hub_local_db` TimescaleDB :5433, contenedor `n8n`
  compartido :5678) + scheduled jobs.
- **Deploy script:** `~n8n/deploy-hub.sh` (fuera del repo). Hace
  `git fetch && git reset --hard origin/main`, `pnpm install --frozen-lockfile`,
  `pnpm build`, `pm2 reload dc-hub` (o `pm2 start` la primera vez), curl al
  healthcheck, exit. Si hay cambios de schema, antes de mergear a `main`
  asegurate de correr `pnpm db:push` en el server (no es parte del deploy).
- **Acceso SSH:** solo Willian (y una cuenta de servicio para deploy).
- **Dominio interno:** a definir — ej. `hub.penguin.local` o IP directa.
- **Es el único entorno "vivo".** No hay staging. No hace falta — es un sistema
  no crítico y la capa de datos está ya aislada (ICS/SCADA son read-only).

### 2.2 Local — laptop de cada developer

Cada owner trabaja en su propia máquina con:

- **Claude Code CLI** instalado y autenticado con su cuenta.
- **Node 20 LTS + pnpm** (el repo ya lo fija en `package.json`).
- **Docker Desktop** corriendo (para TimescaleDB local).
- **VPN corporativa** activa (necesaria para llegar a ICS y SCADA en modo read).
- **Git** con su usuario configurado con mail corporativo.
- **Clon del repo** + `.env.local` con las credenciales que Willian le pase.

El dev corre la app en `localhost:3000`, prueba contra su propia BD local,
pero lee ICS/SCADA reales con cuenta read-only.

### 2.3 Flujo local → producción (simple, sin CI/CD pesado)

```
Laptop del dev                GitHub/GitLab privado             Servidor prod
──────────────                ─────────────────────             ─────────────
  git push feat/xxx   ───►   main (tras merge del owner)  ───►  deploy.sh
                                         │                         │
                                         └─ webhook opcional ──────┘
                                                                   │
                                                           git pull + build +
                                                           pm2 restart hub
```

**Fase 1** (actual): **deploy manual** — Willian hace
`ssh n8n@172.16.10.113 ~/deploy-hub.sh` cuando corresponde. Cero magia.

**Fase 2** (cuando haya 3+ merges por semana): webhook en el remote → servidor
pulea solo. No antes.

---

## 3. Repositorio — estructura

```
hub/
├── CLAUDE.md                    ← este documento (raíz)
├── ARCHITECTURE.md
├── DATA_SOURCES.md
├── SITE_BASELINE.md
├── SYSTEM_SNAPSHOT.md
├── docs/
│   ├── schemas/                 ← DDL real de ICS / SCADA / local
│   └── core-requests/           ← backlog de endpoints pedidos por owners
├── deploy.sh                    ← script idempotente de deploy
├── .env.example
├── package.json
├── src/
│   ├── app/                     ← Next.js app router (rutas globales)
│   ├── server/
│   │   ├── api/
│   │   │   ├── root.ts          ← merges de routers de módulos
│   │   │   └── routers/         ← routers del NÚCLEO (Willian edita)
│   │   └── db/                  ← drivers ics / scada / local
│   ├── lib/                     ← utilidades compartidas (date, chart theme, …)
│   ├── components/              ← primitives de UI reutilizables
│   └── modules/                 ← ÁREA DE CADA OWNER
│       ├── mining/              ← owner: Allan / Ronaldo
│       │   ├── reporting/
│       │   ├── turnos/
│       │   └── …
│       ├── maintenance/         ← owner: Marcelo / Mario
│       ├── automation/          ← owner: Carlos
│       ├── networking/          ← owner: Alexis
│       └── explotacion/         ← owner: Jorge (pendiente de confirmación)
└── tests/                       ← opcional, todavía no obligatorio
```

---

## 4. Anatomía de un módulo

Cada módulo vive en `src/modules/<area>/<nombre-kebab>/` y tiene esta estructura
**obligatoria**:

```
reporting/
├── README.md           ← qué hace, quién lo usa, qué datos consume, owner
├── routes.tsx          ← rutas Next (App Router) — registradas en src/app
├── router.ts           ← tRPC router del módulo
├── queries/            ← funciones que llaman al núcleo o a endpoints tRPC
├── ui/                 ← componentes React del módulo
├── types.ts            ← tipos TypeScript locales
└── index.ts            ← exporta router y metadatos
```

**Reglas duras del módulo** (Claude Code las chequea antes de commitear):

- ❌ No importa de otro `src/modules/*` — solo de `src/lib`, `src/components`
  o del núcleo (`src/server/api`).
- ❌ No abre conexión a ICS, SCADA, Revenue DBs ni Local DB directamente.
  Consume **solo** endpoints tRPC del núcleo.
- ❌ No ejecuta SQL crudo desde el cliente. Nunca.
- ✅ Puede cachear en memoria (con `@tanstack/react-query` ya integrado).
- ✅ Puede pedir al núcleo que cachee en TimescaleDB (§7.3).
- ✅ Toda query SCADA que el núcleo habilite para este módulo respeta pool=2,
  timeout explícito y `READ UNCOMMITTED` (ver `DATA_SOURCES.md`).

**Template de `README.md` del módulo** (copiá tal cual al crear uno nuevo):

```markdown
# <Nombre del módulo>

**Área:** mining | maintenance | automation | networking | explotacion
**Owner ejecutor:** <nombre + mail>
**Owner de área (Head):** <nombre>
**Estado:** draft | v1 | estable
**Última actualización:** YYYY-MM-DD

## Qué resuelve
<Una frase. Si tomás más de una, el módulo es muy grande — partilo.>

## Usuarios finales
<Quiénes entran al dashboard y para qué>

## Datos que consume
- De ICS (vía núcleo): …
- De SCADA (vía núcleo): …
- De Revenue (vía núcleo): …
- De Local DB: …

## Endpoints tRPC que usa
- `core.<x>.<y>` — propósito
- `<mi-modulo>.<z>` — propósito

## Salida
<UI? export xlsx? webhook? ambas?>

## Métrica de éxito
<Cómo sabemos que sirve — reducción de tiempo manual, etc>

## Dependencias
<Otros módulos que deben existir primero, si alguno>
```

---

## 5. Git — workflow simplificado (trunk-based)

Somos técnicos pero no expertos Git. Minimizamos ceremonia.

### 5.1 Reglas

1. **Un solo branch permanente:** `main`. Siempre deployable.
2. **Un branch por tarea:** `feat/<modulo>-<descripcion-corta>`.
   Ej: `feat/reporting-pdf-diario`.
3. **Nada se mergea a `main` sin PR** — aunque el revisor seas vos mismo.
   El PR queda como bitácora.
4. **Commits chicos y frecuentes.** Claude Code ayuda a escribir el mensaje.
5. **Después de mergear, borrás el branch.**

### 5.2 Secuencia típica de trabajo (copiar-pegar)

```bash
# arranca la tarea
git checkout main
git pull
git checkout -b feat/reporting-pdf-diario

# trabajás con claude code...
# ... cuando tengas un bloque que compila y anda:
pnpm typecheck && pnpm lint    # obligatorio
git add .
git commit -m "feat(reporting): export pdf por planta"
git push -u origin feat/reporting-pdf-diario

# abrís PR en GitHub/GitLab → asignás a Willian → esperás ack
# (Willian tiene 24h para responder; si no, podés mergear vos
#  dejando nota en el PR)
```

### 5.3 Qué hace Willian al recibir un PR

1. Mira el diff — le alcanza con leer el `README.md` del módulo y los archivos
   cambiados.
2. Si el PR toca `src/server/api/routers/` o `src/lib/` → revisa con más
   atención (estás tocando el núcleo).
3. Si todo OK → "approve + merge".
4. Deploy a servidor cuando hayan 1-N PRs acumulados, según prioridad.

### 5.4 Rollback (único mecanismo)

Si algo rompe producción:

```bash
ssh n8n@172.16.10.113
cd /opt/dc-hub
git log --oneline -10                        # ver últimos deploys
git fetch origin && git reset --hard <sha>   # volver a versión previa
pnpm install --frozen-lockfile && pnpm build && pm2 reload dc-hub
```

Eso es todo. No hay blue/green, no hay nada más. Rollback manual y rápido.

---

## 6. Ambiente local — bootstrap (cada owner lo corre una sola vez)

```bash
# 1. prerequisitos
brew install node@20 pnpm git        # macOS; en Linux usar package manager
brew install --cask docker
# claude code CLI: seguir https://docs.claude.com/en/docs/claude-code

# 2. clonar
git clone <url-del-repo> hub
cd hub

# 3. deps
pnpm install

# 4. env
cp .env.example .env.local
# → Willian te pasa los valores reales (creds ICS read-only,
#   SCADA read-only, Anthropic key, etc). No los compartas.

# 5. BD local
docker compose up -d timescale
pnpm db:migrate

# 6. correr
pnpm dev
# → abrí http://localhost:3000

# 7. claude code
cd hub && claude
# → al iniciar lee este archivo automáticamente
```

---

## 7. Acceso a datos — la regla más importante

### 7.1 El núcleo es el único que habla con las bases

Los módulos **nunca** abren conexión a ICS, SCADA, Revenue o Local DB.
Toda lectura pasa por un endpoint tRPC del núcleo. Por qué:

- **SCADA pool=2 es un límite duro.** Si cinco módulos abren su propia
  conexión, saturamos AVEVA Edge y paramos el sitio.
- **Coherencia semántica.** El núcleo aplica las reglas de `SITE_BASELINE.md`
  (qué es JV5, qué es AXXA, qué es Villarica). Un módulo no tiene por qué
  saber eso.
- **Caché selectivo.** El núcleo decide qué cachear en TimescaleDB; el módulo
  no tiene visibilidad ni debe tenerla.

### 7.2 Qué puede usar un módulo hoy (endpoints ya existentes)

Lista viva en `src/server/api/root.ts`. Al escribir este SOP los disponibles son:

- `core.containers.list` / `core.containers.byId` / `core.containers.history`
- `core.projects.list` / `core.projects.metrics`
- `core.customers.list`
- `core.modulations.recent`
- `core.blockchain.latest`
- `core.pools.byProject`
- `core.scada.feederEnergy` (usa pre-aggregates, no `Registros_*`)
- `core.scada.transformerHealth` (lee H2Sense_*)
- `core.revenue.daily` (consolidado de las 3 BD de revenue)
- `core.analytics.ask` (chat sobre datos)

Si tu módulo se resuelve con esto — no pidas nada, programá.

### 7.3 Core-request — cuando falta un endpoint

Si tu módulo necesita un dato que el núcleo no expone:

1. Creá un archivo en `docs/core-requests/YYYY-MM-DD-<modulo>-<qué>.md`:

   ```markdown
   # core-request: consumo horario por alimentador

   **Módulo:** mining/reporting
   **Owner:** Ronaldo Chávez
   **Fecha:** 2026-04-28
   **Urgencia:** alta / media / baja

   ## Qué necesito
   Potencia activa promedio hora por AL01…AL15 y BC02, para un rango
   de fechas parametrizable.

   ## Uso
   Reporte diario de consumo a dirección, ETA 08:00 AM.

   ## Forma sugerida del endpoint
   `core.scada.feederHourlyPower(from, to) → { ts, al01, …, al15, bc02 }`

   ## Volumen esperado
   Hasta 7 días × 17 alimentadores × 24h = 2856 filas. Rápido.

   ## Caché?
   Sí, TimescaleDB, hypertable, TTL 24h sería suficiente.
   ```

2. Abrí PR con ese archivo → Willian lo revisa → si tiene sentido, crea el
   endpoint en `src/server/api/routers/scada.ts`.

3. SLA de Willian para core-requests: **48 horas para ack**, **1 semana para
   endpoint entregado** (si es razonable — si no, negocia alcance).

4. Mientras tanto: **no** hardcodeés el query en tu módulo como workaround.
   Esperá el endpoint. Trabajá en otra parte del módulo.

### 7.4 Prohibido (Claude Code rechaza)

- `new Pool(...)` fuera de `src/server/db/`.
- `import pg from 'pg'` fuera de `src/server/db/`.
- `import sql from 'mssql'` fuera de `src/server/db/`.
- Credenciales DB en código (siempre vía `process.env`).
- Queries escritas dinámicamente por concatenación de strings (inyección SQL).

---

## 8. Cadencia de trabajo

### 8.1 Sesión semanal de desarrollo — 2h, lunes 08:00

**Formato:** pair programming en vivo, un módulo por sesión.

**Pre-sesión (owner del módulo, al menos 24h antes):**

- Pegó el template de §4 lleno en un PR draft con el `README.md` del módulo.
- Tiene claro qué datos consume. Si falta endpoint, la core-request ya está
  abierta (§7.3).
- Tiene mockup visual (puede ser dibujo en papel, no hace falta Figma).

**Durante la sesión:**

- Willian presente como Core Keeper (puede habilitar endpoints en vivo).
- El owner maneja su Claude Code, Willian el suyo.
- Meta: salir con v1 mergeado y deployado a producción al final de las 2h.
  No "demo", no "prototipo" — corriendo en el servidor.

**Post-sesión:**

- El owner queda dueño del módulo. Iteraciones siguientes las hace async.

### 8.2 Canales async

| Canal | Para qué | Quién |
|---|---|---|
| PRs en el repo | Cambios de código y core-requests | Todos |
| Slack/Teams `#dc-hub` | Preguntas rápidas, bugs, coordinación | Todos |
| `docs/core-requests/` | Pedidos formales de endpoints | Module owners |
| 1:1 Willian ↔ owner (semanal 20 min) | Desbloqueos arquitectónicos | Owner + Willian |

### 8.3 Retro mensual — 30 min

- Qué rompió en producción y por qué.
- Qué endpoint del núcleo pedimos más.
- Qué módulo morimos por falta de uso (darlo de baja está OK).

### 8.4 Reporte al sponsor — mensual, 15 min

Willian le reporta a Ricardo Galeano (VP DC Operations):

- Módulos en producción y quién los usa.
- Horas de trabajo manual ahorradas (métrica de cada módulo).
- Próximos módulos priorizados.

---

## 9. Checklist pre-merge (imprimile una hoja a cada owner)

Antes de pedir merge a `main`:

- [ ] `pnpm typecheck` pasa sin errores.
- [ ] `pnpm lint` pasa sin errores.
- [ ] Probado en `localhost:3000` con datos reales (no mocks).
- [ ] Ningún import cruzado con otro `src/modules/*`.
- [ ] Ninguna conexión directa a ICS/SCADA/Revenue desde el módulo.
- [ ] `README.md` del módulo actualizado (owner, estado, datos consumidos).
- [ ] Si agregué un endpoint al núcleo, lo documenté en §7.2 (actualizar este
      archivo o crear entry en changelog).
- [ ] PR tiene título `feat|fix|chore(<modulo>): <qué>`.
- [ ] Asigné a Willian como reviewer.

---

## 10. Seguridad mínima

- Secrets **nunca** en el repo. `.env.local` está en `.gitignore`.
- Creds ICS/SCADA son read-only por diseño. Aun así, nadie las comparte fuera
  del equipo.
- El servidor de producción tiene firewall — solo puertos 22 (SSH restringido
  por IP corporativa) y 443 (dashboard, detrás de nginx + auth).
- NextAuth JWT + bcrypt ya está. Cada owner tiene su user.
- Auditoría: todo cambio en `main` queda trazado en git log.

---

## 11. Próximas acciones — Willian (antes del lunes de la sesión)

**Servidor**

- [x] VM aprovisionada en la red corporativa (`172.16.10.113`, cuenta `n8n`).
- [x] Docker + Node 20 + pnpm + pm2 instalados (Node vía Linuxbrew, pnpm 9.15.0).
- [x] Repo clonado en `/opt/dc-hub` con `.env.local` de prod.
- [x] `docker compose up -d` (TimescaleDB :5433, n8n :5678 compartido).
- [x] `pnpm install && pnpm build && pm2 start dc-hub`.
- [x] Script de deploy en `~n8n/deploy-hub.sh` (idempotente, healthcheck final).
- [ ] nginx reverse-proxy → `localhost:3000`, cert interno si aplica.
- [ ] Probar acceso desde otra laptop de la red corporativa.

**Repositorio**

- [x] Repo privado en GitHub corporativo (`github.com/ferrbaez/dc-hub`).
- [x] Push inicial.
- [x] `CLAUDE.md` en la raíz, `MODULAR_SOP.md`, `ARCHITECTURE.md`,
      `DATA_SOURCES.md`, `SITE_BASELINE.md`, `SYSTEM_SNAPSHOT.md` en `docs/`.
- [x] `docs/core-requests/README.md` con plantilla.
- [x] CI en GitHub Actions (`typecheck + lint + module guards` en cada PR).
- [x] CODEOWNERS — review de Willian obligatorio en núcleo / docs / gobernanza.
- [x] Pre-commit hooks (`lefthook` + scripts de aislamiento de módulos).
- [x] `pnpm new:module <area>/<nombre>` para scaffolding.
- [x] Modelo de áreas (9 slugs) + `user_areas` m2m + `areaProcedure` para gating.
- [ ] Activar branch protection en GitHub (1 review, status check `check`,
      linear history, no force push). Requiere `gh auth login` o UI manual.

**Cuentas y accesos**

- [ ] Crear usuario en NextAuth para cada owner confirmado (Marcelo, Allan,
      Alexis, Ronaldo, Carlos, Mario; Jorge pendiente de confirmación) con
      `pnpm user:create` asignándoles las áreas que correspondan según el
      organigrama (Heads cubren múltiples sub-áreas; Leaders/Técnicos solo
      la suya).
- [ ] Crear credenciales SSH del servidor para cuenta de deploy (solo Willian
      las conoce).
- [ ] Confirmar acceso VPN para cada owner.
- [ ] Confirmar creds read-only ICS y SCADA por owner (o compartida, según
      política de IT).

**Comunicación**

- [ ] Alinear con Ricardo Galeano (sponsor) el arranque y la expectativa de
      reporte mensual.
- [ ] Confirmar a qué estructura pertenece Jorge Caballero (Líder de
      Explotación) — no aparece en el organigrama de DC Operations.
- [ ] Confirmar apellido de Mario (Maintenance Leader).
- [ ] Mandar invitación al lunes 08:00-10:00 con este documento adjunto y la
      consigna: "vengan con el `README.md` de su primer módulo pre-llenado
      (sección §4)".

---

## 12. Próximas acciones — cada Module Owner (antes de la sesión)

- [ ] Instalar prerequisitos del §6 en tu laptop.
- [ ] Pedir a Willian el `.env.local` y el acceso al repo.
- [ ] Clonar el repo y correr `pnpm dev`. Abrir `localhost:3000` y loguearte.
- [ ] Leer `ARCHITECTURE.md`, `DATA_SOURCES.md`, `SITE_BASELINE.md`.
- [ ] Llenar el `README.md` de tu primer módulo (template §4).
- [ ] Si ves que te falta un dato → abrir core-request (template §7.3).
- [ ] Llegar el lunes a las 08:00 con eso listo. La sesión es para codear,
      no para diseñar.

---

## 13. Qué NO estamos haciendo (y por qué)

Está bien cortar alcance. Lo que este SOP deliberadamente excluye:

- **CI/CD con GitHub Actions / pipelines.** Deploy manual alcanza hasta que
  duela. No duele todavía.
- **Tests automatizados obligatorios.** Bienvenidos si los querés escribir,
  no bloquean merge. Este sistema no es crítico.
- **Feature flags.** Demasiado sofisticado para el tamaño de equipo.
- **Environments separados (staging).** Un solo entorno, rollback rápido.
- **Microservicios.** Monolito Next.js — simple, un deploy, un proceso.
- **Kubernetes.** pm2 sobre una VM. Cuando escalemos a 50 módulos, revisamos.

Si en 6 meses algo de esto duele → lo agregamos. No antes.

---

*Versión 1.1 — 2026-04-23. Owner del documento: Willian Baez (Infrastructure
Manager). Sponsor: Ricardo Galeano (VP of DC Operations). Próxima revisión:
tras la primera sesión de desarrollo modular.*
