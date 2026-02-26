import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object for the SauceDemo login page (/).
 *
 * Follows the Yoga Home POM pattern: all locators are readonly class
 * properties initialised in the constructor, with individual action
 * methods and a high-level orchestration method (loginAndVerify).
 */
export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByPlaceholder('Username');
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.locator('[data-test="error"]');
  }

  // ── Navigation ────────────────────────────────────────────

  /** Navigate to the login page and wait for the username field to be visible. */
  async goto() {
    await this.page.goto('/');
    await expect(this.usernameInput).toBeVisible();
  }

  // ── Actions ───────────────────────────────────────────────

  /** Fill the username field. */
  async fillUsername(username: string) {
    await this.usernameInput.fill(username);
  }

  /** Fill the password field. */
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  /** Click the Login button. */
  async clickLogin() {
    await this.loginButton.click();
  }

  /** Fill credentials and click Login. */
  async login(username: string, password: string) {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  /** Click Login without entering any credentials. */
  async submitEmpty() {
    await this.clickLogin();
  }

  /**
   * High-level orchestration: navigate, login, dismiss any popup, and verify success.
   * Mirrors the Yoga Home pattern of complete* methods that drive
   * an entire page flow from test data.
   */
  async loginAndVerify(username: string, password: string) {
    await this.goto();
    // Auto-accept any browser-native dialog (alert/confirm) that may appear
    this.page.on('dialog', (dialog) => dialog.accept());
    await this.login(username, password);
    await this.expectSuccessfulLogin();
  }

  // ── Assertions ────────────────────────────────────────────

  /** Assert we are on the login page. */
  async assertLoginPage() {
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /** Assert the error banner contains the given text. */
  async expectError(expectedText: string) {
    await expect(this.page.getByText(expectedText)).toBeVisible();
  }

  /** Assert that we have been redirected to the inventory page after login. */
  async expectSuccessfulLogin() {
    await expect(this.page).toHaveURL(/.*inventory\.html/);
  }
}
