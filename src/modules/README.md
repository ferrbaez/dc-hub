# Modules

Here lives the code **owned by each Department Leader** (Mining, Maintenance,
Automation, Networking, Explotación). Each module is an isolated feature that
consumes the core via tRPC and has its own UI, routes and logic.

See [`../../docs/MODULAR_SOP.md`](../../docs/MODULAR_SOP.md) for the full
working agreement: anatomy of a module, data access rules, git flow, cadence.

## Structure

```
src/modules/
├── mining/            ← owner: Allan / Ronaldo
├── maintenance/       ← owner: Marcelo / Mario
├── automation/        ← owner: Carlos
├── networking/        ← owner: Alexis
└── explotacion/       ← owner: Jorge
```

Each area folder contains one or more kebab-case module folders (e.g.
`mining/reporting/`, `mining/turnos/`). Each module **must**:

- Have a `README.md` (template in SOP §4).
- Register its tRPC router in `index.ts`.
- Mount its Next.js routes via `routes.tsx`.
- **Never** import from another `src/modules/*` sibling.
- **Never** open a direct connection to ICS, SCADA, Revenue or Local DB — only
  call `core.*` endpoints.

## Adding a new module

1. Create `src/modules/<area>/<nombre-kebab>/`.
2. Copy the module template from SOP §4.
3. Fill the `README.md` — owner, users, data consumed, endpoints, success metric.
4. If a core endpoint you need does not exist, open a **core-request** in
   [`../../docs/core-requests/`](../../docs/core-requests/) (SOP §7.3).
5. Work on a `feat/<modulo>-<descripcion>` branch, PR to `main`, assign Willian.

## What lives OUTSIDE this folder

The existing "views" built pre-modular (cooling, eléctrico, producción,
gráficos, analytics chat) live under `src/app/(app)/` and
`src/components/dashboard/`. They are **legacy core** — maintained by the Core
Keeper. New work does NOT go there.

If a legacy view eventually needs to graduate into a real module (with an
owner, its own router, etc.), that's a deliberate migration — not a drift.
