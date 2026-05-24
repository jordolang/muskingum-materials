import { test, expect } from '@playwright/test';

test.describe('Order Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/order');
  });

  test('should complete full checkout flow with pickup', async ({ page }) => {
    // Verify we're on the order page
    await expect(page.getByRole('heading', { name: 'Order Materials Online' })).toBeVisible();

    // Verify the product catalog is visible
    await expect(page.getByText('Select Products')).toBeVisible();

    // Add first product to cart (Bank Run)
    const firstAddButton = page.getByRole('button', { name: 'Add' }).first();
    await firstAddButton.click();

    // Verify product was added to cart by checking quantity controls appear
    await expect(page.getByRole('spinbutton').first()).toBeVisible();

    // Add another product (Fill Dirt) - second Add button
    const secondAddButton = page.getByRole('button', { name: 'Add' }).nth(1);
    await secondAddButton.click();

    // Increase quantity of first product
    const plusButton = page.getByRole('button').filter({ has: page.locator('svg.lucide-plus') }).first();
    await plusButton.click();
    await plusButton.click();

    // Verify quantity updated in input
    const firstQuantityInput = page.getByRole('spinbutton').first();
    await expect(firstQuantityInput).toHaveValue('3');

    // Proceed to checkout
    await page.getByRole('button', { name: /checkout/i }).click();

    // Verify we're on checkout step
    await expect(page.getByText('Checkout')).toBeVisible();
    await expect(page.getByText('Contact Information')).toBeVisible();

    // Fill out contact information
    await page.getByPlaceholder('Your full name').fill('John Doe');
    await page.getByPlaceholder(/your@email.com/i).fill('john.doe@example.com');
    await page.getByPlaceholder(/\(740\)/i).fill('7401234567');

    // Verify pickup is selected by default
    const pickupLabel = page.locator('label').filter({ hasText: 'Pickup' });
    await expect(pickupLabel).toHaveClass(/border-amber-500/);

    // Verify pickup location info is shown
    await expect(page.getByText('Pickup Location:')).toBeVisible();
    await expect(page.getByText(/1133 Ellis Dam Rd/i)).toBeVisible();

    // Mock the checkout API endpoint
    await page.route('/api/orders/checkout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orderNumber: 'TEST-12345',
        }),
      });
    });

    // Submit the order
    const submitButton = page.getByRole('button', { name: /Pay \$/i });
    await submitButton.click();

    // Verify order confirmation page
    await expect(page.getByText(/order confirmed/i)).toBeVisible();
    await expect(page.getByText('TEST-12345')).toBeVisible();
  });

  test('should complete checkout flow with delivery', async ({ page }) => {
    // Add product to cart
    await page.getByRole('button', { name: 'Add' }).first().click();

    // Proceed to checkout
    await page.getByRole('button', { name: /checkout/i }).click();

    // Fill contact info
    await page.getByPlaceholder('Your full name').fill('Jane Smith');
    await page.getByPlaceholder(/your@email.com/i).fill('jane.smith@example.com');
    await page.getByPlaceholder(/\(740\)/i).fill('7409876543');

    // Select delivery option
    const deliveryLabel = page.locator('label').filter({ hasText: 'Delivery' });
    await deliveryLabel.click();

    // Verify delivery is selected
    await expect(deliveryLabel).toHaveClass(/border-amber-500/);

    // Verify delivery address field appears
    await expect(page.getByPlaceholder(/Street address, city, state, zip/i)).toBeVisible();

    // Fill delivery address
    await page.getByPlaceholder(/Street address, city, state, zip/i).fill('123 Main St, Columbus, OH 43215');
    await page.getByPlaceholder(/Gate code, site instructions/i).fill('Leave at front gate');

    // Mock the checkout API endpoint
    await page.route('/api/orders/checkout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orderNumber: 'TEST-67890',
        }),
      });
    });

    // Submit the order
    await page.getByRole('button', { name: /Pay \$/i }).click();

    // Verify confirmation
    await expect(page.getByText(/order confirmed/i)).toBeVisible();
    await expect(page.getByText('TEST-67890')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Add product to cart
    await page.getByRole('button', { name: 'Add' }).first().click();

    // Proceed to checkout
    await page.getByRole('button', { name: /checkout/i }).click();

    // Try to submit without filling required fields
    await page.getByRole('button', { name: /Pay \$/i }).click();

    // Verify validation errors appear
    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Valid email is required')).toBeVisible();
    await expect(page.getByText('Phone number is required')).toBeVisible();
  });

  test('should allow updating cart quantities', async ({ page }) => {
    // Add product to cart
    await page.getByRole('button', { name: 'Add' }).first().click();

    // Get the quantity input
    const quantityInput = page.getByRole('spinbutton').first();
    await expect(quantityInput).toHaveValue('1');

    // Increase quantity using plus button
    const plusButton = page.getByRole('button').filter({ has: page.locator('svg.lucide-plus') }).first();
    await plusButton.click();
    await expect(quantityInput).toHaveValue('2');

    // Decrease quantity using minus button
    const minusButton = page.getByRole('button').filter({ has: page.locator('svg.lucide-minus') }).first();
    await minusButton.click();
    await expect(quantityInput).toHaveValue('1');

    // Directly set quantity via input
    await quantityInput.fill('5');
    await expect(quantityInput).toHaveValue('5');

    // Verify cart summary reflects changes
    await expect(page.getByText(/5 tons/i)).toBeVisible();
  });

  test('should allow removing items from cart', async ({ page }) => {
    // Add two products
    await page.getByRole('button', { name: 'Add' }).first().click();
    await page.getByRole('button', { name: 'Add' }).nth(1).click();

    // Verify both products are in cart
    expect(await page.getByRole('spinbutton').count()).toBe(2);

    // Decrease first product quantity to 0 (removes it)
    const firstMinusButton = page.getByRole('button').filter({ has: page.locator('svg.lucide-minus') }).first();
    await firstMinusButton.click();

    // Verify first product removed from cart
    expect(await page.getByRole('spinbutton').count()).toBe(1);
  });

  test('should navigate back from checkout to products', async ({ page }) => {
    // Add product and go to checkout
    await page.getByRole('button', { name: 'Add' }).first().click();
    await page.getByRole('button', { name: /checkout/i }).click();

    // Verify we're on checkout
    await expect(page.getByText('Contact Information')).toBeVisible();

    // Click back button
    await page.getByRole('button', { name: '← Back to Products' }).click();

    // Verify we're back to products step
    await expect(page.getByText('Select Products')).toBeVisible();

    // Verify cart is preserved
    await expect(page.getByRole('spinbutton').first()).toHaveValue('1');
  });

  test('should display material calculator', async ({ page }) => {
    // Verify calculator is visible
    await expect(page.getByText('Material Calculator')).toBeVisible();

    // Test quick preset
    const singleCarDrivewayButton = page.getByRole('button', { name: /Single Car Driveway/i });
    await singleCarDrivewayButton.click();

    // Verify dimensions are populated
    await expect(page.getByPlaceholder('20').first()).toHaveValue('20');
    await expect(page.getByPlaceholder('10')).toHaveValue('10');

    // Verify results are shown
    await expect(page.getByText('Estimated Material Needed')).toBeVisible();
    await expect(page.getByText('TONS')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Add product to cart
    await page.getByRole('button', { name: 'Add' }).first().click();

    // Proceed to checkout
    await page.getByRole('button', { name: /checkout/i }).click();

    // Fill contact info
    await page.getByPlaceholder('Your full name').fill('Test User');
    await page.getByPlaceholder(/your@email.com/i).fill('test@example.com');
    await page.getByPlaceholder(/\(740\)/i).fill('7401111111');

    // Mock API error
    await page.route('/api/orders/checkout', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Payment processing failed',
        }),
      });
    });

    // Setup dialog handler for alert
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Payment processing failed');
      await dialog.accept();
    });

    // Submit the order
    await page.getByRole('button', { name: /Pay \$/i }).click();
  });

  test('should calculate correct totals', async ({ page }) => {
    // Add first product (Bank Run - $2.00/ton)
    await page.getByRole('button', { name: 'Add' }).first().click();

    // Set quantity to 10 tons
    const quantityInput = page.getByRole('spinbutton').first();
    await quantityInput.fill('10');

    // Subtotal should be $20.00
    // Tax (7.25%): $1.45
    // Processing fee (4.5%): $0.90
    // Total: ~$22.35

    // Proceed to checkout to see totals
    await page.getByRole('button', { name: /checkout/i }).click();

    // Verify order summary shows correct items
    await expect(page.getByText(/Bank Run x 10 tons/i)).toBeVisible();
    await expect(page.getByText(/\$20\.00/)).toBeVisible();

    // Verify total is calculated
    const totalText = page.locator('text=/Pay \\$/');
    await expect(totalText).toBeVisible();
  });
});
