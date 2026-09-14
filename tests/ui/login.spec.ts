import { test, expect } from '@playwright/test';
import { AdminLoginPage } from '../../pages/AdminLoginPage.js';

test.describe('Section 3.3 — Admin Portal Login', () => {
  let loginPage: AdminLoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new AdminLoginPage(page);
    await loginPage.navigate();
  });

  test('3.3 Admin Login with valid credentials', { tag: '@smoke' }, async () => {
    await loginPage.login();

    // Assert successful authentication by checking navbar brand link
    // visibility (present on the dashboard, absent on the pre-login screen)
    await expect(loginPage.dashboardHeading).toBeVisible({ timeout: 10000 });
  });
});