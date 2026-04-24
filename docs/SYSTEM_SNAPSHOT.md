# Willian's Hub — System Snapshot (2026-04-21)

Estado actual, imprimible en papel. Actualizado después de:
Módulo 0 (scaffold) + Shell (Penguin) + Auth + Analytics chat + Clarificación.

---

## 1. Big picture — quién vive dónde, quién habla con quién

```
       ┌───────────────────────────────────────────────────────────────────────┐
       │                      TU MACBOOK (dev)                                 │
       │                                                                       │
       │   ┌───────────────────────────┐                                       │
       │   │   Browser (Chrome/Brave)  │                                       │
       │   │   localhost:3000          │                                       │
       │   │   - Dashboard  (/)        │                                       │
       │   │   - Analytics (/analytics)│                                       │
       │   │   - Login     (/login)    │                                       │
       │   └──────────┬────────────────┘                                       │
       │              │ HTTP/JSON (tRPC) + cookies NextAuth JWT                │
       │              ▼                                                        │
       │   ┌────────────────────────────────────────────────────────────┐      │
       │   │                Next.js 15 dev server                       │      │
       │   │                                                            │      │
       │   │   middleware.ts ── bloquea todo excepto /login + /api/auth │      │
       │   │                                                            │      │
       │   │   Routes:                                                  │      │
       │   │     /api/auth/[...nextauth]  → NextAuth v5 handler         │      │
       │   │     /api/trpc/[trpc]         → tRPC router (ask, analyze,  │      │
       │   │                                followup, runSql, etc.)    │      │
       │   │     /api/chat/export/:id     → genera .xlsx con ExcelJS    │      │
       │   │                                                            │      │
       │   │   Server libs:                                             │      │
       │   │     lib/analytics/ask.ts        → orquesta Claude          │      │
       │   │     lib/analytics/executor.ts   → ejecuta SQL              │      │
       │   │     lib/analytics/validator.ts  → rechaza no-SELECT        │      │
       │   │     lib/auth.ts                 → credentials + bcrypt     │      │
       │   │     lib/db/{ics,scada,local}.ts → 3 drivers                │      │
       │   └─────┬──────────────────┬─────────────────────┬─────────────┘      │
       │         │                  │                     │                    │
       │    (1) pg ▼          (2) pg ▼              (3) mssql ▼                │
       │   ┌────────────┐   ┌────────────────┐   ┌─────────────────┐           │
       │   │ TimescaleDB│   │ (VPN requerida)│   │ (VPN requerida) │           │
       │   │ :5433      │   │ ICS Postgres   │   │ SCADA SQL Server│           │
       │   │ Docker     │   │ 172.16.10.5    │   │ 172.16.10.3     │           │
       │   │ container  │   │ read-only      │   │ read-only       │           │
       │   │ hub_local  │   │ dcd_read       │   │ Infra_Manager   │           │
       │   └────────────┘   └────────────────┘   └─────────────────┘           │
       │         ▲                                                             │
       │         │                                                             │
       │   ┌─────┴──────┐                                                      │
       │   │ n8n :5678  │   (Docker, reservado para futuros workflows          │
       │   │ hub_n8n    │    de alertas — aún sin uso)                         │
       │   └────────────┘                                                      │
       │                                                                       │
       └───────────────────────┬───────────────────────────────────────────────┘
                               │ HTTPS
                               ▼
                      ┌───────────────────┐
                      │  Anthropic API    │
                      │  api.anthropic.com│
                      │  Sonnet 4.6       │
                      │  Prompt caching   │
                      │  Structured out   │
                      └───────────────────┘

 (1) app dev + auth sessions + chat history + entity catalog target
 (2) source of truth de mining ops (containers, pools, modulations)
 (3) 180 tablas de mediciones eléctricas y salud de trafos
```

---

## 2. Request lifecycle — Dashboard (/)

```
Usuario abre /
    │
    ▼
middleware.ts valida cookie JWT
    │
    ├── no autenticado → redirect /login
    │
    └── autenticado
        │
        ▼
Shell renderiza sidebar + header + <AssistantPage/>
    │
    ▼
<AssistantPage> (client component) llama trpc.containers.list.useQuery()
    │
    ▼
GET /api/trpc/containers.list
    │
    ▼
createContext() → auth() → session
    │
    ▼
publicProcedure (sin guard de auth, pero middleware ya bloqueó)
    │
    ▼
listContainersWithCurrent()
    │
    ▼
getIcsPool().query(`SELECT c.*, cd.* FROM containers c LEFT JOIN containers_details cd ...`)
    │
    ▼
Devuelve array de filas normalizadas (Date→ISO, bigint→string)
    │
    ▼
Render: tabla con columna W/TH color-coded + stats cards + filtros
```

