import { test, expect } from '@playwright/test';

test.describe('ChatWidget Lazy Loading', () => {
  test('should lazy load ChatWidget only when chat button is clicked', async ({ page }) => {
    // Track all network requests
    const networkRequests: string[] = [];
    page.on('request', (request) => {
      networkRequests.push(request.url());
    });

    // Track console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to home page
    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Verify chat button is visible
    const chatButton = page.getByRole('button', { name: /open chat/i });
    await expect(chatButton).toBeVisible();

    // Check initial network requests - ChatWidget chunk should NOT be loaded yet
    const initialChatWidgetChunks = networkRequests.filter(url =>
      url.includes('chat-widget') && !url.includes('chat-widget-loader')
    );

    expect(initialChatWidgetChunks.length).toBe(0);
    console.log('✓ Initial page load: ChatWidget chunk NOT downloaded');

    // Click the chat button to trigger lazy loading
    await chatButton.click();

    // Wait for the ChatWidget to load and render
    await page.waitForTimeout(1000); // Give time for dynamic import

    // Verify ChatWidget elements are now visible
    // The widget should have loaded and opened
    const chatInterface = page.locator('[class*="chat"]').first();
    await expect(chatInterface).toBeVisible({ timeout: 5000 });
    console.log('✓ ChatWidget rendered after button click');

    // Check that ChatWidget chunk was loaded after click
    const postClickChatWidgetChunks = networkRequests.filter(url =>
      url.includes('chat-widget') && !url.includes('chat-widget-loader')
    );

    expect(postClickChatWidgetChunks.length).toBeGreaterThan(0);
    console.log('✓ ChatWidget chunk downloaded after button click');

    // Verify no console errors occurred during lazy loading
    expect(consoleErrors).toHaveLength(0);
    console.log('✓ No console errors during lazy load');

    // Additional verification: Check that the chat widget is functional
    const messageInput = page.locator('textarea, input[type="text"]').first();
    if (await messageInput.isVisible()) {
      await expect(messageInput).toBeEnabled();
      console.log('✓ ChatWidget is interactive and functional');
    }
  });

  test('should show lightweight button before ChatWidget loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify the initial button is the lightweight version (just icon, no full widget)
    const chatButton = page.getByRole('button', { name: /open chat/i });
    await expect(chatButton).toBeVisible();

    // Button should be small and contain just the MessageCircle icon
    const buttonClasses = await chatButton.getAttribute('class');
    expect(buttonClasses).toContain('fixed');
    expect(buttonClasses).toContain('bottom-6');
    expect(buttonClasses).toContain('right-6');
    expect(buttonClasses).toContain('rounded-full');

    console.log('✓ Lightweight chat button rendered before load');
  });

  test('should handle multiple clicks gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const chatButton = page.getByRole('button', { name: /open chat/i });

    // Click multiple times
    await chatButton.click();
    await page.waitForTimeout(500);
    await chatButton.click();
    await page.waitForTimeout(500);

    // Should still render correctly without errors
    const chatInterface = page.locator('[class*="chat"]').first();
    await expect(chatInterface).toBeVisible({ timeout: 5000 });

    console.log('✓ Multiple clicks handled gracefully');
  });
});
