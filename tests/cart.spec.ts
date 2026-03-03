import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import testData from '../test-data.json';

// ── Helpers: pull product info from the central JSON ────────
const products = testData.products;
const backpack = products.find(p => p.id === 'sauce-labs-backpack')!;
const bikeLight = products.find(p => p.id === 'sauce-labs-bike-light')!;
const boltTShirt = products.find(p => p.id === 'sauce-labs-bolt-t-shirt')!;
const fleeceJacket = products.find(p => p.id === 'sauce-labs-fleece-jacket')!;
const onesie = products.find(p => p.id === 'sauce-labs-onesie')!;

/** Format a number as a price string, e.g. 29.99 → "$29.99" */
const price = (amount: number) => `$${amount.toFixed(2)}`;

/** Calculate subtotal, tax, and total for the given product prices. */
function calcTotals(prices: number[]) {
  const subtotal = prices.reduce((sum, p) => sum + p, 0);
  const tax = Math.round(subtotal * testData.checkout.taxRate * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  return { subtotal: price(subtotal), tax: price(tax), total: price(total) };
}

const { username: USERNAME, password: PASSWORD } = testData.users.standard;
const customer = testData.checkout.customer;

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

    await loginPage.loginAndVerify(USERNAME, PASSWORD);
    await expect(page).toHaveURL(/.*inventory\.html/);
    await expect(inventoryPage.productsHeading).toBeVisible();
  });

  // ── Adding items ──────────────────────────────────────────

  test('should update cart badge when adding a single item', async () => {
    await inventoryPage.addItemToCart(backpack.name);
    await expect(inventoryPage.cartBadge).toHaveText('1');
  });

  test('should update cart badge when adding multiple items', async () => {
    await inventoryPage.addItemToCart(backpack.name);
    await inventoryPage.addItemToCart(bikeLight.name);
    await inventoryPage.addItemToCart(onesie.name);
    await expect(inventoryPage.cartBadge).toHaveText('3');
  });

  test('should change Add to cart button to Remove after adding', async () => {
    const card = inventoryPage.getProductCard(backpack.name);
    await expect(card.getByRole('button', { name: 'Add to cart' })).toBeVisible();

    await inventoryPage.addItemToCart(backpack.name);

    await expect(card.getByRole('button', { name: 'Remove' })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Add to cart' })).toHaveCount(0);
  });

  // ── Removing items from inventory page ────────────────────

  test('should decrease cart badge when removing item from inventory page', async () => {
    await inventoryPage.addItemToCart(backpack.name);
    await inventoryPage.addItemToCart(bikeLight.name);
    await expect(inventoryPage.cartBadge).toHaveText('2');

    await inventoryPage.removeItemFromCart(backpack.name);
    await expect(inventoryPage.cartBadge).toHaveText('1');
  });

  test('should hide cart badge when all items are removed from inventory page', async () => {
    await inventoryPage.addItemToCart(backpack.name);
    await expect(inventoryPage.cartBadge).toHaveText('1');

    await inventoryPage.removeItemFromCart(backpack.name);
    await expect(inventoryPage.cartBadge).toHaveCount(0);
  });

  // ── Removing items from cart page ─────────────────────────

  test('should remove item from cart page', async ({ page }) => {
    await inventoryPage.addItemToCart(backpack.name);
    await inventoryPage.addItemToCart(bikeLight.name);
    await inventoryPage.openCart();
    await expect(page).toHaveURL(/.*cart\.html/);

    await expect(cartPage.cartItems).toHaveCount(2);
    await cartPage.removeItem(backpack.name);
    await expect(cartPage.cartItems).toHaveCount(1);

    // Verify the correct item remains
    await expect(cartPage.cartItems.filter({ hasText: bikeLight.name })).toBeVisible();
    await expect(cartPage.cartItems.filter({ hasText: backpack.name })).toHaveCount(0);
  });

  test('should show empty cart after removing all items', async ({ page }) => {
    await inventoryPage.addItemToCart(onesie.name);
    await inventoryPage.openCart();
    await expect(page).toHaveURL(/.*cart\.html/);

    await expect(cartPage.cartItems).toHaveCount(1);
    await cartPage.removeItem(onesie.name);
    await expect(cartPage.cartItems).toHaveCount(0);
  });

  // ── Cart persistence ──────────────────────────────────────

  test('should persist cart items when navigating back to inventory', async ({ page }) => {
    await inventoryPage.addItemToCart(fleeceJacket.name);
    await inventoryPage.addItemToCart(boltTShirt.name);
    await inventoryPage.openCart();
    await expect(page).toHaveURL(/.*cart\.html/);

    // Go back to products
    await cartPage.continueShopping();
    await expect(page).toHaveURL(/.*inventory\.html/);
    await expect(inventoryPage.cartBadge).toHaveText('2');

    // Return to cart and verify items are still present
    await inventoryPage.openCart();
    await expect(cartPage.cartItems).toHaveCount(2);
    await expect(cartPage.cartItems.filter({ hasText: fleeceJacket.name })).toBeVisible();
    await expect(cartPage.cartItems.filter({ hasText: boltTShirt.name })).toBeVisible();
  });

  // ── Cart persistence across logout ─────────────────────────

  test('should persist cart items after logging out and back in', async ({ page }) => {
    await inventoryPage.addItemToCart(fleeceJacket.name);
    await inventoryPage.addItemToCart(bikeLight.name);
    await expect(inventoryPage.cartBadge).toHaveText('2');

    // Log out
    await inventoryPage.logout();
    const loginPage = new LoginPage(page);
    await expect(loginPage.usernameInput).toBeVisible();

    // Log back in
    await loginPage.login(USERNAME, PASSWORD);
    await expect(page).toHaveURL(/.*inventory\.html/);

    // Verify cart badge still shows 2 items
    await expect(inventoryPage.cartBadge).toHaveText('2');

    // Open cart and verify the correct items are still present
    await inventoryPage.openCart();
    await expect(cartPage.cartItems).toHaveCount(2);
    await cartPage.expectItemInCart(fleeceJacket.name, price(fleeceJacket.price));
    await cartPage.expectItemInCart(bikeLight.name, price(bikeLight.price));
  });

  // ── Continue Shopping navigation ──────────────────────────

  test('should navigate back to inventory via Continue Shopping', async ({ page }) => {
    await inventoryPage.addItemToCart(backpack.name);
    await inventoryPage.openCart();
    await expect(page).toHaveURL(/.*cart\.html/);

    await cartPage.continueShopping();
    await expect(page).toHaveURL(/.*inventory\.html/);
    await expect(inventoryPage.productsHeading).toBeVisible();
  });

  // ── Cart item details ─────────────────────────────────────

  test('should display correct item names and prices in cart', async ({ page }) => {
    await inventoryPage.addItemToCart(backpack.name);
    await inventoryPage.addItemToCart(onesie.name);
    await inventoryPage.openCart();
    await expect(page).toHaveURL(/.*cart\.html/);

    await cartPage.expectItemInCart(backpack.name, price(backpack.price));
    await cartPage.expectItemInCart(onesie.name, price(onesie.price));
  });

  // ── Checkout from cart ────────────────────────────────────

  test('should complete checkout from the cart', async ({ page }) => {
    // Add items and navigate to cart
    await inventoryPage.addItemToCart(backpack.name);
    await inventoryPage.addItemToCart(bikeLight.name);
    await expect(inventoryPage.cartBadge).toHaveText('2');
    await inventoryPage.openCart();
    await expect(page).toHaveURL(/.*cart\.html/);

    // Verify items are in the cart before checking out
    await expect(cartPage.cartItems).toHaveCount(2);
    await cartPage.expectItemInCart(backpack.name, price(backpack.price));
    await cartPage.expectItemInCart(bikeLight.name, price(bikeLight.price));

    // Start checkout and fill shipping info
    await cartPage.startCheckout();
    await expect(page).toHaveURL(/.*checkout-step-one\.html/);
    await checkoutPage.fillInfoAndContinue(customer.firstName, customer.lastName, customer.postalCode);

    // Verify checkout overview totals
    const totals = calcTotals([backpack.price, bikeLight.price]);
    await checkoutPage.expectSubtotal(totals.subtotal);
    await checkoutPage.expectTax(totals.tax);
    await checkoutPage.expectTotal(totals.total);

    // Finish checkout and verify confirmation
    await checkoutPage.finishCheckout();
    await expect(page).toHaveURL(/.*checkout-complete\.html/);
    await expect(page.getByText('Thank you for your order!')).toBeVisible();
  });
});
