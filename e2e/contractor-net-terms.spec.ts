import { test, expect } from '@playwright/test';

test.describe('Contractor Net Terms Credit Limit Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set up authentication cookies for contractor user
    await context.addCookies([
      {
        name: '__session',
        value: 'mock_contractor_net_terms_session',
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
            id: 'contractor-net-terms-123',
            email: 'contractor-net@example.com',
            name: 'Test Contractor Net Terms LLC',
            role: 'contractor',
            netTermsApproved: true,
            netTermsLimit: 1000,
            netTermsDays: 30,
            currentNetTermsBalance: 0,
          },
        }),
      });
    });
  });

  test('should enforce credit limit across multiple net terms orders', async ({ page }) => {
    // Start with the first order for $800
    await page.goto('/order');

    // Verify we're on the order page
    await expect(page.getByRole('heading', { name: 'Order Materials Online' })).toBeVisible();

    // Add products totaling approximately $800
    // Assuming products are ~$2/ton, add 400 tons
    const firstAddButton = page.getByRole('button', { name: 'Add' }).first();
    await firstAddButton.click();

    // Set quantity to 400 tons
    const quantityInput = page.getByRole('spinbutton').first();
    await quantityInput.fill('400');

    // Proceed to checkout
    await page.getByRole('button', { name: /checkout/i }).click();

    // Fill contact information
    await page.getByPlaceholder('Your full name').fill('Net Terms Contractor');
    await page.getByPlaceholder(/your@email.com/i).fill('contractor-net@example.com');
    await page.getByPlaceholder(/\(740\)/i).fill('7405551111');

    // Select Net Terms payment method
    const netTermsLabel = page.locator('label').filter({ hasText: /Net Terms/i });
    await netTermsLabel.click();

    // Verify Net Terms is selected
    await expect(netTermsLabel).toHaveClass(/border-amber-500/);

    // Verify credit limit information is displayed
    await expect(page.getByText(/Credit Limit:/i)).toBeVisible();
    await expect(page.getByText(/Available Credit:/i)).toBeVisible();
    await expect(page.getByText(/Payment Terms:/i)).toBeVisible();
    await expect(page.getByText('30 days')).toBeVisible();

    // Mock the checkout API endpoint for first order
    let orderCount = 0;
    await page.route('/api/orders/checkout', async (route) => {
      orderCount++;
      const request = await route.request();
      const postData = JSON.parse(request.postData() || '{}');

      if (orderCount === 1) {
        // First order succeeds ($800)
        expect(postData.paymentMethod).toBe('net_terms');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            orderNumber: 'ORD-NET-001',
            paymentMethod: 'net_terms',
            invoiceId: 'INV-NET-001',
            amount: 800,
          }),
        });
      }
    });

    // Mock invoice creation for first order
    await page.route('/api/account/billing/invoices*', async (route) => {
      const url = route.request().url();

      if (url.includes('method=GET')) {
        // Return invoices list
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'INV-NET-001',
                orderNumber: 'ORD-NET-001',
                status: 'pending',
                amount: 800,
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                createdAt: new Date().toISOString(),
              },
            ],
          }),
        });
      } else {
        // Create invoice
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'INV-NET-001',
              orderNumber: 'ORD-NET-001',
              status: 'pending',
              amount: 800,
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
          }),
        });
      }
    });

    // Submit the first order
    const submitButton = page.getByRole('button', { name: /Place Order/i });
    await submitButton.click();

    // Verify order confirmation
    await expect(page.getByText(/order confirmed/i)).toBeVisible();
    await expect(page.getByText('ORD-NET-001')).toBeVisible();
    await expect(page.getByText(/invoice will be sent/i)).toBeVisible();

    // Step 2: Attempt second order for $300 - should be blocked
    await page.goto('/order');

    // Update profile mock to show $800 balance used
    await page.route('/api/account/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'contractor-net-terms-123',
            email: 'contractor-net@example.com',
            name: 'Test Contractor Net Terms LLC',
            role: 'contractor',
            netTermsApproved: true,
            netTermsLimit: 1000,
            netTermsDays: 30,
            currentNetTermsBalance: 800,
          },
        }),
      });
    });

    // Reload to update credit info
    await page.reload();

    // Add products totaling approximately $300
    await page.getByRole('button', { name: 'Add' }).first().click();
    const secondQuantityInput = page.getByRole('spinbutton').first();
    await secondQuantityInput.fill('150');

    // Proceed to checkout
    await page.getByRole('button', { name: /checkout/i }).click();

    // Fill contact information
    await page.getByPlaceholder('Your full name').fill('Net Terms Contractor');
    await page.getByPlaceholder(/your@email.com/i).fill('contractor-net@example.com');
    await page.getByPlaceholder(/\(740\)/i).fill('7405551111');

    // Select Net Terms
    const netTermsLabel2 = page.locator('label').filter({ hasText: /Net Terms/i });
    await netTermsLabel2.click();

    // Verify available credit shows $200 remaining
    await expect(page.getByText(/Available Credit:/i)).toBeVisible();
    await expect(page.getByText(/\$200/)).toBeVisible();

    // Mock checkout to return credit limit error
    await page.route('/api/orders/checkout', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Order exceeds available credit limit. Available: $200, Order total: $300',
        }),
      });
    });

    // Setup dialog handler for alert
    let alertMessage = '';
    page.on('dialog', async (dialog) => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    // Attempt to submit - should fail
    await page.getByRole('button', { name: /Place Order/i }).click();

    // Verify error message appears
    await page.waitForTimeout(500);
    expect(alertMessage).toContain('credit limit');

    // Step 3: Pay the first invoice
    await page.goto('/account/billing');

    // Mock payment endpoint
    await page.route('/api/account/billing/invoices/*/pay', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'INV-NET-001',
            status: 'paid',
            paidAt: new Date().toISOString(),
          },
        }),
      });
    });

    // Find and click pay button for invoice
    const payButton = page.getByRole('button', { name: /pay/i }).first();
    await payButton.click();

    // Confirm payment in dialog if needed
    await page.waitForTimeout(500);

    // Step 4: Update profile to show $0 balance after payment
    await page.route('/api/account/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'contractor-net-terms-123',
            email: 'contractor-net@example.com',
            name: 'Test Contractor Net Terms LLC',
            role: 'contractor',
            netTermsApproved: true,
            netTermsLimit: 1000,
            netTermsDays: 30,
            currentNetTermsBalance: 0,
          },
        }),
      });
    });

    // Step 5: Try second order again - should succeed now
    await page.goto('/order');

    // Add products totaling $300
    await page.getByRole('button', { name: 'Add' }).first().click();
    const thirdQuantityInput = page.getByRole('spinbutton').first();
    await thirdQuantityInput.fill('150');

    // Proceed to checkout
    await page.getByRole('button', { name: /checkout/i }).click();

    // Fill contact information
    await page.getByPlaceholder('Your full name').fill('Net Terms Contractor');
    await page.getByPlaceholder(/your@email.com/i).fill('contractor-net@example.com');
    await page.getByPlaceholder(/\(740\)/i).fill('7405551111');

    // Select Net Terms
    const netTermsLabel3 = page.locator('label').filter({ hasText: /Net Terms/i });
    await netTermsLabel3.click();

    // Mock successful checkout for second order
    await page.route('/api/orders/checkout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orderNumber: 'ORD-NET-002',
          paymentMethod: 'net_terms',
          invoiceId: 'INV-NET-002',
          amount: 300,
        }),
      });
    });

    // Submit the second order
    const submitButton2 = page.getByRole('button', { name: /Place Order/i });
    await submitButton2.click();

    // Verify second order confirmation
    await expect(page.getByText(/order confirmed/i)).toBeVisible();
    await expect(page.getByText('ORD-NET-002')).toBeVisible();
  });

  test('should display invoice with due date', async ({ page }) => {
    await page.goto('/order');

    // Add product
    await page.getByRole('button', { name: 'Add' }).first().click();
    await page.getByRole('button', { name: /checkout/i }).click();

    // Fill contact info
    await page.getByPlaceholder('Your full name').fill('Invoice Test Contractor');
    await page.getByPlaceholder(/your@email.com/i).fill('invoice@example.com');
    await page.getByPlaceholder(/\(740\)/i).fill('7405552222');

    // Select Net Terms
    const netTermsLabel = page.locator('label').filter({ hasText: /Net Terms/i });
    await netTermsLabel.click();

    // Mock checkout
    await page.route('/api/orders/checkout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orderNumber: 'ORD-INV-TEST',
          paymentMethod: 'net_terms',
          invoiceId: 'INV-DUE-TEST',
        }),
      });
    });

    // Submit order
    await page.getByRole('button', { name: /Place Order/i }).click();

    // Verify confirmation
    await expect(page.getByText('ORD-INV-TEST')).toBeVisible();

    // Navigate to billing to see invoice
    await page.goto('/account/billing');

    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Mock invoice list with due date
    await page.route('/api/account/billing/invoices*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'INV-DUE-TEST',
              orderNumber: 'ORD-INV-TEST',
              status: 'pending',
              amount: 22.10,
              dueDate: dueDate,
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    await page.reload();

    // Verify invoice appears with due date
    await expect(page.getByText('INV-DUE-TEST')).toBeVisible();
    await expect(page.getByText(/due.*30 days/i)).toBeVisible();
  });

  test('should show credit limit warning when approaching limit', async ({ page }) => {
    // Mock profile with high balance
    await page.route('/api/account/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'contractor-net-terms-123',
            email: 'contractor-net@example.com',
            name: 'Test Contractor Net Terms LLC',
            role: 'contractor',
            netTermsApproved: true,
            netTermsLimit: 1000,
            netTermsDays: 30,
            currentNetTermsBalance: 950,
          },
        }),
      });
    });

    await page.goto('/order');

    // Add product
    await page.getByRole('button', { name: 'Add' }).first().click();
    await page.getByRole('button', { name: /checkout/i }).click();

    // Select Net Terms
    const netTermsLabel = page.locator('label').filter({ hasText: /Net Terms/i });
    await netTermsLabel.click();

    // Verify warning about low available credit
    await expect(page.getByText(/Available Credit:/i)).toBeVisible();
    await expect(page.getByText(/\$50/)).toBeVisible();
  });

  test('should prevent order when credit limit is zero', async ({ page }) => {
    // Mock profile with maxed out credit
    await page.route('/api/account/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'contractor-net-terms-123',
            email: 'contractor-net@example.com',
            name: 'Test Contractor Net Terms LLC',
            role: 'contractor',
            netTermsApproved: true,
            netTermsLimit: 1000,
            netTermsDays: 30,
            currentNetTermsBalance: 1000,
          },
        }),
      });
    });

    await page.goto('/order');

    // Add product
    await page.getByRole('button', { name: 'Add' }).first().click();
    await page.getByRole('button', { name: /checkout/i }).click();

    // Fill contact info
    await page.getByPlaceholder('Your full name').fill('Zero Credit Contractor');
    await page.getByPlaceholder(/your@email.com/i).fill('zero@example.com');
    await page.getByPlaceholder(/\(740\)/i).fill('7405553333');

    // Select Net Terms
    const netTermsLabel = page.locator('label').filter({ hasText: /Net Terms/i });
    await netTermsLabel.click();

    // Verify available credit shows $0
    await expect(page.getByText(/Available Credit:/i)).toBeVisible();
    await expect(page.getByText(/\$0/)).toBeVisible();

    // Verify submit button is disabled or shows warning
    const submitButton = page.getByRole('button', { name: /Place Order/i });

    // Mock checkout to return error
    await page.route('/api/orders/checkout', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'No available credit. Please pay outstanding invoices.',
        }),
      });
    });

    let alertMessage = '';
    page.on('dialog', async (dialog) => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    await submitButton.click();

    // Verify error
    await page.waitForTimeout(500);
    expect(alertMessage).toContain('credit');
  });
});
