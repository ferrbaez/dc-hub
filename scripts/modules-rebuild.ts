#!/usr/bin/env tsx
/**
 * Regenerates `src/server/routers/_modules.ts` from the contents of
 * `src/modules/`. Useful after manually deleting or renaming a module.
 *
 * Does NOT touch nav-registry.ts (sidebar entries are intentionally
 * curated — remove the entry by hand if needed).
 */
import path from "node:path";
import { MODULES_REGISTRY, REPO_ROOT, writeModulesRegistry } from "./_modules-shared";

async function main() {
  const count = await writeModulesRegistry();
  process.stdout.write(
    `✔ ${path.relative(REPO_ROOT, MODULES_REGISTRY)} reconstruido (${count} módulo(s))\n`,
  );
}

main().catch((err) => {
  process.stderr.write(`✖ ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
