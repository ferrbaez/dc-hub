import "server-only";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export class AnthropicConfigError extends Error {
  readonly code = "ANTHROPIC_CONFIG_MISSING";
  constructor() {
    super(
      "ANTHROPIC_API_KEY missing — set it in .env.local (get one at https://console.anthropic.com)",
    );
    this.name = "AnthropicConfigError";
  }
}

/**
 * Read ANTHROPIC_API_KEY, preferring process.env but falling back to a direct
 * read of .env.local when the env value is empty.
 *
 * Why the fallback: Next.js (like dotenv) lets process env vars override .env
 * file vars. Claude for Desktop exports an empty `ANTHROPIC_API_KEY=""` into
 * the parent shell, which blocks `.env.local` from supplying the real key.
 * Rather than fight that with shell tricks, we just read the file directly.
 */
function resolveApiKey(): string | null {
  const fromEnv = process.env.ANTHROPIC_API_KEY;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv.trim();

  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    const match = raw.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.*)\s*$/m);
    if (!match) return null;
    let value = (match[1] ?? "").trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export function getAnthropicClient(): Anthropic {
  if (!client) {
    const key = resolveApiKey();
    if (!key) throw new AnthropicConfigError();
    client = new Anthropic({ apiKey: key });
  }
  return client;
}

// Model IDs per the claude-api skill. No date suffixes.
export const MODELS = {
  // SQL generation: user explicitly chose Sonnet 4.6.
  sql: "claude-sonnet-4-6" as const,
  // Analysis of results: also Sonnet 4.6 (user preferred Sonnet over Haiku).
  analysis: "claude-sonnet-4-6" as const,
};
