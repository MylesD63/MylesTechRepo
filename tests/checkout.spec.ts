import { test } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { InventoryPage } from './pages/InventoryPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';

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
    await loginPage.loginAndVerify('standard_user', 'secret_sauce');
    await inventoryPage.expectOnInventoryPage();
  });

  test('should show correct prices through the entire checkout flow', async () => {
    // Add Backpack and Bike Light to the cart
    await inventoryPage.addItemToCart('Sauce Labs Backpack');
    await inventoryPage.addItemToCart('Sauce Labs Bike Light');
    await inventoryPage.expectCartCount(2);

    // Open cart and verify items with prices
    await inventoryPage.openCart();
    await cartPage.expectItemInCart('Sauce Labs Backpack', '$29.99');
    await cartPage.expectItemInCart('Sauce Labs Bike Light', '$9.99');

    // Proceed to checkout and fill shipping info
    await cartPage.startCheckout();
    await checkoutPage.fillInfoAndContinue('QA', 'Engineer', '12345');

    // Verify item prices on checkout overview
    await checkoutPage.expectItemPrice('Sauce Labs Backpack', '$29.99');
    await checkoutPage.expectItemPrice('Sauce Labs Bike Light', '$9.99');

    // Verify subtotal, tax, and total
    await checkoutPage.expectSubtotal('$39.98');
    await checkoutPage.expectTax('$3.20');
    await checkoutPage.expectTotal('$43.18');

    // Finish checkout and verify confirmation
    await checkoutPage.finishCheckout();
  });
});
