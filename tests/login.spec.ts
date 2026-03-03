import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import testData from '../test-data.json';

const { username: USERNAME, password: PASSWORD } = testData.users.standard;

test.describe('Login Flow', {
  tag: ['@login', '@smoke'],
}, () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  // ── Negative scenarios ────────────────────────────────────

  test('should show error when submitting empty credentials', async ({ page }) => {
    await loginPage.submitEmpty();
    await expect(page.getByText(testData.errorMessages.emptyUsername)).toBeVisible();
  });

  test('should show error when password is missing', async ({ page }) => {
    await loginPage.fillUsername(USERNAME);
    await loginPage.clickLogin();
    await expect(page.getByText(testData.errorMessages.emptyPassword)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await loginPage.login(testData.invalidCredentials.username, testData.invalidCredentials.password);
    await expect(page.getByText(testData.errorMessages.invalidCredentials)).toBeVisible();
  });

  test('should show locked-out error for locked_out_user', async ({ page }) => {
    await loginPage.login(testData.users.locked.username, PASSWORD);
    await expect(page.getByText(testData.errorMessages.lockedOut)).toBeVisible();
  });

  // ── Positive scenarios ────────────────────────────────────

  test('should login successfully with standard_user', async ({ page }) => {
    await loginPage.login(USERNAME, PASSWORD);
    await expect(page).toHaveURL(/.*inventory\.html/);
  });

  // Validate that every non-locked valid user can also log in
  for (const userKey of ['problem', 'performanceGlitch', 'error', 'visual'] as const) {
    const user = testData.users[userKey];
    test(`should login successfully with ${user.username}`, async ({ page }) => {
      await loginPage.login(user.username, PASSWORD);
      await expect(page).toHaveURL(/.*inventory\.html/);
    });
  }

  // ── Logout ────────────────────────────────────────────────

  test('should logout and return to the login page', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);

    await loginPage.login(USERNAME, PASSWORD);
    await expect(page).toHaveURL(/.*inventory\.html/);

    await inventoryPage.logout();

    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });
});
