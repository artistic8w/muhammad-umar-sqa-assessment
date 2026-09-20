# Self-Healing Locator Strategy

This project implements a **two-tier** self-healing approach. Tier 1 is implemented and in use (`utils/self-healing-locator.ts`). Tier 2 is a deliberate design proposal, not implemented — reasoning below.

---

## Tier 1: Deterministic Fallback Locators (Implemented)

`resolveWithHealing()` tries a prioritized list of locator strategies against the page. The first strategy is the "primary" — what a developer originally wrote and expects to work. If it fails, subsequent strategies are tried in order.

**Key properties:**
- **Fully deterministic** — no external calls, no network dependency, no added cost or latency beyond normal locator timeouts.
- **Never silent.** Any time a non-primary strategy resolves the element, it's logged to console *and* appended to `test-results/healing-log.jsonl` with a timestamp, context, and which strategies failed. A test that "heals" still shows up for human review — it doesn't just quietly keep passing forever while drifting further from the original intent.
- **Example usage:** see `AdminLoginPage.getDashboardHeadingHealed()`.

**When to use it:** for locators built on attributes that legitimately shift for cosmetic reasons — a CSS class rename, a wrapper element added around a button — where a text- or role-based primary strategy plus a couple of structural fallbacks meaningfully reduces false-fail maintenance burden.

**When NOT to use it:** as a blanket replacement for good locator hygiene (`data-testid`, `getByRole`) everywhere. Fallback chains add complexity — they should be reserved for elements with a documented history of instability, not applied by default across the whole page-object layer.

---

## Tier 2: AI-Assisted Healing (Proposed, Not Implemented)

**The idea:** when *all* Tier 1 strategies are exhausted, capture the page's accessibility tree or a trimmed DOM snippet, send it to an LLM with a description of the target element ("the primary admin login submit button"), and ask it to propose a new selector.

### Sketch of the approach

```typescript
// utils/ai-locator-healer.ts (proposed, not implemented)
import Anthropic from '@anthropic-ai/sdk';
import { Page, Locator } from '@playwright/test';

interface AiHealResult {
  suggestedSelector: string;
  confidence: 'high' | 'low';
}

async function aiSuggestSelector(
  page: Page,
  elementDescription: string,
  lastKnownGoodSelector: string
): Promise<AiHealResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const snapshot = await page.accessibility.snapshot();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `A Playwright locator broke. Element: "${elementDescription}".
Last known selector: "${lastKnownGoodSelector}".
Current accessibility tree: ${JSON.stringify(snapshot)}
Return ONLY a JSON object: {"selector": "<css or role-based selector>", "confidence": "high"|"low"}`,
    }],
  });

  // Parse and return — real implementation needs strict JSON validation here.
  return parseAiResponse(response);
}
```

### Why this is a design doc and not a merged feature

1. **A test suite that can silently rewrite its own assertions is a liability, not just a convenience.** If an element's actual purpose changed (e.g. a "Delete" button got relabeled "Archive" with different behavior), an AI healer optimizing for "find something that looks similar" could paper over a genuine regression instead of catching it. Tier 1 avoids this because it only tries selectors a human already wrote and approved; Tier 2 invents new ones at runtime.
2. **Non-determinism in a test suite is expensive.** An LLM call can return a different answer on different runs, turning a previously reliable test into an intermittently flaky one — exactly what a test suite exists to prevent.
3. **Cost and external dependency.** Every heal event becomes a paid API call with real network latency, in CI, on every affected run, against a third-party service outside your control.
4. **Requires a human-review gate to be safe.** Even in a mature implementation, an AI-suggested selector should never be silently written back into source and trusted going forward — it needs a "proposed healing" queue (e.g. a PR comment, a Slack alert, a dashboard) that a human explicitly approves before it's promoted to a real, permanent locator strategy.

### If this were built for real

- AI healing fires **only** after all Tier 1 strategies are exhausted (last resort, not first).
- The AI never influences pass/fail directly — a healed run still gets flagged in the report; it's a recovery mechanism for locating the element, not a license to assert silently.
- Suggested selectors are **cached, not re-requested every run** — write the healed selector to a `locator-overrides.json` file after first use, and only call the AI again if that cached selector also breaks.
- Every AI heal requires a follow-up human-reviewed commit adding the new strategy as an explicit Tier 1 fallback — Tier 2 exists to keep the suite running *today* while a person fixes the root cause, not to become the permanent solution.

---

## Summary

| | Tier 1 (implemented) | Tier 2 (proposed) |
|---|---|---|
| Cost | Free | Per-call API cost |
| Determinism | Fully deterministic | Non-deterministic |
| Speed | Milliseconds | Seconds (network round-trip) |
| Risk of masking real bugs | Low (only pre-approved selectors) | Real, requires guardrails |
| Status | ✅ Implemented, sanity-tested | 📋 Documented design only |