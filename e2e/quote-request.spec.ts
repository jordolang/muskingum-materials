import { test, expect } from '@playwright/test';

test.describe('Quote Request Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('should complete quote request with all fields', async ({ page }) => {
    // Verify we're on the contact page
    await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible();

    // Verify the contact form is visible
    await expect(page.getByText('Send Us a Message')).toBeVisible();

    // Fill out all form fields
    await page.getByPlaceholder('Your name').fill('Jane Doe');
    await page.getByPlaceholder(/your@email.com/i).fill('jane.doe@example.com');
    await page.getByPlaceholder(/\(740\)/i).fill('7401234567');
    await page.getByPlaceholder(/What's this about?/i).fill('Request for Quote');
    await page.getByPlaceholder(/Tell us about your project/i).fill('I need 10 tons of bank run for my driveway project. Please provide a quote.');

    // Mock the contact API endpoint
    await page.route('/api/contact', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Submit the form
    await page.getByRole('button', { name: 'Send Message' }).click();

    // Verify success message appears
    await expect(page.getByText('Message Sent!')).toBeVisible();
    await expect(page.getByText(/Thank you for reaching out/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Another Message' })).toBeVisible();
  });

  test('should complete quote request with only required fields', async ({ page }) => {
    // Fill only required fields (phone is optional)
    await page.getByPlaceholder('Your name').fill('John Smith');
    await page.getByPlaceholder(/your@email.com/i).fill('john.smith@example.com');
    await page.getByPlaceholder(/What's this about?/i).fill('Quote Request');
    await page.getByPlaceholder(/Tell us about your project/i).fill('Need pricing for gravel delivery.');

    // Mock the contact API endpoint
    await page.route('/api/contact', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Submit the form
    await page.getByRole('button', { name: 'Send Message' }).click();

    // Verify success
    await expect(page.getByText('Message Sent!')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling any fields
    await page.getByRole('button', { name: 'Send Message' }).click();

    // Verify validation errors appear
    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Valid email is required')).toBeVisible();
    await expect(page.getByText('Subject is required')).toBeVisible();
    await expect(page.getByText('Message must be at least 10 characters')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Fill form with invalid email
    await page.getByPlaceholder('Your name').fill('Test User');
    await page.getByPlaceholder(/your@email.com/i).fill('invalid-email');
    await page.getByPlaceholder(/What's this about?/i).fill('Test Subject');
    await page.getByPlaceholder(/Tell us about your project/i).fill('This is a test message for validation.');

    // Try to submit
    await page.getByRole('button', { name: 'Send Message' }).click();

    // Verify email validation error
    await expect(page.getByText('Valid email is required')).toBeVisible();
  });

  test('should validate minimum message length', async ({ page }) => {
    // Fill form with short message
    await page.getByPlaceholder('Your name').fill('Test User');
    await page.getByPlaceholder(/your@email.com/i).fill('test@example.com');
    await page.getByPlaceholder(/What's this about?/i).fill('Test');
    await page.getByPlaceholder(/Tell us about your project/i).fill('Short');

    // Try to submit
    await page.getByRole('button', { name: 'Send Message' }).click();

    // Verify message length validation error
    await expect(page.getByText('Message must be at least 10 characters')).toBeVisible();
  });

  test('should allow sending another message after success', async ({ page }) => {
    // Fill and submit first message
    await page.getByPlaceholder('Your name').fill('First User');
    await page.getByPlaceholder(/your@email.com/i).fill('first@example.com');
    await page.getByPlaceholder(/What's this about?/i).fill('First Quote');
    await page.getByPlaceholder(/Tell us about your project/i).fill('This is the first quote request message.');

    // Mock the contact API endpoint
    await page.route('/api/contact', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Submit first form
    await page.getByRole('button', { name: 'Send Message' }).click();

    // Verify success
    await expect(page.getByText('Message Sent!')).toBeVisible();

    // Click "Send Another Message"
    await page.getByRole('button', { name: 'Send Another Message' }).click();

    // Verify form is shown again and fields are cleared
    await expect(page.getByPlaceholder('Your name')).toBeVisible();
    await expect(page.getByPlaceholder('Your name')).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Send Message' })).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Fill out form
    await page.getByPlaceholder('Your name').fill('Error Test');
    await page.getByPlaceholder(/your@email.com/i).fill('error@example.com');
    await page.getByPlaceholder(/What's this about?/i).fill('Error Test');
    await page.getByPlaceholder(/Tell us about your project/i).fill('Testing error handling for the contact form.');

    // Mock API error
    await page.route('/api/contact', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    // Submit the form
    await page.getByRole('button', { name: 'Send Message' }).click();

    // Verify error message appears
    await expect(page.getByText(/Something went wrong. Please try again or call us directly/i)).toBeVisible();

    // Verify form is still visible (not replaced with success message)
    await expect(page.getByRole('button', { name: 'Send Message' })).toBeVisible();
  });

  test('should display contact information', async ({ page }) => {
    // Verify contact information cards are visible
    await expect(page.getByText('Contact Information')).toBeVisible();
    await expect(page.getByText('Business Hours')).toBeVisible();
    await expect(page.getByText('Find Us Online')).toBeVisible();

    // Verify phone numbers are displayed and clickable
    await expect(page.getByText('(740) 319-0183')).toBeVisible();
    await expect(page.getByText('(740) 222-4422')).toBeVisible();

    // Verify email is displayed
    await expect(page.getByText('sales@muskingummaterials.com')).toBeVisible();

    // Verify address is displayed
    await expect(page.getByText(/1133 Ellis Dam Rd/i)).toBeVisible();
    await expect(page.getByText(/Zanesville, OH 43701/i)).toBeVisible();
  });

  test('should display business hours', async ({ page }) => {
    // Verify business hours section
    await expect(page.getByText('Business Hours')).toBeVisible();

    // Verify at least some days are shown
    await expect(page.getByText('Monday')).toBeVisible();
    await expect(page.getByText('Friday')).toBeVisible();
  });

  test('should show loading state while submitting', async ({ page }) => {
    // Fill out form
    await page.getByPlaceholder('Your name').fill('Loading Test');
    await page.getByPlaceholder(/your@email.com/i).fill('loading@example.com');
    await page.getByPlaceholder(/What's this about?/i).fill('Loading Test');
    await page.getByPlaceholder(/Tell us about your project/i).fill('Testing loading state during form submission.');

    // Mock slow API response
    await page.route('/api/contact', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Submit the form
    await page.getByRole('button', { name: 'Send Message' }).click();

    // Verify loading state
    await expect(page.getByText('Sending...')).toBeVisible();

    // Verify button is disabled during submission
    const submitButton = page.getByRole('button', { name: /Sending/i });
    await expect(submitButton).toBeDisabled();

    // Wait for success
    await expect(page.getByText('Message Sent!')).toBeVisible();
  });

  test('should display map embed', async ({ page }) => {
    // Verify the map iframe is present
    const mapFrame = page.locator('iframe[title="Muskingum Materials Location"]');
    await expect(mapFrame).toBeVisible();

    // Verify the map has the correct source pattern
    await expect(mapFrame).toHaveAttribute('src', /google\.com\/maps\/embed/);
  });
});
