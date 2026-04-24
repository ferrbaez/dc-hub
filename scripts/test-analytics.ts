#!/usr/bin/env tsx
/**
 * E2E test of the analytics pipeline — hits Anthropic + ICS/SCADA for real.
 * Runs the full new flow: generatePlan → runPlan → generateAnalysis →
 * generateFollowupPlan.
 *
 *   pnpm tsx --conditions=react-server --env-file=.env.local scripts/test-analytics.ts "your question"
 */
import {
  asPlan,
  generateAnalysis,
  generateFollowupPlan,
  generatePlan,
  runPlan,
} from "../src/lib/analytics/ask";
import { getIcsPool } from "../src/lib/db/ics";
import { getLocalPool } from "../src/lib/db/local";
import { getScadaPool } from "../src/lib/db/scada";

async function main() {
  const question = process.argv[2] ?? "¿Cuántos containers tienen más de 180 miners hashing ahora?";

  process.stdout.write(`Question: ${question}\n\n`);

  // 1. Plan
  const t0 = Date.now();
  const { result: planResult, usage: planUsage } = await generatePlan(question);
  process.stdout.write(`[generatePlan] ${Date.now() - t0} ms\n`);
  process.stdout.write(`Action: ${planResult.action}\n`);
  process.stdout.write(`Rationale: ${planResult.rationale}\n`);

  if (planResult.action === "clarify") {
    process.stdout.write(`\nCLARIFICATION: ${planResult.clarification}\n`);
    process.stdout.write(`Candidates: ${(planResult.candidates ?? []).join(" | ")}\n`);
    process.stdout.write(
      `\nTokens: in=${planUsage.inputTokens} out=${planUsage.outputTokens} cache_read=${planUsage.cacheReadTokens} cache_write=${planUsage.cacheCreationTokens}\n`,
    );
    return;
  }

  const plan = asPlan(planResult);
  process.stdout.write(`Data source: ${plan.data_source}\n`);
  process.stdout.write(`SQL:\n${plan.sql}\n\n`);

  // 2. Execute
  const t1 = Date.now();
  const result = await runPlan(plan);
  process.stdout.write(`[runPlan]      ${Date.now() - t1} ms  (${result.rowCount} rows)\n`);
  process.stdout.write(`Columns: ${result.columns.join(", ")}\n`);
  if (result.rows.length > 0) {
    process.stdout.write(`First row: ${JSON.stringify(result.rows[0])}\n`);
  }
  process.stdout.write("\n");

  // 3. Analyze (opt-in, fast)
  const t2 = Date.now();
  const { analysis, usage: analysisUsage } = await generateAnalysis(question, plan, result);
  process.stdout.write(`[analysis]     ${Date.now() - t2} ms\n`);
  process.stdout.write(`${analysis}\n\n`);

  // 4. Follow-up SQL (more analytical)
  const t3 = Date.now();
  const { result: followupResult, usage: followupUsage } = await generateFollowupPlan(
    question,
    plan,
    result,
  );
  process.stdout.write(`[followup]     ${Date.now() - t3} ms (action=${followupResult.action})\n`);
  process.stdout.write(`Rationale: ${followupResult.rationale}\n`);
  if (followupResult.action === "execute" && followupResult.sql) {
    process.stdout.write(`SQL:\n${followupResult.sql}\n\n`);
  } else if (followupResult.action === "clarify") {
    process.stdout.write(
      `CLARIFICATION: ${followupResult.clarification}\nCandidates: ${(followupResult.candidates ?? []).join(" | ")}\n\n`,
    );
  }

  const total = Date.now() - t0;
  process.stdout.write(
    `TOTAL: ${total} ms — plan in=${planUsage.inputTokens} out=${planUsage.outputTokens} | analysis in=${analysisUsage.inputTokens} out=${analysisUsage.outputTokens} | followup in=${followupUsage.inputTokens} out=${followupUsage.outputTokens}\n`,
  );
  process.stdout.write(
    `Cache: plan_read=${planUsage.cacheReadTokens} plan_write=${planUsage.cacheCreationTokens} · followup_read=${followupUsage.cacheReadTokens} followup_write=${followupUsage.cacheCreationTokens}\n`,
  );

  await Promise.allSettled([
    (async () => {
      try {
        await getIcsPool().end();
      } catch {}
    })(),
    (async () => {
      try {
        await getLocalPool().end();
      } catch {}
    })(),
    (async () => {
      try {
        const p = await getScadaPool().catch(() => null);
        if (p) await p.close();
      } catch {}
    })(),
  ]);
}

main().catch((err) => {
  process.stderr.write(`\nFAILED: ${err instanceof Error ? err.message : String(err)}\n`);
  if (err instanceof Error && err.stack) process.stderr.write(`${err.stack}\n`);
  process.exit(1);
});
