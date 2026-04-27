#!/usr/bin/env tsx
/**
 * `pnpm new:module <area>/<nombre>`
 *
 * Scaffolds a new module under `src/modules/<area>/<nombre>/` following the
 * structure documented in `docs/MODULAR_SOP.md` §4, regenerates the tRPC
 * registry (`src/server/routers/_modules.ts`), creates the Next.js page entry
 * at `src/app/(app)/m/<area>/<nombre>/page.tsx`, and appends a Nav placeholder
 * to `src/lib/nav-registry.ts`.
 *
 * After running, the new tRPC namespace is `<area>.<nombre>.*` and the page
 * is served at `/m/<area>/<nombre>`. Restart `pnpm dev` to pick up the route.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { AREA_SLUGS, type AreaSlug } from "../src/lib/areas";
import { MODULES_DIR, REPO_ROOT, camelize, exists, writeModulesRegistry } from "./_modules-shared";

const NAV_REGISTRY = path.join(REPO_ROOT, "src/lib/nav-registry.ts");
const APP_PAGES_DIR = path.join(REPO_ROOT, "src/app/(app)/m");

function fail(msg: string): never {
  process.stderr.write(`\n✖ ${msg}\n`);
  process.exit(1);
}

function isValidName(s: string): boolean {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(s);
}

async function appendNavEntry(area: AreaSlug, folder: string, label: string) {
  const src = await fs.readFile(NAV_REGISTRY, "utf8");
  const anchor = "// <pnpm:new-module:nav-anchor>";
  if (!src.includes(anchor)) {
    process.stderr.write(
      `⚠ Nav anchor no encontrado en ${path.relative(REPO_ROOT, NAV_REGISTRY)}; saltando inserción de nav.\n`,
    );
    return;
  }
  // Emit multi-line so Biome's formatter doesn't flag it. Indentation is
  // 2 spaces (matches the anchor's existing indentation, preserved by replace).
  const newEntry = `{
    href: "/m/${area}/${folder}",
    label: ${JSON.stringify(label)},
    icon: Wrench,
    requiredArea: "${area}",
    moduleSlug: "${area}/${folder}",
  },
  `;
  const updated = src.replace(anchor, `${newEntry}${anchor}`);
  await fs.writeFile(NAV_REGISTRY, updated);
}

const README_TEMPLATE = (area: AreaSlug, folder: string, today: string) => `# ${folder}

**Área:** ${area}
**Owner ejecutor:** _TBD_ (nombre + mail)
**Owner de área (Head):** _TBD_
**Estado:** draft
**Última actualización:** ${today}

## Qué resuelve

_Una frase. Si necesitás más de una, el módulo es muy grande — partilo._

## Usuarios finales

_Quiénes entran al dashboard y para qué._

## Datos que consume

- De ICS (vía núcleo): _…_
- De SCADA (vía núcleo): _…_
- De Revenue (vía núcleo): _…_
- De Local DB: _…_

## Endpoints tRPC que usa

- \`core.<x>.<y>\` — propósito
- \`${area}.${camelize(folder)}.<z>\` — propósito

## Salida

_UI? export xlsx? webhook? ambas?_

## Métrica de éxito

_Cómo sabemos que sirve — reducción de tiempo manual, etc._

## Dependencias

_Otros módulos que deben existir primero, si alguno._
`;

const ROUTER_TEMPLATE = (area: AreaSlug, folder: string) => {
  const key = camelize(folder);
  return `import { areaProcedure, router } from "@/server/trpc";

/**
 * tRPC router for ${area}.${key}.
 * Procedures use \`areaProcedure("${area}")\` so any user without that area
 * (or admin) gets FORBIDDEN. Do NOT call DBs directly — consume \`core.*\`.
 */
export const ${key}Router = router({
  ping: areaProcedure("${area}").query(() => ({ ok: true, at: new Date().toISOString() })),
});
`;
};

const ROUTES_TEMPLATE = (area: AreaSlug, folder: string) => {
  const key = camelize(folder);
  return `"use client";

/**
 * Page component for /m/${area}/${folder}.
 * Replace with the actual UI for this module.
 */
