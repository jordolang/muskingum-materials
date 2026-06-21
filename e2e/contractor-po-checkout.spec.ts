import { test, expect } from '@playwright/test';

test.describe('Contractor Purchase Order Checkout Flow', () => {
  // Mock contractor user authentication state
  test.beforeEach(async ({ page, context }) => {
    // Set up authentication cookies/state for contractor user
    await context.addCookies([
      {
        name: '__session',
        value: 'mock_contractor_session_token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    // Mock the user profile API to return contractor with net terms approved
    await page.route('/api/account/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'contractor-123',
            email: 'contractor@example.com',
            name: 'Test Contractor LLC',
            role: 'contractor',
            netTermsApproved: true,
            netTermsLimit: 10000,
            netTermsDays: 30,
          },
        }),
      });
    });

    await page.goto('/order');
  });

  test('should complete purchase order checkout flow', async ({ page }) => {
    // Verify we're on the order page
    await expect(page.getByRole('heading', { name: 'Order Materials Online' })).toBeVisible();

    // Add products to cart
    const firstAddButton = page.getByRole('button', { name: 'Add' }).first();
    await firstAddButton.click();

    // Verify product was added to cart
    await expect(page.getByRole('spinbutton').first()).toBeVisible();

    // Add more quantity
    const plusButton = page.getByRole('button').filter({ has: page.locator('svg.lucide-plus') }).first();
    await plusButton.click();
    await plusButton.click();

    // Verify quantity is 3
    const quantityInput = page.getByRole('spinbutton').first();
    await expect(quantityInput).toHaveValue('3');

    // Proceed to checkout
    await page.getByRole('button', { name: /checkout/i }).click();

    // Verify we're on checkout step
    await expect(page.getByText('Checkout')).toBeVisible();
    await expect(page.getByText('Contact Information')).toBeVisible();

    // Fill out contact information
    await page.getByPlaceholder('Your full name').fill('Test Contractor');
    await page.getByPlaceholder(/your@email.com/i).fill('contractor@example.com');
    await page.getByPlaceholder(/\(740\)/i).fill('7405551234');

    // Select Purchase Order payment method
    const purchaseOrderLabel = page.locator('label').filter({ hasText: 'Purchase Order' });
    await purchaseOrderLabel.click();

    // Verify Purchase Order is selected
    await expect(purchaseOrderLabel).toHaveClass(/border-amber-500/);

    // Verify PO number field appears
    await expect(page.getByPlaceholder('Enter purchase order number')).toBeVisible();

    // Enter PO number
    await page.getByPlaceholder('Enter purchase order number').fill('PO-2024-001');

    // Select delivery method
    const deliveryLabel = page.locator('label').filter({ hasText: 'Delivery' });
    await deliveryLabel.click();

    // Fill delivery address
    await page.getByPlaceholder(/Street address, city, state, zip/i).fill('123 Contractor St, Columbus, OH 43215');

    // Mock the checkout API endpoint to handle purchase order
    await page.route('/api/orders/checkout', async (route) => {
      const request = await route.request();
      const postData = JSON.parse(request.postData() || '{}');

      // Verify the request includes purchase order payment method
      expect(postData.paymentMethod).toBe('purchase_order');
      expect(postData.purchaseOrderNumber).toBe('PO-2024-001');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orderNumber: 'ORD-12345',
          paymentMethod: 'purchase_order',
          invoiceId: 'INV-67890',
        }),
      });
    });

    // Mock the invoice creation endpoint
    await page.route('/api/account/billing/invoices', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'INV-67890',
            orderId: 'ORD-12345',
            status: 'pending',
            amount: 66.35,
            dueDate: '2024-07-19',
            purchaseOrderNumber: 'PO-2024-001',
          },
        }),
      });
    });

    // Submit the order
    const submitButton = page.getByRole('button', { name: /Place Order/i });
    await submitButton.click();

    // Verify order confirmation
    await expect(page.getByText(/order confirmed/i)).toBeVisible();
    await expect(page.getByText('ORD-12345')).toBeVisible();

    // Verify purchase order details shown in confirmation
    await expect(page.getByText(/Purchase Order/i)).toBeVisible();
    await expect(page.getByText('PO-2024-001')).toBeVisible();
    await expect(page.getByText(/invoice will be sent/i)).toBeVisible();
  });

  test('should show purchase order option only for approved contractors', async ({ page, context }) => {
    // Clear contractor auth and set up as regular user
    await context.clearCookies();

    await page.route('/api/account/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'user-456',
            email: 'regular@example.com',
            name: 'Regular User',
            role: 'user',
            netTermsApproved: false,
          },
        }),
      });
    });

    await page.goto('/order');

    // Add product to cart
    await page.getByRole('button', { name: 'Add' }).first().click();

    // Proceed to checkout
    await page.getByRole('button', { name: /checkout/i }).click();

    // Verify Purchase Order payment method is NOT available
    const purchaseOrderOption = page.locator('label').filter({ hasText: 'Purchase Order' });
    await expect(purchaseOrderOption).not.toBeVisible();

    // Verify only standard payment methods are shown
    await expect(page.locator('label').filter({ hasText: 'Credit Card' })).toBeVisible();
  });

  test('should validate PO number is required', async ({ page }) => {
    // Add product to cart
    await page.getByRole('button', { name: 'Add' }).first().click();

    // Proceed to checkout
    await page.getByRole('button', { name: /checkout/i }).click();

    // Fill contact info
    await page.getByPlaceholder('Your full name').fill('Test Contractor');
    await page.getByPlaceholder(/your@email.com/i).fill('contractor@example.com');
    await page.getByPlaceholder(/\(740\)/i).fill('7405551234');

    // Select Purchase Order payment method
    const purchaseOrderLabel = page.locator('label').filter({ hasText: 'Purchase Order' });
    await purchaseOrderLabel.click();

    // Try to submit without entering PO number
    await page.getByRole('button', { name: /Place Order/i }).click();

    // Verify validation error appears
    await expect(page.getByText('Purchase order number is required')).toBeVisible();
  });

  test('should display order in billing dashboard', async ({ page }) => {
    // Complete a purchase order
    await page.getByRole('button', { name: 'Add' }).first().click();
    await page.getByRole('button', { name: /checkout/i }).click();

    await page.getByPlaceholder('Your full name').fill('Test Contractor');
    await page.getByPlaceholder(/your@email.com/i).fill('contractor@example.com');
    await page.getByPlaceholder(/\(740\)/i).fill('7405551234');

    const purchaseOrderLabel = page.locator('label').filter({ hasText: 'Purchase Order' });
    await purchaseOrderLabel.click();
    await page.getByPlaceholder('Enter purchase order number').fill('PO-2024-002');

    // Mock checkout endpoint
    await page.route('/api/orders/checkout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orderNumber: 'ORD-22222',
          paymentMethod: 'purchase_order',
          invoiceId: 'INV-11111',
        }),
      });
    });

    await page.getByRole('button', { name: /Place Order/i }).click();

    // Wait for confirmation
    await expect(page.getByText('ORD-22222')).toBeVisible();

    // Navigate to billing dashboard
    await page.goto('/account/billing');

    // Mock billing dashboard API to show the order
    await page.route('/api/account/billing/invoices', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'INV-11111',
              orderNumber: 'ORD-22222',
              status: 'pending',
              amount: 22.10,
              dueDate: '2024-07-19',
              purchaseOrderNumber: 'PO-2024-002',
              createdAt: '2024-06-19T10:00:00Z',
            },
          ],
        }),
      });
    });

    // Reload to fetch invoices
    await page.reload();

    // Verify invoice appears in billing dashboard
    await expect(page.getByText('INV-11111')).toBeVisible();
    await expect(page.getByText('ORD-22222')).toBeVisible();
    await expect(page.getByText('PO-2024-002')).toBeVisible();
    await expect(page.getByText('pending', { exact: false })).toBeVisible();
  });

  test('should handle API errors gracefully during PO checkout', async ({ page }) => {
    // Add product to cart
    await page.getByRole('button', { name: 'Add' }).first().click();
    await page.getByRole('button', { name: /checkout/i }).click();

    // Fill out form
    await page.getByPlaceholder('Your full name').fill('Test Contractor');
    await page.getByPlaceholder(/your@email.com/i).fill('contractor@example.com');
    await page.getByPlaceholder(/\(740\)/i).fill('7405551234');

    const purchaseOrderLabel = page.locator('label').filter({ hasText: 'Purchase Order' });
    await purchaseOrderLabel.click();
    await page.getByPlaceholder('Enter purchase order number').fill('PO-2024-003');

    // Mock API error
    await page.route('/api/orders/checkout', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Failed to create purchase order',
        }),
      });
    });

    // Setup dialog handler for alert
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Failed to create purchase order');
      await dialog.accept();
    });

    // Submit the order
    await page.getByRole('button', { name: /Place Order/i }).click();
  });

  test('should show net terms limit warning', async ({ page }) => {
    // Add product to cart
    await page.getByRole('button', { name: 'Add' }).first().click();

    // Proceed to checkout
    await page.getByRole('button', { name: /checkout/i }).click();

    // Select Purchase Order payment method
    const purchaseOrderLabel = page.locator('label').filter({ hasText: 'Purchase Order' });
    await purchaseOrderLabel.click();

    // Verify net terms information is displayed
    await expect(page.getByText(/Credit Limit:/i)).toBeVisible();
    await expect(page.getByText(/Payment Terms:/i)).toBeVisible();
    await expect(page.getByText('30 days')).toBeVisible();
  });

  test('should allow switching between payment methods', async ({ page }) => {
    // Add product to cart
    await page.getByRole('button', { name: 'Add' }).first().click();
    await page.getByRole('button', { name: /checkout/i }).click();

    // Fill contact info
    await page.getByPlaceholder('Your full name').fill('Test Contractor');
    await page.getByPlaceholder(/your@email.com/i).fill('contractor@example.com');
    await page.getByPlaceholder(/\(740\)/i).fill('7405551234');

    // Select Purchase Order
    const purchaseOrderLabel = page.locator('label').filter({ hasText: 'Purchase Order' });
    await purchaseOrderLabel.click();

    // Verify PO number field appears
    await expect(page.getByPlaceholder('Enter purchase order number')).toBeVisible();

    // Enter PO number
    await page.getByPlaceholder('Enter purchase order number').fill('PO-2024-004');

    // Switch to Credit Card
    const creditCardLabel = page.locator('label').filter({ hasText: 'Credit Card' });
    await creditCardLabel.click();

    // Verify PO number field is hidden
    await expect(page.getByPlaceholder('Enter purchase order number')).not.toBeVisible();

    // Verify Credit Card is selected
    await expect(creditCardLabel).toHaveClass(/border-amber-500/);

    // Switch back to Purchase Order
    await purchaseOrderLabel.click();

    // Verify PO number field reappears and value is preserved
    await expect(page.getByPlaceholder('Enter purchase order number')).toBeVisible();
    await expect(page.getByPlaceholder('Enter purchase order number')).toHaveValue('PO-2024-004');
  });
});
