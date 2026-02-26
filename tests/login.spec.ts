import { test } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { InventoryPage } from './pages/InventoryPage';

const PASSWORD = 'secret_sauce';

test.describe('Login Flow', {
  tag: ['@login', '@smoke'],
}, () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.assertLoginPage();
  });

  // ── Negative scenarios ────────────────────────────────────

  test('should show error when submitting empty credentials', async () => {
    await loginPage.submitEmpty();
    await loginPage.expectError('Username is required');
  });

  test('should show error when password is missing', async () => {
    await loginPage.fillUsername('standard_user');
    await loginPage.clickLogin();
    await loginPage.expectError('Password is required');
  });

  test('should show error for invalid credentials', async () => {
    await loginPage.login('invalid_user', 'wrong_password');
    await loginPage.expectError('Username and password do not match any user in this service');
  });

  test('should show locked-out error for locked_out_user', async () => {
    await loginPage.login('locked_out_user', PASSWORD);
    await loginPage.expectError('Sorry, this user has been locked out');
  });

  // ── Positive scenarios ────────────────────────────────────

  test('should login successfully with standard_user', async () => {
    await loginPage.login('standard_user', PASSWORD);
    await loginPage.expectSuccessfulLogin();
  });

  // Validate that every non-locked valid user can also log in
  for (const username of ['problem_user', 'performance_glitch_user', 'error_user', 'visual_user']) {
    test(`should login successfully with ${username}`, async () => {
      await loginPage.login(username, PASSWORD);
      await loginPage.expectSuccessfulLogin();
    });
  }

  // ── Logout ────────────────────────────────────────────────

  test('should logout and return to the login page', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);

    await loginPage.login('standard_user', PASSWORD);
    await inventoryPage.expectOnInventoryPage();

    await inventoryPage.logout();

    await loginPage.assertLoginPage();
  });
});
