/**
 * Shared helpers for `pnpm new:module` and `pnpm modules:rebuild`.
 * Walks `src/modules/<area>/<modulo>/` and emits the contents of
 * `src/server/routers/_modules.ts` from disk state.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AREA_SLUGS, type AreaSlug } from "../src/lib/areas";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, "..");
export const MODULES_DIR = path.join(REPO_ROOT, "src/modules");
export const MODULES_REGISTRY = path.join(REPO_ROOT, "src/server/routers/_modules.ts");

export function camelize(s: string): string {
  return s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

export async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function listExistingModules(): Promise<{ area: AreaSlug; folder: string }[]> {
  const found: { area: AreaSlug; folder: string }[] = [];
  let areas: string[];
  try {
    areas = await fs.readdir(MODULES_DIR);
  } catch {
    return found;
  }
  for (const a of areas) {
    if (!(AREA_SLUGS as readonly string[]).includes(a)) continue;
    const areaDir = path.join(MODULES_DIR, a);
    const stat = await fs.stat(areaDir).catch(() => null);
    if (!stat?.isDirectory()) continue;
    const mods = await fs.readdir(areaDir);
    for (const m of mods) {
      const modDir = path.join(areaDir, m);
      const isDir = (await fs.stat(modDir).catch(() => null))?.isDirectory();
      if (!isDir) continue;
      if (await exists(path.join(modDir, "index.ts"))) {
        found.push({ area: a as AreaSlug, folder: m });
      }
    }
  }
  return found.sort((a, b) =>
    a.area === b.area ? a.folder.localeCompare(b.folder) : a.area.localeCompare(b.area),
  );
}

export async function writeModulesRegistry(): Promise<number> {
  const modules = await listExistingModules();

  const moduleImports = modules.map(({ area, folder }) => {
    const ident = `${area}_${camelize(folder).replace(/[^a-zA-Z0-9_$]/g, "_")}_router`;
    return `import { router as ${ident} } from "@/modules/${area}/${folder}";`;
  });
  const allImports = [...moduleImports, `import { router } from "@/server/trpc";`].sort((a, b) => {
    const fromA = a.match(/from "([^"]+)"/)?.[1] ?? "";
    const fromB = b.match(/from "([^"]+)"/)?.[1] ?? "";
    return fromA.localeCompare(fromB);
  });

  const grouped = new Map<AreaSlug, { key: string; ident: string }[]>();
  for (const { area, folder } of modules) {
    const key = camelize(folder);
    const ident = `${area}_${key.replace(/[^a-zA-Z0-9_$]/g, "_")}_router`;
    if (!grouped.has(area)) grouped.set(area, []);
    grouped.get(area)?.push({ key, ident });
  }

  const blocks = [...grouped.entries()].map(([area, mods]) => {
    const inner = mods.map((m) => `    ${m.key}: ${m.ident},`).join("\n");
    return `  ${area}: router({\n${inner}\n  }),`;
  });

  const registryBody = blocks.length === 0 ? "" : `\n${blocks.join("\n")}\n`;

  const content = `// src/server/routers/_modules.ts — managed by \`pnpm new:module\`. Do not edit by hand.
// To add or remove a module:
//   pnpm new:module <area>/<nombre>      → adds it
//   rm -r src/modules/<area>/<nombre> && pnpm modules:rebuild   → removes it
${allImports.join("\n")}

export const moduleRouters = {${registryBody}};
`;
  await fs.writeFile(MODULES_REGISTRY, content);
  return modules.length;
}