export default function ${key.charAt(0).toUpperCase()}${key.slice(1)}Page() {
  return (
    <div className="space-y-2 p-6">
      <h1 className="text-xl font-semibold tracking-tight">${folder} (${area})</h1>
      <p className="text-sm text-slate-500">
        Stub generado por <code>pnpm new:module ${area}/${folder}</code>. Editá
        <code> src/modules/${area}/${folder}/routes.tsx</code> para empezar.
      </p>
    </div>
  );
}
`;
};

const INDEX_TEMPLATE = (area: AreaSlug, folder: string) => {
  const key = camelize(folder);
  return `export { ${key}Router as router } from "./router";
export const slug = "${area}.${key}" as const;
`;
};

const TYPES_TEMPLATE = "export {};\n";

const PAGE_REEXPORT_TEMPLATE = (area: AreaSlug, folder: string) =>
  `import { RequireModuleAccess } from "@/components/access/require-module-access";
import ModulePage from "@/modules/${area}/${folder}/routes";

export default function Page() {
  return (
    <RequireModuleAccess area="${area}" modulo="${folder}">
      <ModulePage />
    </RequireModuleAccess>
  );
}
`;

async function main() {
  const arg = process.argv[2];
  if (!arg) fail("Uso: pnpm new:module <area>/<nombre>");
  const parts = arg.split("/");
  if (parts.length !== 2) fail("Formato inválido. Esperado: <area>/<nombre>");
  const [area, folder] = parts as [string, string];
  if (!(AREA_SLUGS as readonly string[]).includes(area)) {
    fail(`Área inválida: "${area}". Válidas: ${AREA_SLUGS.join(", ")}`);
  }
  if (!isValidName(folder)) {
    fail(`Nombre inválido: "${folder}". Debe ser kebab-case (ej: reporting, daily-report).`);
  }
  const areaSlug = area as AreaSlug;
  const moduleDir = path.join(MODULES_DIR, areaSlug, folder);
  if (await exists(moduleDir)) {
    fail(`Ya existe: ${path.relative(REPO_ROOT, moduleDir)}`);
  }

  const today = new Date().toISOString().slice(0, 10);

  await fs.mkdir(path.join(moduleDir, "ui"), { recursive: true });
  await fs.mkdir(path.join(moduleDir, "queries"), { recursive: true });
  await fs.writeFile(path.join(moduleDir, "ui/.gitkeep"), "");
  await fs.writeFile(path.join(moduleDir, "queries/.gitkeep"), "");
  await fs.writeFile(path.join(moduleDir, "README.md"), README_TEMPLATE(areaSlug, folder, today));
  await fs.writeFile(path.join(moduleDir, "router.ts"), ROUTER_TEMPLATE(areaSlug, folder));
  await fs.writeFile(path.join(moduleDir, "routes.tsx"), ROUTES_TEMPLATE(areaSlug, folder));
  await fs.writeFile(path.join(moduleDir, "types.ts"), TYPES_TEMPLATE);
  await fs.writeFile(path.join(moduleDir, "index.ts"), INDEX_TEMPLATE(areaSlug, folder));

  const pageDir = path.join(APP_PAGES_DIR, areaSlug, folder);
  await fs.mkdir(pageDir, { recursive: true });
  await fs.writeFile(path.join(pageDir, "page.tsx"), PAGE_REEXPORT_TEMPLATE(areaSlug, folder));

  await writeModulesRegistry();
  await appendNavEntry(areaSlug, folder, folder);

  const slug = `${areaSlug}.${camelize(folder)}`;
  const readmePath = path.relative(REPO_ROOT, path.join(moduleDir, "README.md"));
  const routerPath = path.relative(REPO_ROOT, path.join(moduleDir, "router.ts"));
  process.stdout.write(
    `\n✔ Módulo creado: ${slug}\n  Carpeta:  ${path.relative(REPO_ROOT, moduleDir)}\n  Ruta:     /m/${areaSlug}/${folder}\n  tRPC:     ${slug}.ping\n\nPróximos pasos:\n  1. Editá ${readmePath} con owner y propósito.\n  2. Implementá tu primera procedure en ${routerPath}.\n  3. Reiniciá pnpm dev para que Next.js levante la nueva ruta.\n`,
  );
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
