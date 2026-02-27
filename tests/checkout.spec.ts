import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

test.describe('End-to-End Checkout with Price Validation', {
  tag: ['@checkout', '@e2e'],
}, () => {
  let inventoryPage: InventoryPage;
  let cartPage: CartPage;
  let checkoutPage: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);
    cartPage = new CartPage(page);
    checkoutPage = new CheckoutPage(page);

    // Login and verify we land on the inventory page
    await loginPage.loginAndVerify(
      process.env.SAUCE_USERNAME!,
      process.env.SAUCE_PASSWORD!
    );
    await expect(page).toHaveURL(/.*inventory\.html/);
  });

  test('should show correct prices through the entire checkout flow', async ({ page }) => {
    // Add Backpack and Bike Light to the cart
    await inventoryPage.addItemToCart('Sauce Labs Backpack');
    await inventoryPage.addItemToCart('Sauce Labs Bike Light');
    await expect(inventoryPage.cartBadge).toHaveText('2');

    // Open cart and verify items with prices
    await inventoryPage.openCart();
    await expect(page).toHaveURL(/.*cart\.html/);

    const backpackRow = cartPage.cartItems.filter({ hasText: 'Sauce Labs Backpack' });
    await expect(backpackRow).toBeVisible();
    await expect(backpackRow.getByText('$29.99')).toBeVisible();

    const bikeLightRow = cartPage.cartItems.filter({ hasText: 'Sauce Labs Bike Light' });
    await expect(bikeLightRow).toBeVisible();
    await expect(bikeLightRow.getByText('$9.99')).toBeVisible();

    // Proceed to checkout and fill shipping info
    await cartPage.startCheckout();
    await checkoutPage.fillInfoAndContinue('QA', 'Engineer', '12345');
    await expect(page).toHaveURL(/.*checkout-step-two\.html/);

    // Verify item prices on checkout overview
    await expect(checkoutPage.cartItems.filter({ hasText: 'Sauce Labs Backpack' }).getByText('$29.99')).toBeVisible();
    await expect(checkoutPage.cartItems.filter({ hasText: 'Sauce Labs Bike Light' }).getByText('$9.99')).toBeVisible();

    // Verify subtotal, tax, and total
    await expect(page.getByText('Item total: $39.98')).toBeVisible();
    await expect(page.getByText('Tax: $3.20')).toBeVisible();
    await expect(page.getByText('Total: $43.18')).toBeVisible();

    // Finish checkout and verify confirmation
    await checkoutPage.finishCheckout();
    await expect(page).toHaveURL(/.*checkout-complete\.html/);
    await expect(page.getByText('Thank you for your order!')).toBeVisible();
  });
});