---

## 3. Request lifecycle — Analytics /ask (preguntar → ejecutar)

```
Usuario escribe "potencia de ND en los últimos 7 días" y presiona Enter
    │
    ▼
<ChatPane> captura input, set pending={question}, muestra optimista
    │
    ▼
trpc.chat.ask.mutate({ conversationId, question })
    │
    ▼  POST /api/trpc/chat.ask
protectedProcedure valida session (si no, 401)
    │
    ▼
DB: INSERT user message (persiste inmediatamente)
    │
    ▼
generatePlan(question, { history }) ──────────────────┐
    │                                                 │
    ▼                                                 │  CLAUDE #1
system = await buildSqlSystemPrompt()                 │  ~8K tokens schema
 ├── ics.sql (24KB)                                   │  ~35K tokens SCADA
 ├── scada-summary.md (6KB)                           │  + 42K cache_control
 ├── scada.sql (141KB)                                │  = 1ª vez write
 └── catálogo entidades (customers + projects)        │    siguientes read
                                                      │
client.messages.create({                              │
  model: "claude-sonnet-4-6",                         │
  max_tokens: 16000,                                  │
  system: [{...cache_control:"ephemeral"}],           │
  thinking: { type: "adaptive" },                     │
  output_config: { format: json_schema }              │
})                                                    │
    │                                                 │
    ▼                                                 │
Parse JSON: { action, data_source?, sql?,             │
              rationale, clarification?,              │
              candidates? }                           │
    │                                                 │
    ├── action="clarify" ─────────────────────────────┘
    │       │
    │       ▼
    │   DB: INSERT assistant message
    │        (content=clarification,
    │         metadata={kind:"clarification", candidates:[...]})
    │       │
    │       ▼
    │   UI: burbuja violeta + botones de candidatos
    │       click → submit(candidato) → vuelve al tope del diagrama
    │
    └── action="execute"
            │
            ▼
        validateSelectOnly(sql)
            └── si tiene INSERT/UPDATE/DELETE/etc → error
        validateScadaTimeFilter(sql) si data_source=scada
            └── si tabla Registros_*/H2Sense_* sin Time_Stamp → error
            │
            ▼
        executeQuery(data_source, sql)
            ├── ics/local  → pg pool .query()
            └── scada      → getScadaRequest() (pool max=2, READ UNCOMMITTED)
            │
            ▼
        Normaliza Date→ISO, bigint→string, Buffer→stub
            │
            ▼
        DB: INSERT assistant message
             (sqlGenerated, resultRows, resultColumns, rowCount,
              durationMs, inputTokens, outputTokens, cacheReadTokens,
              cacheCreationTokens)
            │
            ▼
        Return al browser
            │
            ▼
        UI: tabla + SQL block (copiar/re-ejecutar) + botones
            [Analizar resultados]  [Consulta complementaria]
```

---

## 4. Request lifecycle — Botones opt-in

```
                  ┌─────────────────────────┐
                  │ Mensaje asistente       │
                  │ con tabla + SQL         │
                  └───┬────────┬────────────┘
                      │        │
         click        │        │        click
    ┌─────────────────┘        └──────────────────────┐
    │                                                 │
    ▼                                                 ▼
trpc.chat.analyze.mutate({messageId})         trpc.chat.followup.mutate({messageId})
    │                                                 │
    ▼  CLAUDE #2 — fast                               ▼  CLAUDE #3 — analítico
messages.create({                            messages.create({
  model: sonnet-4-6,                           model: sonnet-4-6,
  max_tokens: 1024,                            max_tokens: 16000,
  output_config:{effort:"low"},                thinking: adaptive,
  NO thinking                                  system: cached schema,
  system: prompt corto                         "genera un SQL MÁS analítico"
  "2-4 oraciones, markdown ok"              })
})                                                   │
    │                                                ▼
    ▼                                            Parse → { action, sql, rationale }
Resultado: markdown con                              │
**negritas** y listas                                ▼
    │                                            DB: INSERT ASSISTANT MESSAGE
    ▼                                                 (sqlGenerated llenado,
DB: UPDATE chatMessages                               resultRows=NULL → DRAFT)
     SET content=analysis                             │
     WHERE id=messageId                               ▼
    │                                            UI: burbuja con SQL + chip
    ▼                                                 "Pendiente" + botón [Ejecutar]
UI: bloque lime con análisis                          │
                                                      │ click
                                                      ▼
                                               trpc.chat.runSql.mutate({messageId})
                                                      │
                                                      ▼
                                                  validator + executor
                                                      │
                                                      ▼
                                                  DB: UPDATE con resultRows
                                                      │
                                                      ▼
                                                  UI: tabla reemplaza draft
```

