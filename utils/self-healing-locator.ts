import { Page, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export interface LocatorStrategy {
  /** Short, human-readable name for this strategy — shows up in logs/reports. */
  name: string;
  locate: (page: Page) => Locator;
}

export interface HealingResult {
  locator: Locator;
  strategyUsed: string;
  /** True if the primary (index 0) strategy failed and a fallback was used. */
  healed: boolean;
}

const HEALING_LOG_PATH = path.resolve(process.cwd(), 'test-results', 'healing-log.jsonl');

/**
 * Self-healing locator resolution — Tier 1 (deterministic, no AI).
 *
 * Tries a prioritized list of locator strategies in order and returns the
 * first one that resolves to a visible element. The first entry is the
 * "primary" strategy — the one a developer originally wrote and expects to
 * work. If it fails and a later strategy succeeds instead, that's logged as
 * a "heal": the test doesn't fail, but the drift is recorded to
 * test-results/healing-log.jsonl for a human to review later.
 *
 * This is deliberately NOT silent — a self-healing locator that never
 * surfaces its own healing events just delays the failure instead of
 * catching real UI regressions. The goal is resilience to cosmetic changes
 * (a renamed class, a reordered attribute) without masking genuine breakage.
 */
export async function resolveWithHealing(
  page: Page,
  strategies: LocatorStrategy[],
  options: { timeoutPerStrategy?: number; context?: string } = {}
): Promise<HealingResult> {
  const timeout = options.timeoutPerStrategy ?? 2000;

  if (strategies.length === 0) {
    throw new Error('resolveWithHealing requires at least one locator strategy.');
  }

  const attempts: string[] = [];

  for (let i = 0; i < strategies.length; i++) {
    const { name, locate } = strategies[i];
    try {
      const locator = locate(page);
      await locator.first().waitFor({ state: 'visible', timeout });

      const healed = i > 0;
      if (healed) {
        logHeal({
          context: options.context ?? 'unknown',
          primaryStrategy: strategies[0].name,
          healedWithStrategy: name,
          failedStrategies: attempts,
        });
      }
      return { locator, strategyUsed: name, healed };
    } catch {
      attempts.push(name);
    }
  }

  throw new Error(
    `resolveWithHealing: all ${strategies.length} locator strategies failed for "${options.context ?? 'unknown'}": ${strategies
      .map((s) => s.name)
      .join(' → ')}`
  );
}

function logHeal(entry: {
  context: string;
  primaryStrategy: string;
  healedWithStrategy: string;
  failedStrategies: string[];
}) {
  const record = { timestamp: new Date().toISOString(), ...entry };

  console.warn(
    `⚠ Self-healing triggered [${entry.context}]: primary "${entry.primaryStrategy}" failed, ` +
      `healed using "${entry.healedWithStrategy}"`
  );

  try {
    fs.mkdirSync(path.dirname(HEALING_LOG_PATH), { recursive: true });
    fs.appendFileSync(HEALING_LOG_PATH, JSON.stringify(record) + '\n');
  } catch {
    // Logging failure shouldn't fail the test itself — the console.warn above
    // already surfaces the event even if the file write fails (e.g. read-only CI runner).
  }
}