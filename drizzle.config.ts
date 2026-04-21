import { readFileSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit CLI doesn't auto-load .env.local; load it manually.
try {
  const raw = readFileSync(".env.local", "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, key, val] = m;
    if (key && process.env[key] === undefined) {
      process.env[key] = val?.replace(/^["'](.*)["']$/, "$1") ?? "";
    }
  }
} catch {
  // .env.local missing — fall through, defaults below will be used
}

const host = process.env.LOCAL_DB_HOST ?? "localhost";
const port = Number(process.env.LOCAL_DB_PORT ?? 5433);
const user = process.env.POSTGRES_USER ?? "ops";
const password = process.env.POSTGRES_PASSWORD ?? "";
const database = process.env.POSTGRES_DB ?? "ops_console";

export default defineConfig({
  schema: "./src/schema/local.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host,
    port,
    user,
    password,
    database,
    ssl: false,
  },
  verbose: true,
  strict: true,
});
