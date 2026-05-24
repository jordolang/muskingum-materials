import { test, expect } from '@playwright/test';

test.describe('Contact Form Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('should display contact page with all elements', async ({ page }) => {
    // Verify page heading
    await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible();

    // Verify contact form section
    await expect(page.getByText('Send Us a Message')).toBeVisible();

    // Verify contact information sections
    await expect(page.getByText('Contact Information')).toBeVisible();
    await expect(page.getByText('Business Hours')).toBeVisible();
    await expect(page.getByText('Find Us Online')).toBeVisible();

    // Verify form fields are present
    await expect(page.getByPlaceholder('Your name')).toBeVisible();
    await expect(page.getByPlaceholder(/your@email.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/\(740\)/i)).toBeVisible();
    await expect(page.getByPlaceholder(/What's this about?/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Tell us about your project/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Message' })).toBeVisible();
  });

  test('should successfully submit contact form with all fields', async ({ page }) => {
    // Fill out complete form
    await page.getByPlaceholder('Your name').fill('Alice Johnson');
    await page.getByPlaceholder(/your@email.com/i).fill('alice.johnson@example.com');
    await page.getByPlaceholder(/\(740\)/i).fill('7405551234');
    await page.getByPlaceholder(/What's this about?/i).fill('General Inquiry');
    await page.getByPlaceholder(/Tell us about your project/i).fill('I would like to learn more about your products and services for my upcoming project.');

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

    // Verify success message
    await expect(page.getByText('Message Sent!')).toBeVisible();
    await expect(page.getByText(/Thank you for reaching out/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Another Message' })).toBeVisible();
  });

  test('should successfully submit with only required fields', async ({ page }) => {
    // Fill only required fields (name, email, subject, message)
    await page.getByPlaceholder('Your name').fill('Bob Smith');
    await page.getByPlaceholder(/your@email.com/i).fill('bob.smith@example.com');
    await page.getByPlaceholder(/What's this about?/i).fill('Product Question');
    await page.getByPlaceholder(/Tell us about your project/i).fill('What are your delivery options?');

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

  test('should show validation errors for required fields', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: 'Send Message' }).click();

    // Verify all required field validation errors
    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Valid email is required')).toBeVisible();
    await expect(page.getByText('Subject is required')).toBeVisible();
    await expect(page.getByText('Message must be at least 10 characters')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Fill form with invalid email
    await page.getByPlaceholder('Your name').fill('Charlie Brown');
    await page.getByPlaceholder(/your@email.com/i).fill('not-an-email');
    await page.getByPlaceholder(/What's this about?/i).fill('Test Subject');
    await page.getByPlaceholder(/Tell us about your project/i).fill('This is a test message with at least 10 characters.');

    // Try to submit
    await page.getByRole('button', { name: 'Send Message' }).click();

    // Verify email validation error
    await expect(page.getByText('Valid email is required')).toBeVisible();
  });

  test('should validate minimum message length', async ({ page }) => {
    // Fill form with message that's too short
    await page.getByPlaceholder('Your name').fill('David Lee');
    await page.getByPlaceholder(/your@email.com/i).fill('david@example.com');
    await page.getByPlaceholder(/What's this about?/i).fill('Short');
    await page.getByPlaceholder(/Tell us about your project/i).fill('Hi');

    // Try to submit
    await page.getByRole('button', { name: 'Send Message' }).click();

    // Verify message length validation error
    await expect(page.getByText('Message must be at least 10 characters')).toBeVisible();
  });

  test('should show loading state during submission', async ({ page }) => {
    // Fill out form
    await page.getByPlaceholder('Your name').fill('Emma Wilson');
    await page.getByPlaceholder(/your@email.com/i).fill('emma@example.com');
    await page.getByPlaceholder(/What's this about?/i).fill('Loading Test');
    await page.getByPlaceholder(/Tell us about your project/i).fill('Testing the loading state during form submission process.');

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

  test('should handle API errors gracefully', async ({ page }) => {
    // Fill out form
    await page.getByPlaceholder('Your name').fill('Frank Miller');
    await page.getByPlaceholder(/your@email.com/i).fill('frank@example.com');
    await page.getByPlaceholder(/What's this about?/i).fill('Error Test');
    await page.getByPlaceholder(/Tell us about your project/i).fill('Testing error handling in the contact form.');

    // Mock API error
    await page.route('/api/contact', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Submit the form
    await page.getByRole('button', { name: 'Send Message' }).click();

    // Verify error message appears
    await expect(page.getByText(/Something went wrong. Please try again or call us directly/i)).toBeVisible();

    // Verify form is still visible (not replaced with success message)
    await expect(page.getByRole('button', { name: 'Send Message' })).toBeVisible();
  });

  test('should reset form after sending another message', async ({ page }) => {
    // Fill and submit form
    await page.getByPlaceholder('Your name').fill('Grace Taylor');
    await page.getByPlaceholder(/your@email.com/i).fill('grace@example.com');
    await page.getByPlaceholder(/\(740\)/i).fill('7405559999');
    await page.getByPlaceholder(/What's this about?/i).fill('First Message');
    await page.getByPlaceholder(/Tell us about your project/i).fill('This is my first message to test the reset functionality.');

    // Mock the contact API endpoint
    await page.route('/api/contact', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Submit form
    await page.getByRole('button', { name: 'Send Message' }).click();

    // Verify success
    await expect(page.getByText('Message Sent!')).toBeVisible();

    // Click "Send Another Message"
    await page.getByRole('button', { name: 'Send Another Message' }).click();

    // Verify form is shown again and fields are cleared
    await expect(page.getByPlaceholder('Your name')).toBeVisible();
    await expect(page.getByPlaceholder('Your name')).toHaveValue('');
    await expect(page.getByPlaceholder(/your@email.com/i)).toHaveValue('');
    await expect(page.getByPlaceholder(/\(740\)/i)).toHaveValue('');
    await expect(page.getByPlaceholder(/What's this about?/i)).toHaveValue('');
    await expect(page.getByPlaceholder(/Tell us about your project/i)).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Send Message' })).toBeVisible();
  });

  test('should display contact information correctly', async ({ page }) => {
    // Verify phone numbers
    await expect(page.getByText('(740) 319-0183')).toBeVisible();
    await expect(page.getByText('(740) 222-4422')).toBeVisible();

    // Verify email
    await expect(page.getByText('sales@muskingummaterials.com')).toBeVisible();

    // Verify address
    await expect(page.getByText(/1133 Ellis Dam Rd/i)).toBeVisible();
    await expect(page.getByText(/Zanesville, OH 43701/i)).toBeVisible();
  });

  test('should display business hours', async ({ page }) => {
    // Verify business hours section is visible
    await expect(page.getByText('Business Hours')).toBeVisible();

    // Verify some day labels are shown
    await expect(page.getByText('Monday')).toBeVisible();
    await expect(page.getByText('Tuesday')).toBeVisible();
    await expect(page.getByText('Wednesday')).toBeVisible();
    await expect(page.getByText('Thursday')).toBeVisible();
    await expect(page.getByText('Friday')).toBeVisible();
  });

  test('should display social media links', async ({ page }) => {
    // Verify social media section
    await expect(page.getByText('Find Us Online')).toBeVisible();

    // Verify Facebook link
    const facebookLink = page.getByRole('link', { name: /Facebook/i });
    await expect(facebookLink).toBeVisible();
    await expect(facebookLink).toHaveAttribute('href', /facebook\.com/);
    await expect(facebookLink).toHaveAttribute('target', '_blank');

    // Verify Google Business link
    const googleLink = page.getByRole('link', { name: /Google Business/i });
    await expect(googleLink).toBeVisible();
    await expect(googleLink).toHaveAttribute('href', /google\.com/);
    await expect(googleLink).toHaveAttribute('target', '_blank');
  });

  test('should display embedded map', async ({ page }) => {
    // Verify the map iframe is present
    const mapFrame = page.locator('iframe[title="Muskingum Materials Location"]');
    await expect(mapFrame).toBeVisible();

    // Verify the map has Google Maps embed source
    await expect(mapFrame).toHaveAttribute('src', /google\.com\/maps\/embed/);

    // Verify map attributes
    await expect(mapFrame).toHaveAttribute('allowFullScreen');
    await expect(mapFrame).toHaveAttribute('loading', 'lazy');
  });

  test('should have clickable phone numbers', async ({ page }) => {
    // Verify primary phone is a clickable link
    const primaryPhone = page.getByRole('link', { name: /\(740\) 319-0183/i });
    await expect(primaryPhone).toBeVisible();
    await expect(primaryPhone).toHaveAttribute('href', 'tel:7403190183');

    // Verify alternate phone is a clickable link
    const altPhone = page.getByRole('link', { name: /\(740\) 222-4422/i });
    await expect(altPhone).toBeVisible();
    await expect(altPhone).toHaveAttribute('href', 'tel:7402224422');
  });

  test('should have clickable email address', async ({ page }) => {
    // Verify email is a clickable mailto link
    const emailLink = page.getByRole('link', { name: 'sales@muskingummaterials.com' });
    await expect(emailLink).toBeVisible();
    await expect(emailLink).toHaveAttribute('href', 'mailto:sales@muskingummaterials.com');
  });

  test('should preserve form data during validation errors', async ({ page }) => {
    // Fill form with some valid and some invalid data
    await page.getByPlaceholder('Your name').fill('Helen Anderson');
    await page.getByPlaceholder(/your@email.com/i).fill('invalid-email');
    await page.getByPlaceholder(/\(740\)/i).fill('7405551111');
    await page.getByPlaceholder(/What's this about?/i).fill('Validation Test');

    // Try to submit with invalid email
    await page.getByRole('button', { name: 'Send Message' }).click();

    // Verify validation error appears
    await expect(page.getByText('Valid email is required')).toBeVisible();

    // Verify form data is preserved
    await expect(page.getByPlaceholder('Your name')).toHaveValue('Helen Anderson');
    await expect(page.getByPlaceholder(/your@email.com/i)).toHaveValue('invalid-email');
    await expect(page.getByPlaceholder(/\(740\)/i)).toHaveValue('7405551111');
    await expect(page.getByPlaceholder(/What's this about?/i)).toHaveValue('Validation Test');
  });
});
