# MylesTechRepo
SwagLabs Testing
Playwright automation tests for [SauceDemo](https://www.saucedemo.com) login and core purchase flows.

## Tech Stack

- **Playwright** (`@playwright/test`) — browser automation & assertions
- **TypeScript** — type-safe test & page object code
- **Node.js** — runtime

## Test Coverage

### Login (`login.spec.ts`) — `@login` `@smoke`
- Empty credentials error
- Missing password error
- Invalid credentials error
- Locked-out user error
- Successful login with `standard_user`
- Successful login with all other valid users (`problem_user`, `performance_glitch_user`, `error_user`, `visual_user`)
- Logout and redirect back to login page

### Cart (`cart.spec.ts`) — `@cart` `@smoke`
- Cart badge updates when adding a single item
- Cart badge updates when adding multiple items
- Add-to-cart button changes to Remove after adding
- Cart badge decreases when removing item from inventory page
- Cart badge hides when all items are removed
- Remove item from cart page
- Empty cart after removing all items
- Cart items persist when navigating back to inventory
- Cart items persist after logout and re-login
- Continue Shopping navigates back to inventory
- Correct item names and prices displayed in cart

### Checkout (`checkout.spec.ts`) — `@checkout` `@e2e`
- End-to-end checkout with price validation (subtotal, tax, total)
- Order confirmation page displayed after completing checkout

## Structure

```
pages/
  LoginPage.ts          # Login page object + credential handling
  InventoryPage.ts      # Inventory/product listing actions & assertions
  CartPage.ts           # Cart page actions & assertions
  CheckoutPage.ts       # Checkout flow actions & price assertions
tests/
  login.spec.ts         # Login & logout test cases
  cart.spec.ts          # Add/remove/persist cart test cases
  checkout.spec.ts      # End-to-end checkout test cases
playwright.config.ts    # Playwright configuration (loads .env)
.env                    # Environment variables (credentials)
package.json            # Dependencies & scripts
```

## Environment Variables

Credentials are stored in a `.env` file and loaded via `dotenv` in the Playwright config. Test files reference them through `process.env` so that passwords are not hardcoded in the test source code.

> **Note:** In a real project the `.env` file would be added to `.gitignore` and never committed to the repository. It is included here intentionally so that reviewers can clone and run the tests immediately as part of this tech test.

## Browser Support

Tests run against three browsers (configured in `playwright.config.ts`):

- Chromium (Google Chrome channel)
- Firefox
- WebKit (Safari)


## Tests I Would Add If I Had More Time

- **Product sorting / filter options** — Select each sort option (Name A-Z, Name Z-A, Price low-high, Price high-low) and verify the product list re-orders correctly on the inventory page.
- **Multiple quantities per item** — Confirm a user can add more than one of every item in the shop and that the cart badge and cart page reflect the correct quantities.
- **Empty-cart checkout validation** — Attempt to check out with zero items in the cart and verify that appropriate error messaging prevents the user from proceeding.
- **Max-items checkout** — Add every available product to the cart (all 6 items), proceed through the full checkout flow, and confirm the order completes successfully with correct totals.
- **Checkout form validation** — Submit checkout with missing first name, last name, or postal code and verify error messages.
- **Cross-browser visual regression** — Capture screenshots across Chromium, Firefox and WebKit and compare for visual consistency.

## Run Locally

1. Install dependencies:

	```bash
	npm install
	```

2. Install Playwright browsers:

	```bash
	npx playwright install
	```

3. Run tests:

	```bash
	npm test
	```

4. Run tests in headed mode (visible browser):

    ```bash
    npx playwright test --headed
    ```

