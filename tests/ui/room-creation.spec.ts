import { test, expect } from '@playwright/test';
import { AdminLoginPage } from '../../pages/AdminLoginPage.js';
import { AdminDashboardPage } from '../../pages/AdminDashboardPage.js';
import { getRandomRoomDetails } from '../../utils/test-data.js';

test.describe('Section 3.4 — Custom UI Scenario (Room Creation Workflow)', () => {
  /**
   * REASONING FOR CHOOSING THIS SCENARIO:
   * Creating a room in the Admin Portal is a core business workflow.
   * Testing room creation ensures that authenticated admin actions successfully 
   * mutate state and render newly generated entries in the dashboard grid.
   */
  test('3.4 Admin can create a new room in the dashboard @regression', async ({ page }) => {
    const loginPage = new AdminLoginPage(page);
    const dashboardPage = new AdminDashboardPage(page);

    // Navigate & Log in
    await loginPage.navigate();
    await loginPage.login();
    await expect(loginPage.logoutButton).toBeVisible();

    // Generate room data and create room via Page Object
    const roomData = getRandomRoomDetails();
    await dashboardPage.createRoom(roomData);

    // Assert newly created room appears in the dashboard grid
    const createdRoom = dashboardPage.getRoomLocator(roomData.roomName);
    await expect(createdRoom).toBeVisible({ timeout: 10000 });
  });
});