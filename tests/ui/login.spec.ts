import { test, expect } from '@playwright/test';
import { AdminLoginPage } from '../../pages/AdminLoginPage.js';

test.describe('Section 3.3 — Admin Portal Login', () => {
  let loginPage: AdminLoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new AdminLoginPage(page);
    await loginPage.navigate();
  });

  test('3.3 Admin Login with valid credentials @smoke', async () => {
    await loginPage.login();

    // Assert successful authentication by checking Logout button visibility
    //await expect(loginPage.logoutButton).toBeVisible({ timeout: 10000 });
    await expect(loginPage.dashboardHeading).toBeVisible({ timeout: 10000 });
  });
});