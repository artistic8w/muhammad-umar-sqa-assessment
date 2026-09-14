import { test, expect } from '@playwright/test';
import { AdminLoginPage } from '../../pages/AdminLoginPage.js';
import { AdminDashboardPage } from '../../pages/AdminDashboardPage.js';
import { getRandomRoomDetails } from '../../utils/test-data.js';

test.describe('Section 3.4 — Custom UI Scenario (Room Creation Workflow)', () => {
  /**
   * REASONING FOR CHOOSING THIS SCENARIO:
   * Directly targets Risk 5 ("Cross-Layer Data Desynchronization") from
   * TEST-PLAN.md Section 1.2 — this test verifies that a room created via
   * the Admin UI is correctly reflected back in that same UI's dashboard
   * grid, rather than assuming a successful form submission implies the
   * state actually persisted and rendered correctly.
   * Room names are randomized per run (getRandomRoomDetails()) specifically
   * to avoid colliding with BUG-004 (duplicate room numbers accepted),
   * which would otherwise make this assertion flaky.
   */
  test('3.4 Admin can create a new room in the dashboard', { tag: '@regression' }, async ({ page }) => {
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
    await expect(
      createdRoom,
      'Expected exactly one room with this name. If this fails with more than one match, ' +
      'BUG-004 (duplicate room numbers accepted) has likely been triggered by a room-name collision.'
    ).toHaveCount(1);
    await expect(createdRoom).toBeVisible({ timeout: 10000 });

  });
});