---

## 5. Auth flow — login

```
Usuario sin cookie → middleware redirect → /login
    │
    ▼
<LoginPage> formulario email + password
    │
    ▼  submit
signIn("credentials", { email, password, redirect: false })
    │
    ▼  POST /api/auth/callback/credentials
NextAuth v5 → authorize() en lib/auth.ts
    │
    ▼
Zod valida email
getLocalDb().select().from(users).where(eq(email))
    │
    ▼
bcrypt.compare(password, user.passwordHash)
    │
    ├── match → return { id, email, name, role }
    │                    │
    │                    ▼
    │            JWT callback añade role al token
    │                    │
    │                    ▼
    │            Set-Cookie: next-auth.session-token (JWT firmado con AUTH_SECRET)
    │                    │
    │                    ▼
    │            router.push("/") → dashboard
    │
    └── no match → return null → "Email o contraseña incorrectos"


Requests autenticadas:
    │
    ▼
middleware.ts ejecuta authConfig.callbacks.authorized({ auth, request })
    │
    ├── !auth?.user && path != /login → redirect /login?callbackUrl=...
    ├── auth?.user && path == /login  → redirect /
    └── else → next()

tRPC procedures:
    createContext() → auth() devuelve session desde cookie JWT
    protectedProcedure middleware: if !session.user → 401 UNAUTHORIZED
```

---

## 6. Prompt caching — qué se cachea, qué no

```
Claude request layout (render order: tools → system → messages):

    system: [
      {                                            ┐
        type: "text",                              │
        text: "<8K schema prompt                   │  CACHED
               + 35K SCADA DDL                     │  5-min TTL
               + 42K catálogo entidades>",         │  75K tokens
        cache_control: { type: "ephemeral" }       │  1ª vez: write (1.25x)
      }                                            │  siguientes: read (0.1x)
    ]                                              ┘

    messages: [
      { role: "user", content: "pregunta actual" }   ─── NO cacheado
      (conversation history si aplica)                   (volátil)
    ]

Costo por pregunta:
    ┌──────────────┬─────────────┬──────────────┐
    │ Situación    │ Latencia    │ Costo aprox  │
    ├──────────────┼─────────────┼──────────────┤
    │ 1ª en sesión │ 30-100 s    │ $0.15        │
    │ < 5 min      │ 10-25 s     │ $0.012       │
    │ > 5 min TTL  │ 30-100 s    │ $0.15        │
    └──────────────┴─────────────┴──────────────┘

Invalidators (cualquiera rompe cache):
    - Cambio en el texto del system prompt
    - Cambio en la lista de customers o projects (poco frecuente)
    - Cambio de modelo
```

---

## 7. DB schema — local (nuestra TimescaleDB)

```
users
├── id              bigserial PK
├── email           text unique NOT NULL
├── password_hash   text NOT NULL  (bcrypt 12 rounds)
├── display_name    text NOT NULL
├── role            text NOT NULL default 'user'  ('admin'|'user')
└── created/updated timestamps

chat_conversations
├── id              bigserial PK
├── user_id         FK users(id) ON DELETE CASCADE
├── title           text (primeras 80 chars de la 1ª pregunta)
└── created/updated timestamps
    idx: (user_id, updated_at)

chat_messages
├── id              bigserial PK
├── conversation_id FK chat_conversations(id) ON DELETE CASCADE
├── role            text  ('user'|'assistant')
├── content         text  (pregunta | análisis | clarificación)
├── sql_generated   text?
├── data_source     text?  ('ics'|'scada'|'local')
├── rationale       text?
├── result_rows     jsonb? (normalizado)
├── result_columns  jsonb?
├── row_count       int?
├── duration_ms     int?
├── error_code      text?
├── error_message   text?
├── input_tokens    int?   \
├── output_tokens   int?   │ telemetría Claude
├── cache_read      int?   │
├── cache_creation  int?   /
├── metadata        jsonb? ({ kind:"clarification", candidates:[...] })
└── created_at      timestamp
    idx: (conversation_id, created_at)

job_runs  — placeholder, aún no usada
```

Estados de un mensaje assistant:

```
  role=assistant
      │
      ├── errorCode + !sqlGenerated  → ERROR previo a ejecución
      │
      ├── sqlGenerated + !resultRows + !errorCode
      │                                → DRAFT (pendiente ejecutar)
      │
      ├── sqlGenerated + errorCode   → SQL con error de ejecución/validación
      │
      ├── sqlGenerated + resultRows + !content
      │                                → EXECUTED (sin análisis aún)
      │
      ├── sqlGenerated + resultRows + content
      │                                → EXECUTED + analizado
      │
      └── metadata.kind=clarification → CLARIFICATION (pregunta al user)
```

