import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Represents a single product entry on the inventory page.
 */
export interface Product {
  name: string;
  description: string;
  price: string;
}


export class InventoryPage {
  readonly page: Page;
  readonly productsHeading: Locator;
  readonly productItems: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;
  readonly menuButton: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productsHeading = page.getByText('Products');
    this.productItems = page.locator('.inventory_item');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartLink = page.locator('.shopping_cart_link');
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
    this.logoutLink = page.getByText('Logout');
  }

  // ── Actions ───────────────────────────────────────────────

  /** Click the "Add to cart" button for a product identified by its display name. */
  async addItemToCart(itemName: string) {
    await this.productItems
      .filter({ hasText: itemName })
      .getByRole('button', { name: 'Add to cart' })
      .click();
  }

  /** Click the "Remove" button for a product identified by its display name. */
  async removeItemFromCart(itemName: string) {
    await this.productItems
      .filter({ hasText: itemName })
      .getByRole('button', { name: 'Remove' })
      .click();
  }

  /** Add multiple items to the cart in one go. */
  async addItemsToCart(itemNames: string[]) {
    for (const name of itemNames) {
      await this.addItemToCart(name);
    }
  }

  /** Open the shopping cart. */
  async openCart() {
    await this.cartLink.click();
  }

  /** Perform logout via the hamburger menu. */
  async logout() {
    await this.menuButton.click();
    await this.logoutLink.click();
  }

  /** Return an array of all visible products with their names, descriptions & prices. */
  async getAllProducts(): Promise<Product[]> {
    const count = await this.productItems.count();
    const products: Product[] = [];

    for (let i = 0; i < count; i++) {
      const item = this.productItems.nth(i);
      const name = await item.locator('.inventory_item_name').innerText();
      const description = await item.locator('.inventory_item_desc').innerText();
      const price = await item.locator('.inventory_item_price').innerText();
      products.push({ name, description, price });
    }

    return products;
  }

  /** Get the locator for a specific product card by name. */
  getProductCard(productName: string): Locator {
    return this.productItems.filter({ hasText: productName });
  }

  // ── Assertions ────────────────────────────────────────────

  /** Assert we are on the inventory page with the "Products" title. */
  async expectOnInventoryPage() {
    await expect(this.page).toHaveURL(/.*inventory\.html/);
    await expect(this.productsHeading).toBeVisible();
  }

  /** Assert the total number of products displayed on the page. */
  async expectProductCount(expected: number) {
    await expect(this.productItems).toHaveCount(expected);
  }

  /** Assert the shopping cart badge shows the given count. */
  async expectCartCount(count: number) {
    if (count === 0) {
      await expect(this.cartBadge).toHaveCount(0);
      return;
    }
    await expect(this.cartBadge).toHaveText(String(count));
  }

  /** Assert a product card shows a specific name and price. */
  async expectProductNameAndPrice(productName: string, expectedPrice: string) {
    const card = this.getProductCard(productName);
    await expect(card).toBeVisible();
    await expect(card.getByText(expectedPrice)).toBeVisible();
  }

  /** Assert a product card contains a description substring. */
  async expectProductDescription(productName: string, descriptionSubstring: string) {
    const card = this.getProductCard(productName);
    await expect(card).toContainText(descriptionSubstring);
  }
}
