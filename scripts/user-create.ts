#!/usr/bin/env tsx
import { stdin, stdout } from "node:process";
import readline from "node:readline/promises";
/**
 * Create a user in the local DB. Interactive — passwords never go on argv.
 *   pnpm user:create
 *
 * First user should typically be an admin. Roles supported: 'admin' | 'user'.
 * Loads .env.local via tsx's --env-file flag (see package.json script).
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { AREA_SLUGS, type AreaSlug, isAreaSlug } from "../src/lib/areas";
import { getLocalDb, getLocalPool } from "../src/lib/db/local";
import { userAreas, users } from "../src/schema/local";

type ReadlineWithWriter = readline.Interface & {
  _writeToOutput?: (s: string) => void;
  output?: NodeJS.WritableStream;
};

async function promptSilent(rl: readline.Interface, q: string): Promise<string> {
  const rlAny = rl as ReadlineWithWriter;
  const original = rlAny._writeToOutput;
  let masking = false;
  rlAny._writeToOutput = (s: string) => {
    if (!masking || s === "\n" || s === "\r" || s === "\r\n") {
      rlAny.output?.write(s);
    } else {
      rlAny.output?.write("*".repeat(s.length));
    }
  };
  masking = true;
  try {
    const answer = await rl.question(q);
    return answer;
  } finally {
    masking = false;
    rlAny._writeToOutput = original;
  }
}

function parseAreaList(raw: string): AreaSlug[] {
  const tokens = raw
    .split(/[\s,]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const invalid = tokens.filter((t) => !isAreaSlug(t));
  if (invalid.length > 0) {
    throw new Error(`Áreas inválidas: ${invalid.join(", ")}. Válidas: ${AREA_SLUGS.join(", ")}`);
  }
  return Array.from(new Set(tokens as AreaSlug[]));
}

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    const emailRaw = (await rl.question("Email: ")).trim();
    const email = emailRaw.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Email inválido");
    }

    const db = getLocalDb();
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      throw new Error(`Ya existe un usuario con email ${email}`);
    }

    const displayName = (await rl.question("Nombre a mostrar: ")).trim();
    if (!displayName) throw new Error("Nombre requerido");

    const password = await promptSilent(rl, "Contraseña (min 8 chars): ");
    stdout.write("\n");
    if (password.length < 8) throw new Error("Contraseña debe tener >= 8 caracteres");
    const confirm = await promptSilent(rl, "Confirmar contraseña: ");
    stdout.write("\n");
    if (password !== confirm) throw new Error("Las contraseñas no coinciden");

    const roleInput = (await rl.question("Rol (admin/user) [user]: ")).trim().toLowerCase();
    const role = roleInput === "admin" ? "admin" : "user";

    let areas: AreaSlug[];
    if (role === "admin") {
      areas = ["core"];
      stdout.write("→ Admin: áreas asignadas automáticamente: core (admin bypassa el check)\n");
    } else {
      stdout.write(`Áreas válidas: ${AREA_SLUGS.join(", ")}\n`);
      const areasRaw = (await rl.question("Áreas (separadas por coma o espacio): ")).trim();
      if (!areasRaw) throw new Error("Debés asignar al menos un área a un usuario no-admin");
      areas = parseAreaList(areasRaw);
      if (areas.length === 0) throw new Error("Debés asignar al menos un área");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [created] = await db
      .insert(users)
      .values({ email, displayName, passwordHash, role })
      .returning({ id: users.id, email: users.email, role: users.role });

    if (!created) throw new Error("No se pudo crear el usuario");

    await db.insert(userAreas).values(areas.map((area) => ({ userId: created.id, area })));

    stdout.write(
      `\n✔ Usuario creado: ${created.email} · rol ${created.role} · áreas: ${areas.join(", ")} · id ${created.id}\n`,
    );
  } finally {
    rl.close();
    try {
      await getLocalPool().end();
    } catch {
      // ignore
    }
  }
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`\n✖ ${msg}\n`);
  process.exit(1);
});
