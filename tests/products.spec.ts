import { test } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { InventoryPage } from './pages/InventoryPage';

test.describe('Product Page', {
  tag: ['@products', '@smoke'],
}, () => {
  let inventoryPage: InventoryPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);

    await loginPage.loginAndVerify('standard_user', 'secret_sauce');
    await inventoryPage.expectOnInventoryPage();
  });

  test('should display exactly 6 products', async () => {
    await inventoryPage.expectProductCount(6);
  });

  test('should display the correct name and price for every product', async () => {
    await inventoryPage.expectProductNameAndPrice('Sauce Labs Backpack', '$29.99');
    await inventoryPage.expectProductNameAndPrice('Sauce Labs Bike Light', '$9.99');
    await inventoryPage.expectProductNameAndPrice('Sauce Labs Bolt T-Shirt', '$15.99');
    await inventoryPage.expectProductNameAndPrice('Sauce Labs Fleece Jacket', '$49.99');
    await inventoryPage.expectProductNameAndPrice('Sauce Labs Onesie', '$7.99');
    await inventoryPage.expectProductNameAndPrice('Test.allTheThings() T-Shirt (Red)', '$15.99');
  });

  test('should display the correct description for every product', async () => {
    await inventoryPage.expectProductDescription('Sauce Labs Backpack', 'carry.allTheThings() with the sleek, streamlined Sly Pack');
    await inventoryPage.expectProductDescription('Sauce Labs Bike Light', "A red light isn't the desired state in testing but it sure helps when riding your bike at night");
    await inventoryPage.expectProductDescription('Sauce Labs Bolt T-Shirt', 'Get your testing superhero on with the Sauce Labs bolt T-shirt');
    await inventoryPage.expectProductDescription('Sauce Labs Fleece Jacket', 'midweight quarter-zip fleece jacket capable of handling everything');
    await inventoryPage.expectProductDescription('Sauce Labs Onesie', 'Rib snap infant onesie for the junior automation engineer in development');
    await inventoryPage.expectProductDescription('Test.allTheThings() T-Shirt (Red)', 'This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard');
  });
});
