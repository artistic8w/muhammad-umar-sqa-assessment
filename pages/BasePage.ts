import { Page, Locator } from '@playwright/test';

/**
 * Shared parent for all Page Objects. Holds the Playwright `page` instance
 * and common helpers (navigation, explicit waits) so individual page classes
 * only need to define their own locators and workflows.
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Navigates to a given path/URL relative to the active project's baseURL. */
  async navigateTo(path: string) {
    await this.page.goto(path);
  }
  
  /** Waits for a locator to become visible before proceeding. */
  async waitForElement(locator: Locator) {
    await locator.waitFor({ state: 'visible' });
  }
}