import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

test.describe('Cart Management', {
  tag: ['@cart', '@smoke'],
}, () => {
  let inventoryPage: InventoryPage;
  let cartPage: CartPage;
  let checkoutPage: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);
    cartPage = new CartPage(page);
    checkoutPage = new CheckoutPage(page);

    await loginPage.loginAndVerify(
      process.env.SAUCE_USERNAME!,
      process.env.SAUCE_PASSWORD!
    );
    await expect(page).toHaveURL(/.*inventory\.html/);
    await expect(inventoryPage.productsHeading).toBeVisible();
  });

  // ── Adding items ──────────────────────────────────────────

  test('should update cart badge when adding a single item', async () => {
    await inventoryPage.addItemToCart('Sauce Labs Backpack');
    await expect(inventoryPage.cartBadge).toHaveText('1');
  });

  test('should update cart badge when adding multiple items', async () => {
    await inventoryPage.addItemToCart('Sauce Labs Backpack');
    await inventoryPage.addItemToCart('Sauce Labs Bike Light');
    await inventoryPage.addItemToCart('Sauce Labs Onesie');
    await expect(inventoryPage.cartBadge).toHaveText('3');
  });

  test('should change Add to cart button to Remove after adding', async () => {
    const card = inventoryPage.getProductCard('Sauce Labs Backpack');
    await expect(card.getByRole('button', { name: 'Add to cart' })).toBeVisible();

    await inventoryPage.addItemToCart('Sauce Labs Backpack');

    await expect(card.getByRole('button', { name: 'Remove' })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Add to cart' })).toHaveCount(0);
  });

  // ── Removing items from inventory page ────────────────────

  test('should decrease cart badge when removing item from inventory page', async () => {
    await inventoryPage.addItemToCart('Sauce Labs Backpack');
    await inventoryPage.addItemToCart('Sauce Labs Bike Light');
    await expect(inventoryPage.cartBadge).toHaveText('2');

    await inventoryPage.removeItemFromCart('Sauce Labs Backpack');
    await expect(inventoryPage.cartBadge).toHaveText('1');
  });

  test('should hide cart badge when all items are removed from inventory page', async () => {
    await inventoryPage.addItemToCart('Sauce Labs Backpack');
    await expect(inventoryPage.cartBadge).toHaveText('1');

    await inventoryPage.removeItemFromCart('Sauce Labs Backpack');
    await expect(inventoryPage.cartBadge).toHaveCount(0);
  });

  // ── Removing items from cart page ─────────────────────────

  test('should remove item from cart page', async ({ page }) => {
    await inventoryPage.addItemToCart('Sauce Labs Backpack');
    await inventoryPage.addItemToCart('Sauce Labs Bike Light');
    await inventoryPage.openCart();
    await expect(page).toHaveURL(/.*cart\.html/);

    await expect(cartPage.cartItems).toHaveCount(2);
    await cartPage.removeItem('Sauce Labs Backpack');
    await expect(cartPage.cartItems).toHaveCount(1);

    // Verify the correct item remains
    await expect(cartPage.cartItems.filter({ hasText: 'Sauce Labs Bike Light' })).toBeVisible();
    await expect(cartPage.cartItems.filter({ hasText: 'Sauce Labs Backpack' })).toHaveCount(0);
  });

  test('should show empty cart after removing all items', async ({ page }) => {
    await inventoryPage.addItemToCart('Sauce Labs Onesie');
    await inventoryPage.openCart();
    await expect(page).toHaveURL(/.*cart\.html/);

    await expect(cartPage.cartItems).toHaveCount(1);
    await cartPage.removeItem('Sauce Labs Onesie');
    await expect(cartPage.cartItems).toHaveCount(0);
  });

  // ── Cart persistence ──────────────────────────────────────

  test('should persist cart items when navigating back to inventory', async ({ page }) => {
    await inventoryPage.addItemToCart('Sauce Labs Fleece Jacket');
    await inventoryPage.addItemToCart('Sauce Labs Bolt T-Shirt');
    await inventoryPage.openCart();
    await expect(page).toHaveURL(/.*cart\.html/);

    // Go back to products
    await cartPage.continueShopping();
    await expect(page).toHaveURL(/.*inventory\.html/);
    await expect(inventoryPage.cartBadge).toHaveText('2');

    // Return to cart and verify items are still present
    await inventoryPage.openCart();
    await expect(cartPage.cartItems).toHaveCount(2);
    await expect(cartPage.cartItems.filter({ hasText: 'Sauce Labs Fleece Jacket' })).toBeVisible();
    await expect(cartPage.cartItems.filter({ hasText: 'Sauce Labs Bolt T-Shirt' })).toBeVisible();
  });

  // ── Cart persistence across logout ─────────────────────────

  test('should persist cart items after logging out and back in', async ({ page }) => {
    await inventoryPage.addItemToCart('Sauce Labs Fleece Jacket');
    await inventoryPage.addItemToCart('Sauce Labs Bike Light');
    await expect(inventoryPage.cartBadge).toHaveText('2');

    // Log out
    await inventoryPage.logout();
    const loginPage = new LoginPage(page);
    await expect(loginPage.usernameInput).toBeVisible();

    // Log back in
    await loginPage.login(
      process.env.SAUCE_USERNAME!,
      process.env.SAUCE_PASSWORD!
    );
    await expect(page).toHaveURL(/.*inventory\.html/);

    // Verify cart badge still shows 2 items
    await expect(inventoryPage.cartBadge).toHaveText('2');

    // Open cart and verify the correct items are still present
    await inventoryPage.openCart();
    await expect(cartPage.cartItems).toHaveCount(2);
    await cartPage.expectItemInCart('Sauce Labs Fleece Jacket', '$49.99');
    await cartPage.expectItemInCart('Sauce Labs Bike Light', '$9.99');
  });

  // ── Continue Shopping navigation ──────────────────────────

  test('should navigate back to inventory via Continue Shopping', async ({ page }) => {
    await inventoryPage.addItemToCart('Sauce Labs Backpack');
    await inventoryPage.openCart();
    await expect(page).toHaveURL(/.*cart\.html/);

    await cartPage.continueShopping();
    await expect(page).toHaveURL(/.*inventory\.html/);
    await expect(inventoryPage.productsHeading).toBeVisible();
  });

  // ── Cart item details ─────────────────────────────────────

  test('should display correct item names and prices in cart', async ({ page }) => {
    await inventoryPage.addItemToCart('Sauce Labs Backpack');
    await inventoryPage.addItemToCart('Sauce Labs Onesie');
    await inventoryPage.openCart();
    await expect(page).toHaveURL(/.*cart\.html/);

    await cartPage.expectItemInCart('Sauce Labs Backpack', '$29.99');
    await cartPage.expectItemInCart('Sauce Labs Onesie', '$7.99');
  });

  // ── Checkout from cart ────────────────────────────────────

  test('should complete checkout from the cart', async ({ page }) => {
    // Add items and navigate to cart
    await inventoryPage.addItemToCart('Sauce Labs Backpack');
    await inventoryPage.addItemToCart('Sauce Labs Bike Light');
    await expect(inventoryPage.cartBadge).toHaveText('2');
    await inventoryPage.openCart();
    await expect(page).toHaveURL(/.*cart\.html/);

    // Verify items are in the cart before checking out
    await expect(cartPage.cartItems).toHaveCount(2);
    await cartPage.expectItemInCart('Sauce Labs Backpack', '$29.99');
    await cartPage.expectItemInCart('Sauce Labs Bike Light', '$9.99');

    // Start checkout and fill shipping info
    await cartPage.startCheckout();
    await expect(page).toHaveURL(/.*checkout-step-one\.html/);
    await checkoutPage.fillInfoAndContinue('QA', 'Engineer', '12345');

    // Verify checkout overview totals
    await checkoutPage.expectSubtotal('$39.98');
    await checkoutPage.expectTax('$3.20');
    await checkoutPage.expectTotal('$43.18');

    // Finish checkout and verify confirmation
    await checkoutPage.finishCheckout();
    await expect(page).toHaveURL(/.*checkout-complete\.html/);
    await expect(page.getByText('Thank you for your order!')).toBeVisible();
  });
});
