import { test, expect } from '@playwright/test';
import { ContactPage } from '../../pages/ContactPage.js';
import { getValidContactFormData } from '../../utils/test-data.js';

test.describe('Section 3.1 & 3.2 — Contact Form Tests', () => {
  let contactPage: ContactPage;

  test.beforeEach(async ({ page }) => {
    contactPage = new ContactPage(page);
    await contactPage.navigate();
  });

  test('3.1 Contact Form — Happy Path @smoke', async () => {
    const contactData = getValidContactFormData();
    await contactPage.fillContactForm(contactData);
    await contactPage.submitForm();

    // Verify success confirmation message appears
    await expect(contactPage.successHeading(contactData.name)).toBeVisible({ timeout: 10000 });
    // Verify success confirmation message appears with the correct name interpolated
//     await expect(contactPage.successHeading).toHaveText(
//     `Thanks for getting in touch ${contactData.name}!`
//   );

  });

  test('3.2 Contact Form — Validation Errors @regression', async () => {
    // Leave mandatory fields blank and submit
    await contactPage.submitForm();

    // Verify validation alert appears containing error messages
    await expect(contactPage.errorAlert).toBeVisible();
    await expect(contactPage.errorAlert).toContainText(/may not be blank/i);
    //for stronger coverage 
    await expect(contactPage.errorAlert).toContainText('Name may not be blank');
    await expect(contactPage.errorAlert).toContainText('Email may not be blank');
    await expect(contactPage.errorAlert).toContainText('Phone may not be blank');
    await expect(contactPage.errorAlert).toContainText('Message may not be blank');
    await expect(contactPage.errorAlert).toContainText('Subject may not be blank');
  });
});