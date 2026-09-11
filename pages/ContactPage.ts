import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export interface ContactFormPayload {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export class ContactPage extends BasePage {
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly subjectInput: Locator;
  readonly messageInput: Locator;
  readonly submitButton: Locator;
  //readonly successHeading: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = page.getByLabel('Name');
    this.emailInput = page.getByLabel('Email');
    this.phoneInput = page.getByLabel('Phone');
    this.subjectInput = page.getByLabel('Subject');
    this.messageInput = page.getByTestId('ContactDescription');
    this.submitButton = page.getByRole('button', { name: 'Submit' });
    //this.successHeading = page.getByRole('heading', { name: /Thanks for getting in touch/i, level: 3 });
    this.errorAlert = page.locator('.alert-danger');
  }

  async navigate() {
    const url = process.env.UI_BASE_URL;
    if (!url) {
      throw new Error('UI_BASE_URL is not defined in environment variables.');
    }
    await this.navigateTo(url);
  }

  /** Fills only the fields present in `data`, leaving others untouched — supports negative/partial-fill tests. */
  async fillContactForm(data: Partial<ContactFormPayload>) {
    if (data.name !== undefined) await this.nameInput.fill(data.name);
    if (data.email !== undefined) await this.emailInput.fill(data.email);
    if (data.phone !== undefined) await this.phoneInput.fill(data.phone);
    if (data.subject !== undefined) await this.subjectInput.fill(data.subject);
    if (data.message !== undefined) await this.messageInput.fill(data.message);
  }

  async submitForm() {
    await this.submitButton.click();
  }

  /**
   * Success heading includes the submitted name dynamically
   * (e.g. "Thanks for getting in touch Muhammad Umar!"), so this is a
   * factory method rather than a fixed locator — callers pass the exact
   * name they submitted to get an exact-match locator back.
   */
  successHeading(name: string): Locator {
    return this.page.getByRole('heading', {
      name: `Thanks for getting in touch ${name}!`,
      level: 3,
    });
  }
}