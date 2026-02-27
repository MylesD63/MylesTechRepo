import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';


export class CartPage {
  readonly page: Page;
  readonly cartItems: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItems = page.locator('.cart_item');
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
    this.continueShoppingButton = page.getByRole('button', { name: 'Continue Shopping' });
  }

  // ── Actions ───────────────────────────────────────────────

  /** Click the Checkout button to proceed to checkout step one. */
  async startCheckout() {
    await this.checkoutButton.click();
    await this.assertCheckoutStepOnePage();
  }

  /** Click Continue Shopping to return to the inventory page. */
  async continueShopping() {
    await this.continueShoppingButton.click();
  }

  /** Click the Remove button for a specific item in the cart. */
  async removeItem(itemName: string) {
    await this.cartItems
      .filter({ hasText: itemName })
      .getByRole('button', { name: 'Remove' })
      .click();
  }

  /** Return the names and prices of all items currently in the cart. */
  async getCartItems() {
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

  // ── Assertions ────────────────────────────────────────────

  /** Assert the cart page is displayed. */
  async assertCartPage() {
    await expect(this.page).toHaveURL(/.*cart\.html/);
  }

  /** Assert we navigated to checkout step one. */
  async assertCheckoutStepOnePage() {
    await expect(this.page).toHaveURL(/.*checkout-step-one\.html/);
  }

  /** Assert a specific item is visible in the cart with the expected price. */
  async expectItemInCart(itemName: string, expectedPrice: string) {
    const item = this.cartItems.filter({ hasText: itemName });
    await expect(item).toBeVisible();
    await expect(item.getByText(expectedPrice)).toBeVisible();
  }
}
