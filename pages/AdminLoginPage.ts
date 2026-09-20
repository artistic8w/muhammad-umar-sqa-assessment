import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { resolveWithHealing } from '../utils/self-healing-locator.js';

export class AdminLoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly logoutButton: Locator;
  readonly errorMessage: Locator;
  readonly dashboardHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
    this.errorMessage = page.locator('.alert-danger');
    this.dashboardHeading = page.getByRole('link', { name: 'Restful Booker Platform Demo' });
  }

  async navigate() {
    const url = process.env.UI_BASE_URL;
    if (!url) {
      throw new Error('UI_BASE_URL is not defined in environment variables.');
    }
    await this.navigateTo(`${url}/admin`);
  }

  /**
   * Reads credentials directly from environment variables without exposing fallback values.
   */
  async login(
    username = process.env.UI_ADMIN_USERNAME,
    password = process.env.UI_ADMIN_PASSWORD
  ) {
    if (!username || !password) {
      throw new Error('UI_ADMIN_USERNAME or UI_ADMIN_PASSWORD is not defined in .env');
    }
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Self-healing variant of the post-login success check.
   * Demonstrates Tier 1 (deterministic, no AI) locator healing: if the
   * primary role-based locator ever stops matching (e.g. the link text
   * changes, or it's re-rendered as a <span> instead of an <a>), this falls
   * back through progressively looser strategies rather than failing outright.
   * Any fallback use is logged to test-results/healing-log.jsonl for review —
   * kept as an opt-in alternative to `dashboardHeading` rather than a
   * replacement, so the existing, already-passing assertion is untouched.
   */
  async getDashboardHeadingHealed(): Promise<Locator> {
    const { locator, healed, strategyUsed } = await resolveWithHealing(
      this.page,
      [
        {
          name: 'primary: role=link name="Restful Booker Platform Demo"',
          locate: (p) => p.getByRole('link', { name: 'Restful Booker Platform Demo' }),
        },
        {
          name: 'fallback: .navbar-brand class',
          locate: (p) => p.locator('.navbar-brand'),
        },
        {
          name: 'fallback: href="/" anchor',
          locate: (p) => p.locator('a[href="/"]'),
        },
      ],
      { context: 'AdminLoginPage.getDashboardHeadingHealed' }
    );

    if (healed) {
      console.warn(`Locator healed using strategy: ${strategyUsed}`);
    }
    return locator;
  }
}