---

## 8. File structure — lo que importa

```
willians-hub/
├── CLAUDE.md                       ← tu referencia de reglas
├── docs/
│   ├── ARCHITECTURE.md             ← diseño original (strategic)
│   ├── DATA_SOURCES.md             ← reglas ICS y SCADA
│   ├── ROADMAP.md                  ← backlog
│   ├── SYSTEM_SNAPSHOT.md          ← este archivo
│   └── schemas/
│       ├── ics.sql                 ← DDL ICS (source of truth types)
│       ├── scada.sql               ← DDL SCADA (180 tablas)
│       └── scada-summary.md        ← patrones SCADA
│
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← SessionProvider + TrpcProvider
│   │   ├── (auth)/login/page.tsx   ← form de login
│   │   ├── (app)/
│   │   │   ├── layout.tsx          ← Shell
│   │   │   ├── page.tsx            ← / (dashboard containers)
│   │   │   └── analytics/page.tsx  ← /analytics (chat)
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── trpc/[trpc]/route.ts
│   │       └── chat/export/[messageId]/route.ts  (.xlsx)
│   │
│   ├── components/
│   │   ├── layout/         sidebar, header, shell, user-menu, health-chip,
│   │   │                   auto-refresh-select
│   │   ├── analytics/      chat-pane, conversation-list, message,
│   │   │                   sql-block, result-table, analysis-markdown
│   │   └── ui/             card, table (shadcn primitives)
│   │
│   ├── lib/
│   │   ├── anthropic.ts            ← SDK singleton + MODELS
│   │   ├── analytics/
│   │   │   ├── ask.ts              ← generatePlan / runPlan /
│   │   │   │                         generateAnalysis / generateFollowupPlan
│   │   │   ├── executor.ts         ← SQL execution wrapper
│   │   │   ├── schema-context.ts   ← prompt builder + catálogo entidades
│   │   │   └── sql-validator.ts    ← SELECT-only, SCADA Time_Stamp
│   │   ├── auth.ts                 ← NextAuth v5 config
│   │   ├── auth.config.ts          ← edge-safe subset (middleware)
│   │   ├── db/{ics,scada,local,healthcheck}.ts
│   │   └── trpc/client.tsx         ← QueryClient + TrpcProvider
│   │
│   ├── server/
│   │   ├── context.ts              ← tRPC context (inyecta session)
│   │   ├── trpc.ts                 ← publicProcedure + protectedProcedure
│   │   └── routers/
│   │       ├── _app.ts             ← combina routers
│   │       ├── containers.ts       ← containers.list
│   │       ├── health.ts           ← health.all
│   │       └── chat.ts             ← ask, analyze, followup, runSql,
│   │                                 conversations.{list,get,delete}
│   │
│   ├── schema/
│   │   ├── local.ts                ← Drizzle: users, chat_*, job_runs
│   │   └── ics-mirror.ts           ← typed mirror of ICS (read-only)
│   │
│   ├── types/next-auth.d.ts        ← augment session con role
│   └── middleware.ts               ← auth gate
│
└── scripts/
    ├── healthcheck.ts              ← pnpm healthcheck
    ├── user-create.ts              ← pnpm user:create
    └── test-analytics.ts           ← E2E debug del pipeline
```

---

## 9. Comandos que usás

```
  pnpm dev                → Next.js dev server :3000
  pnpm build / pnpm start → producción
  pnpm lint / lint:fix    → Biome
  pnpm typecheck          → tsc --noEmit
  pnpm db:push            → Drizzle migrate local DB (--force)
  pnpm db:studio          → GUI Drizzle
  pnpm healthcheck        → pinguea 3 DBs, muestra cuál falla
  pnpm user:create        → CLI interactivo para crear usuario
  pnpm tsx scripts/test-analytics.ts "<pregunta>"
                          → E2E debug sin browser

  docker compose up -d    → levanta TimescaleDB + n8n
  docker compose ps       → estado
  docker compose down     → bajar
```

---

## 10. Lo que NO tenemos aún (candidatos del ROADMAP)

```
  ☐ Rentabilidad         — overview de ganancia por sitio/proyecto
  ☐ Consumo real + drift — SCADA real vs ICS reportado, cross-source
  ☐ SLAs por cliente     — compliance contra thresholds custom
  ☐ Mantenimientos       — impacto de modulations (kWh/revenue perdidos)
  ☐ Salud de trafos      — dashboard H2Sense_*
  ☐ Incidentes           — correlar ALARMHISTORY con container_histories
  ☐ Alertas n8n          — triggers automáticos
  ☐ Vistas móviles       — rutas phone-first vía Tailscale
  ☐ Reportes PDF/Excel   — exports programados
```
