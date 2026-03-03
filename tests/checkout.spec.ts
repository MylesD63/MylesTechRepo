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
    await loginPage.loginAndVerify(USERNAME, PASSWORD);
    await expect(page).toHaveURL(/.*inventory\.html/);
  });

  test('should show correct prices through the entire checkout flow', async ({ page }) => {
    // Add Backpack and Bike Light to the cart
    await inventoryPage.addItemToCart(backpack.name);
    await inventoryPage.addItemToCart(bikeLight.name);
    await expect(inventoryPage.cartBadge).toHaveText('2');

    // Open cart and verify items with prices
    await inventoryPage.openCart();
    await expect(page).toHaveURL(/.*cart\.html/);

    const backpackRow = cartPage.cartItems.filter({ hasText: backpack.name });
    await expect(backpackRow).toBeVisible();
    await expect(backpackRow.getByText(price(backpack.price))).toBeVisible();

    const bikeLightRow = cartPage.cartItems.filter({ hasText: bikeLight.name });
    await expect(bikeLightRow).toBeVisible();
    await expect(bikeLightRow.getByText(price(bikeLight.price))).toBeVisible();

    // Proceed to checkout and fill shipping info
    await cartPage.startCheckout();
    await checkoutPage.fillInfoAndContinue(customer.firstName, customer.lastName, customer.postalCode);
    await expect(page).toHaveURL(/.*checkout-step-two\.html/);

    // Verify item prices on checkout overview
    await expect(checkoutPage.cartItems.filter({ hasText: backpack.name }).getByText(price(backpack.price))).toBeVisible();
    await expect(checkoutPage.cartItems.filter({ hasText: bikeLight.name }).getByText(price(bikeLight.price))).toBeVisible();

    // Verify subtotal, tax, and total
    const totals = calcTotals([backpack.price, bikeLight.price]);
    await expect(page.getByText(`Item total: ${totals.subtotal}`)).toBeVisible();
    await expect(page.getByText(`Tax: ${totals.tax}`)).toBeVisible();
    await expect(page.getByText(`Total: ${totals.total}`)).toBeVisible();

    // Finish checkout and verify confirmation
    await checkoutPage.finishCheckout();
    await expect(page).toHaveURL(/.*checkout-complete\.html/);
    await expect(page.getByText('Thank you for your order!')).toBeVisible();
  });
});
