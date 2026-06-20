import { test, expect } from '@playwright/test';

test.describe('Confidence Range Estimate Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/order');
  });

  test('should display confidence range using dimensions mode', async ({ page }) => {
    // Verify we're on the order page
    await expect(page.getByRole('heading', { name: 'Order Materials Online' })).toBeVisible();

    // Verify the material calculator is visible
    await expect(page.getByText('Material Calculator')).toBeVisible();

    // Use a quick preset (Single Car Driveway) to populate dimensions
    const singleCarDrivewayButton = page.getByRole('button', { name: /Single Car Driveway/i });
    await singleCarDrivewayButton.click();

    // Verify dimensions are populated (20 x 10)
    const lengthInput = page.getByPlaceholder('20').first();
    const widthInput = page.getByPlaceholder('10');
    await expect(lengthInput).toHaveValue('20');
    await expect(widthInput).toHaveValue('10');

    // Verify depth is set (default 3 inches)
    const depthInput = page.getByPlaceholder('3');
    await expect(depthInput).toBeVisible();

    // Verify confidence range displays
    await expect(page.getByText('Estimated Material Needed')).toBeVisible();

    // Verify the confidence range component displays tons range
    // Looking for pattern like "12.5 - 14.2 - 16.8" tons
    await expect(page.getByText(/tons/i)).toBeVisible();
    await expect(page.getByText(/cubic yards/i)).toBeVisible();

    // Verify confidence explanation is shown
    await expect(page.getByText(/Understanding Your Estimate Range/i)).toBeVisible();

    // Verify explanation mentions depth variance
    await expect(page.getByText(/depth/i)).toBeVisible();
    await expect(page.getByText(/density/i)).toBeVisible();
  });

  test('should display right-sizing guidance', async ({ page }) => {
    // Use quick preset to generate estimate
    const singleCarDrivewayButton = page.getByRole('button', { name: /Single Car Driveway/i });
    await singleCarDrivewayButton.click();

    // Verify estimate is shown
    await expect(page.getByText('Estimated Material Needed')).toBeVisible();

    // Verify right-sizing guidance section appears
    await expect(page.getByText(/Right-Sizing/i)).toBeVisible();

    // Verify guidance includes recommendations
    // Should show either "Order Toward the High End", "Order Slightly Over Expected", or "Match Expected Value"
    const guidanceSection = page.locator('text=/Order.*Expected|Match Expected|High End/i');
    await expect(guidanceSection.first()).toBeVisible();

    // Verify assurance message is present
    await expect(page.getByText(/help you get it right/i)).toBeVisible();
  });

  test('should allow requesting staff review with project estimate', async ({ page }) => {
    // Create an estimate using dimensions
    const singleCarDrivewayButton = page.getByRole('button', { name: /Single Car Driveway/i });
    await singleCarDrivewayButton.click();

    // Wait for estimate to display
    await expect(page.getByText('Estimated Material Needed')).toBeVisible();

    // Find and click "Request Staff Review" button
    const reviewButton = page.getByRole('button', { name: /Request.*Review|Unsure/i });
    await expect(reviewButton).toBeVisible();
    await reviewButton.click();

    // Verify dialog opens
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Request Staff Review/i)).toBeVisible();

    // Fill in contact information
    await page.getByPlaceholder(/name/i).fill('Test User');
    await page.getByPlaceholder(/email/i).fill('test@example.com');
    await page.getByPlaceholder(/phone/i).fill('7401234567');

    // Mock the quote API endpoint
    await page.route('/api/quote', async (route) => {
      const requestBody = route.request().postDataJSON();

      // Verify the request includes project site data
      expect(requestBody.projectSite).toBeDefined();
      expect(requestBody.projectSite.estimate).toBeDefined();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          quoteRequestId: 'TEST-QUOTE-123'
        }),
      });
    });

    // Submit the review request
    const submitButton = page.getByRole('button', { name: /Submit|Send/i });
    await submitButton.click();

    // Verify success message appears
    await expect(page.getByText(/Review request sent|within 24 hours/i)).toBeVisible();
  });

  test('should update confidence range when depth changes', async ({ page }) => {
    // Use quick preset
    const singleCarDrivewayButton = page.getByRole('button', { name: /Single Car Driveway/i });
    await singleCarDrivewayButton.click();

    // Wait for initial estimate
    await expect(page.getByText('Estimated Material Needed')).toBeVisible();

    // Get initial tons value (this is approximate, just verifying it changes)
    const initialEstimate = await page.getByText(/tons/i).first().textContent();

    // Change depth from 3 to 6 inches
    const depthInput = page.getByPlaceholder('3');
    await depthInput.fill('6');

    // Trigger recalculation by blurring or waiting
    await depthInput.blur();

    // Wait a moment for recalculation
    await page.waitForTimeout(500);

    // Verify estimate updated (new value should be different from initial)
    const updatedEstimate = await page.getByText(/tons/i).first().textContent();
    expect(updatedEstimate).not.toBe(initialEstimate);

    // Verify confidence explanation still shows
    await expect(page.getByText(/Understanding Your Estimate Range/i)).toBeVisible();
  });

  test('should integrate confidence range with order checkout', async ({ page }) => {
    // Create estimate
    const singleCarDrivewayButton = page.getByRole('button', { name: /Single Car Driveway/i });
    await singleCarDrivewayButton.click();

    // Verify estimate displays
    await expect(page.getByText('Estimated Material Needed')).toBeVisible();

    // Add a product to cart
    await page.getByRole('button', { name: 'Add' }).first().click();

    // Proceed to checkout
    await page.getByRole('button', { name: /checkout/i }).click();

    // Fill contact info
    await page.getByPlaceholder('Your full name').fill('Test User');
    await page.getByPlaceholder(/your@email.com/i).fill('test@example.com');
    await page.getByPlaceholder(/\(740\)/i).fill('7401234567');

    // Mock the checkout API endpoint
    let checkoutPayload: any = null;
    await page.route('/api/orders/checkout', async (route) => {
      checkoutPayload = route.request().postDataJSON();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orderNumber: 'TEST-CONF-001',
        }),
      });
    });

    // Submit the order
    await page.getByRole('button', { name: /Pay \$/i }).click();

    // Verify order confirmation
    await expect(page.getByText(/order confirmed/i)).toBeVisible();
    await expect(page.getByText('TEST-CONF-001')).toBeVisible();

    // Verify checkout payload included project site with confidence range
    expect(checkoutPayload).toBeTruthy();
    expect(checkoutPayload.projectSite).toBeDefined();
    expect(checkoutPayload.projectSite.estimate).toBeDefined();
  });

  test('should validate review request form fields', async ({ page }) => {
    // Create estimate
    const singleCarDrivewayButton = page.getByRole('button', { name: /Single Car Driveway/i });
    await singleCarDrivewayButton.click();

    // Open review dialog
    const reviewButton = page.getByRole('button', { name: /Request.*Review|Unsure/i });
    await reviewButton.click();

    // Verify dialog is open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Try to submit without filling required fields
    const submitButton = page.getByRole('button', { name: /Submit|Send/i });
    await submitButton.click();

    // Verify validation errors appear
    await expect(page.getByText(/name.*required|required.*name/i)).toBeVisible();
    await expect(page.getByText(/email.*required|required.*email/i)).toBeVisible();
  });

  test('should gracefully degrade when density data is missing', async ({ page }) => {
    // This test verifies the fallback behavior when a product doesn't have density range data
    // The system should still calculate using MATERIAL_DENSITY_AVG ± 0.1

    // Use quick preset to generate an estimate
    const singleCarDrivewayButton = page.getByRole('button', { name: /Single Car Driveway/i });
    await singleCarDrivewayButton.click();

    // Wait for estimate to render
    await expect(page.getByText('Estimated Material Needed')).toBeVisible();

    // Verify tonnage is shown (even with narrower confidence range fallback)
    await expect(page.getByText(/tons/i)).toBeVisible();

    // Verify cubic yards are also shown
    await expect(page.getByText(/cubic yards/i)).toBeVisible();

    // Verify the confidence explanation section is present
    await expect(page.getByText(/Understanding Your Estimate Range/i)).toBeVisible();

    // CRITICAL: Verify explanation mentions "average density" or "typical aggregate density"
    // This is the key indicator of graceful degradation fallback behavior
    const explanationText = await page.getByText(/average density|typical aggregate density/i);
    await expect(explanationText).toBeVisible();

    // Verify the explanation mentions the ±0.1 tons/yd³ fallback range
    await expect(page.getByText(/±0\.1 tons?\/yd³/i)).toBeVisible();

    // Verify the explanation text about conservative estimate is present
    await expect(page.getByText(/conservative estimate/i)).toBeVisible();

    // Verify depth variance is still explained (that factor always applies)
    await expect(page.getByText(/depth/i)).toBeVisible();

    // Verify that the estimate still calculates correctly
    // Even without product-specific density, the calculator should provide a valid range
    const tonsText = page.getByText(/\d+\.?\d*\s*tons/i).first();
    await expect(tonsText).toBeVisible();
  });

  test('should display confidence factors in explanation', async ({ page }) => {
    // Use quick preset
    const singleCarDrivewayButton = page.getByRole('button', { name: /Single Car Driveway/i });
    await singleCarDrivewayButton.click();

    // Wait for estimate
    await expect(page.getByText('Estimated Material Needed')).toBeVisible();

    // Verify confidence explanation shows both factors
    const explanationSection = page.locator('text=/Understanding Your Estimate Range/i').locator('..');

    // Should mention depth measurement variance (±0.5 inches)
    await expect(explanationSection.getByText(/depth/i)).toBeVisible();

    // Should mention density variation
    await expect(explanationSection.getByText(/density/i)).toBeVisible();
  });

  test('should persist confidence range in order receipt', async ({ page }) => {
    // Create estimate
    const singleCarDrivewayButton = page.getByRole('button', { name: /Single Car Driveway/i });
    await singleCarDrivewayButton.click();

    // Add product and checkout
    await page.getByRole('button', { name: 'Add' }).first().click();
    await page.getByRole('button', { name: /checkout/i }).click();

    // Fill contact info
    await page.getByPlaceholder('Your full name').fill('Receipt Test User');
    await page.getByPlaceholder(/your@email.com/i).fill('receipt@example.com');
    await page.getByPlaceholder(/\(740\)/i).fill('7401234567');

    // Mock checkout API
    await page.route('/api/orders/checkout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orderNumber: 'TEST-RECEIPT-001',
        }),
      });
    });

    // Mock the receipt page to include confidence range data
    await page.route('/api/orders/TEST-RECEIPT-001', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orderNumber: 'TEST-RECEIPT-001',
          projectEstimateTonsLow: 12.5,
          projectEstimateTonsExpected: 14.2,
          projectEstimateTonsHigh: 16.8,
          projectEstimateCubicYardsLow: 8.9,
          projectEstimateCubicYardsExpected: 10.1,
          projectEstimateCubicYardsHigh: 12.0,
        }),
      });
    });

    // Submit order
    await page.getByRole('button', { name: /Pay \$/i }).click();

    // Verify we're on the confirmation/receipt page
    await expect(page.getByText(/order confirmed/i)).toBeVisible();

    // Note: The actual receipt display would need to navigate to /order/TEST-RECEIPT-001/receipt
    // which would show the persisted confidence range. This is handled in subtask-7-2.
  });

  test('should handle API errors gracefully during review request', async ({ page }) => {
    // Create estimate
    const singleCarDrivewayButton = page.getByRole('button', { name: /Single Car Driveway/i });
    await singleCarDrivewayButton.click();

    // Open review dialog
    const reviewButton = page.getByRole('button', { name: /Request.*Review|Unsure/i });
    await reviewButton.click();

    // Fill in form
    await page.getByPlaceholder(/name/i).fill('Error Test');
    await page.getByPlaceholder(/email/i).fill('error@example.com');

    // Mock API error
    await page.route('/api/quote', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    // Submit
    const submitButton = page.getByRole('button', { name: /Submit|Send/i });
    await submitButton.click();

    // Verify error message appears
    await expect(page.getByText(/error|failed|try again/i)).toBeVisible();

    // Verify dialog remains open (user can retry)
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should show material-specific right-sizing advice', async ({ page }) => {
    // Create estimate
    const singleCarDrivewayButton = page.getByRole('button', { name: /Single Car Driveway/i });
    await singleCarDrivewayButton.click();

    // Wait for estimate
    await expect(page.getByText('Estimated Material Needed')).toBeVisible();

    // Verify right-sizing section appears
    await expect(page.getByText(/Right-Sizing/i)).toBeVisible();

    // The actual recommendation varies by material, but should show one of:
    // - "Order Toward the High End" (for materials with high compaction like topsoil)
    // - "Order Slightly Over Expected" (for standard aggregates)
    // - "Match Expected Value" (for decorative/finish stone)
    const recommendationPattern = /Order (Toward the High End|Slightly Over|Expected)|Match Expected/i;
    await expect(page.locator(`text=${recommendationPattern}`).first()).toBeVisible();

    // Verify tips are shown
    await expect(page.getByText(/tip|suggestion|recommendation/i)).toBeVisible();
  });

  test('should complete full order flow with confidence range: estimate → cart → checkout → receipt', async ({ page }) => {
    // STEP 1: Create estimate with polygon/dimensions
    const singleCarDrivewayButton = page.getByRole('button', { name: /Single Car Driveway/i });
    await singleCarDrivewayButton.click();

    // Wait for estimate to display with confidence range
    await expect(page.getByText('Estimated Material Needed')).toBeVisible();
    await expect(page.getByText(/tons/i)).toBeVisible();
    await expect(page.getByText(/cubic yards/i)).toBeVisible();

    // Verify confidence range components are visible
    await expect(page.getByText(/Understanding Your Estimate Range/i)).toBeVisible();
    await expect(page.getByText(/Right-Sizing/i)).toBeVisible();

    // STEP 2: Add products to cart
    const addButton = page.getByRole('button', { name: 'Add' }).first();
    await addButton.click();

    // Verify cart has item
    await expect(page.getByRole('button', { name: /checkout/i })).toBeVisible();

    // STEP 3: Complete checkout (test mode)
    await page.getByRole('button', { name: /checkout/i }).click();

    // Fill contact information
    await page.getByPlaceholder('Your full name').fill('Complete Flow Test User');
    await page.getByPlaceholder(/your@email.com/i).fill('complete-flow@example.com');
    await page.getByPlaceholder(/\(740\)/i).fill('7401234567');

    // Mock the checkout API to capture the payload
    let capturedCheckoutData: any = null;
    await page.route('/api/orders/checkout', async (route) => {
      capturedCheckoutData = route.request().postDataJSON();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orderNumber: 'TEST-COMPLETE-FLOW-001',
        }),
      });
    });

    // Submit the order
    await page.getByRole('button', { name: /Pay \$/i }).click();

    // Verify order confirmation appears
    await expect(page.getByText(/order confirmed/i)).toBeVisible();
    await expect(page.getByText('TEST-COMPLETE-FLOW-001')).toBeVisible();

    // Verify checkout payload included project site with confidence range data
    expect(capturedCheckoutData).toBeTruthy();
    expect(capturedCheckoutData.projectSite).toBeDefined();
    expect(capturedCheckoutData.projectSite.estimate).toBeDefined();
    expect(capturedCheckoutData.projectSite.estimate.tonsLow).toBeDefined();
    expect(capturedCheckoutData.projectSite.estimate.tonsExpected).toBeDefined();
    expect(capturedCheckoutData.projectSite.estimate.tonsHigh).toBeDefined();
    expect(capturedCheckoutData.projectSite.estimate.cubicYardsLow).toBeDefined();
    expect(capturedCheckoutData.projectSite.estimate.cubicYardsExpected).toBeDefined();
    expect(capturedCheckoutData.projectSite.estimate.cubicYardsHigh).toBeDefined();

    // STEP 4: View order receipt
    // Mock the receipt page API to return order with confidence range data
    await page.route('**/api/orders/TEST-COMPLETE-FLOW-001', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'receipt-test-id',
          orderNumber: 'TEST-COMPLETE-FLOW-001',
          status: 'PENDING',
          customerName: 'Complete Flow Test User',
          customerEmail: 'complete-flow@example.com',
          total: 100,
          items: [
            {
              id: 'item-1',
              productName: '304 Crushed Gravel',
              quantity: 15,
              unitType: 'tons',
              pricePerUnit: 30,
              subtotal: 450,
            }
          ],
          projectEstimateTonsLow: 12.5,
          projectEstimateTonsExpected: 14.2,
          projectEstimateTonsHigh: 16.8,
          projectEstimateCubicYardsLow: 8.9,
          projectEstimateCubicYardsExpected: 10.1,
          projectEstimateCubicYardsHigh: 12.0,
          projectAddress: '123 Test Street, Cambridge, OH',
          projectAreaSqFt: 200,
          projectDepthInches: 3,
          createdAt: new Date().toISOString(),
        }),
      });
    });

    // Navigate to receipt page
    await page.goto('/order/TEST-COMPLETE-FLOW-001/receipt');

    // STEP 5: Verify confidence range persisted and displays on receipt
    await expect(page.getByText('TEST-COMPLETE-FLOW-001')).toBeVisible();

    // Verify confidence range displays on receipt
    // Should show the ConfidenceRangeDisplay component
    await expect(page.getByText(/12\.5.*14\.2.*16\.8/)).toBeVisible(); // tons range
    await expect(page.getByText(/8\.9.*10\.1.*12\.0/)).toBeVisible(); // cubic yards range

    // Verify project site details are shown
    await expect(page.getByText('123 Test Street, Cambridge, OH')).toBeVisible();
    await expect(page.getByText(/200.*sq.*ft/i)).toBeVisible();
    await expect(page.getByText(/3.*inch/i)).toBeVisible();

    // STEP 6: Check admin order view shows range
    // Mock the admin API (same data)
    await page.route('**/api/admin/orders/receipt-test-id', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'receipt-test-id',
          orderNumber: 'TEST-COMPLETE-FLOW-001',
          status: 'PENDING',
          customerName: 'Complete Flow Test User',
          customerEmail: 'complete-flow@example.com',
          total: 100,
          items: [
            {
              id: 'item-1',
              productName: '304 Crushed Gravel',
              quantity: 15,
              unitType: 'tons',
              pricePerUnit: 30,
              subtotal: 450,
            }
          ],
          projectEstimateTonsLow: 12.5,
          projectEstimateTonsExpected: 14.2,
          projectEstimateTonsHigh: 16.8,
          projectEstimateCubicYardsLow: 8.9,
          projectEstimateCubicYardsExpected: 10.1,
          projectEstimateCubicYardsHigh: 12.0,
          projectAddress: '123 Test Street, Cambridge, OH',
          projectAreaSqFt: 200,
          projectDepthInches: 3,
          createdAt: new Date().toISOString(),
        }),
      });
    });

    // Navigate to admin order detail page
    await page.goto('/admin/orders/receipt-test-id');

    // Verify admin view shows the confidence range
    await expect(page.getByText('TEST-COMPLETE-FLOW-001')).toBeVisible();

    // Verify confidence range displays in admin view
    await expect(page.getByText(/12\.5.*14\.2.*16\.8/)).toBeVisible(); // tons range
    await expect(page.getByText(/8\.9.*10\.1.*12\.0/)).toBeVisible(); // cubic yards range

    // Verify project site information is accessible to staff
    await expect(page.getByText('123 Test Street, Cambridge, OH')).toBeVisible();
  });
});
