import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

const USERNAME = process.env.SAUCE_USERNAME!;
const PASSWORD = process.env.SAUCE_PASSWORD!;

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
    await expect(page.getByText('Username is required')).toBeVisible();
  });

  test('should show error when password is missing', async ({ page }) => {
    await loginPage.fillUsername(USERNAME);
    await loginPage.clickLogin();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await loginPage.login('invalid_user', 'wrong_password');
    await expect(page.getByText('Username and password do not match any user in this service')).toBeVisible();
  });

  test('should show locked-out error for locked_out_user', async ({ page }) => {
    await loginPage.login('locked_out_user', PASSWORD);
    await expect(page.getByText('Sorry, this user has been locked out')).toBeVisible();
  });

  // ── Positive scenarios ────────────────────────────────────

  test('should login successfully with standard_user', async ({ page }) => {
    await loginPage.login(USERNAME, PASSWORD);
    await expect(page).toHaveURL(/.*inventory\.html/);
  });

  // Validate that every non-locked valid user can also log in
  for (const username of ['problem_user', 'performance_glitch_user', 'error_user', 'visual_user']) {
    test(`should login successfully with ${username}`, async ({ page }) => {
      await loginPage.login(username, PASSWORD);
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
