import { test, expect } from '@playwright/test';
import { resolveWithHealing } from '../utils/self-healing-locator.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * TEMPORARY VERIFICATION SCRIPT — not part of the graded test suite.
 * Confirms Tier 1 self-healing actually works before relying on it.
 * Delete this file once verified; it proves the mechanism itself, not
 * anything about the Restful-Booker application.
 */
test.describe('Self-healing locator verification (temporary — delete after use)', () => {
  const logPath = path.resolve(process.cwd(), 'test-results', 'healing-log.jsonl');

  test.beforeEach(() => {
    // Clear any prior log so we can confirm exactly what THIS run wrote.
    if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
  });

  test('heals when the primary locator is broken, and logs the event', async ({ page }) => {
    await page.setContent('<a class="brand-link" href="/">Home</a>');

    const result = await resolveWithHealing(
      page,
      [
        { name: 'primary: broken selector', locate: (p) => p.locator('#does-not-exist') },
        { name: 'fallback: class selector', locate: (p) => p.locator('.brand-link') },
      ],
      { context: 'verification-test', timeoutPerStrategy: 500 }
    );

    expect(result.healed).toBe(true);
    expect(result.strategyUsed).toContain('fallback');
    await expect(result.locator).toHaveText('Home');

    // Confirm the heal was actually written to disk, not just returned in memory
    expect(fs.existsSync(logPath)).toBe(true);
    const logContent = fs.readFileSync(logPath, 'utf-8');
    expect(logContent).toContain('verification-test');
    expect(logContent).toContain('fallback: class selector');
  });

  test('does NOT heal, and does NOT log, when the primary locator already works', async ({ page }) => {
    await page.setContent('<a class="brand-link" href="/">Home</a>');

    const result = await resolveWithHealing(
      page,
      [{ name: 'primary: class selector', locate: (p) => p.locator('.brand-link') }],
      { context: 'verification-test-happy-path', timeoutPerStrategy: 500 }
    );

    expect(result.healed).toBe(false);
    // No heal occurred, so nothing should be written — proves it's not
    // logging noise on every run, only on actual drift.
    expect(fs.existsSync(logPath)).toBe(false);
  });

  test('throws a clear, readable error when ALL strategies fail', async ({ page }) => {
    await page.setContent('<div>no matching element here</div>');

    await expect(
      resolveWithHealing(
        page,
        [
          { name: 'primary: broken A', locate: (p) => p.locator('#nope-a') },
          { name: 'fallback: broken B', locate: (p) => p.locator('#nope-b') },
        ],
        { context: 'verification-test-total-failure', timeoutPerStrategy: 300 }
      )
    ).rejects.toThrow(/all 2 locator strategies failed/i);
  });
});