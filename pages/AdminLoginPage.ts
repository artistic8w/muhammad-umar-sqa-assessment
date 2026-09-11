import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

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
}