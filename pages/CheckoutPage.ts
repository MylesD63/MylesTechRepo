import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';


export class CheckoutPage {
  readonly page: Page;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly cancelButton: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly cartItems: Locator;
  readonly confirmationHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameInput = page.getByPlaceholder('First Name');
    this.lastNameInput = page.getByPlaceholder('Last Name');
    this.postalCodeInput = page.getByPlaceholder('Zip/Postal Code');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.finishButton = page.getByRole('button', { name: 'Finish' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.subtotalLabel = page.locator('.summary_subtotal_label');
    this.taxLabel = page.locator('.summary_tax_label');
    this.totalLabel = page.locator('.summary_total_label');
    this.cartItems = page.locator('.cart_item');
    this.confirmationHeading = page.getByText('Thank you for your order!');
  }

  // ── Actions ───────────────────────────────────────────────

  /** Fill the first name field. */
  async fillFirstName(firstName: string) {
    await this.firstNameInput.fill(firstName);
  }

  /** Fill the last name field. */
  async fillLastName(lastName: string) {
    await this.lastNameInput.fill(lastName);
  }

  /** Fill the postal code field. */
  async fillPostalCode(postalCode: string) {
    await this.postalCodeInput.fill(postalCode);
  }

  /** Click the Continue button. */
  async clickContinue() {
    await this.continueButton.click();
  }

  /** Fill shipping information and continue to the overview step. */
  async fillInfoAndContinue(firstName: string, lastName: string, postalCode: string) {
    await this.fillFirstName(firstName);
    await this.fillLastName(lastName);
    await this.fillPostalCode(postalCode);
    await this.clickContinue();
    await this.assertCheckoutOverviewPage();
  }

  /** Click Finish and verify we land on the completion page. */
  async finishCheckout() {
    await this.finishButton.click();
    await this.assertCheckoutCompletePage();
    await expect(this.confirmationHeading).toBeVisible();
  }

  
  async completeCheckout(
    shippingInfo: { firstName: string; lastName: string; postalCode: string },
    expectedTotals?: { subtotal: string; tax: string; total: string },
  ) {
    await this.fillInfoAndContinue(shippingInfo.firstName, shippingInfo.lastName, shippingInfo.postalCode);

    if (expectedTotals) {
      await this.expectSubtotal(expectedTotals.subtotal);
      await this.expectTax(expectedTotals.tax);
      await this.expectTotal(expectedTotals.total);
    }

    await this.finishCheckout();
  }

  // ── Assertions ────────────────────────────────────────────

  /** Assert we are on the checkout step one page. */
  async assertCheckoutStepOnePage() {
    await expect(this.page).toHaveURL(/.*checkout-step-one\.html/);
  }

  /** Assert we are on the checkout overview page. */
  async assertCheckoutOverviewPage() {
    await expect(this.page).toHaveURL(/.*checkout-step-two\.html/);
  }

  /** Assert we are on the checkout complete page. */
  async assertCheckoutCompletePage() {
    await expect(this.page).toHaveURL(/.*checkout-complete\.html/);
  }

  /** Assert the subtotal text matches. */
  async expectSubtotal(expected: string) {
    await expect(this.page.getByText(`Item total: ${expected}`)).toBeVisible();
  }

  /** Assert the tax text matches. */
  async expectTax(expected: string) {
    await expect(this.page.getByText(`Tax: ${expected}`)).toBeVisible();
  }

  /** Assert the total text matches. */
  async expectTotal(expected: string) {
    await expect(this.page.getByText(`Total: ${expected}`)).toBeVisible();
  }

  /** Assert a specific item is visible on the checkout overview with the expected price. */
  async expectItemPrice(itemName: string, expectedPrice: string) {
    const item = this.cartItems.filter({ hasText: itemName });
    await expect(item.getByText(expectedPrice)).toBeVisible();
  }

  // ── Getters ───────────────────────────────────────────────

  /** Return the item-level subtotal text (e.g. "Item total: $39.98"). */
  async getSubtotalText() {
    return this.subtotalLabel.innerText();
  }

  /** Return the tax text (e.g. "Tax: $3.20"). */
  async getTaxText() {
    return this.taxLabel.innerText();
  }

  /** Return the total text (e.g. "Total: $43.18"). */
  async getTotalText() {
    return this.totalLabel.innerText();
  }

  /** Return the individual item prices shown on the checkout overview. */
  async getCheckoutItemPrices() {
    const count = await this.cartItems.count();
    const result: { name: string; price: string }[] = [];

    for (let i = 0; i < count; i++) {
      const item = this.cartItems.nth(i);
      const name = await item.locator('.inventory_item_name').innerText();
      const price = await item.locator('.inventory_item_price').innerText();
      result.push({ name, price });
    }

    return result;
  }
}
