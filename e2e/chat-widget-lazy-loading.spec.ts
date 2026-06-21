import { test, expect } from '@playwright/test';

/**
 * The homepage mounts CinematicIntroOverlay (z-[120]) whenever
 * sessionStorage['mm-intro-seen'] is absent. That overlay sits above the chat
 * button (z-50) and would intercept clicks, so every test seeds the key (the
 * exact value the overlay writes) before navigation and also requests reduced
 * motion — either condition makes the overlay skip mounting entirely.
 */
test.use({ reducedMotion: 'reduce' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.sessionStorage.setItem('mm-intro-seen', '1');
    } catch {
      // sessionStorage can throw in some contexts; reducedMotion still gates the intro.
    }
  });
});

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

    // Verify chat button is visible (lightweight loader button, aria-label="Open chat")
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

    // Verify the ChatWidget opened. The opened panel renders the header copy and
    // the message input placeholder defined in chat-widget.tsx — both are stable
    // and present only once the dynamically imported widget has rendered.
    await expect(
      page.getByPlaceholder('Type your message...')
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Ask us anything!')).toBeVisible();
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

    // The message input should be interactive once the widget is open.
    const messageInput = page.getByPlaceholder('Type your message...');
    await expect(messageInput).toBeEnabled();
    console.log('✓ ChatWidget is interactive and functional');
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

    // The full widget (message input) should not be present until the button is clicked.
    await expect(page.getByPlaceholder('Type your message...')).toHaveCount(0);

    console.log('✓ Lightweight chat button rendered before load');
  });

  test('should toggle open and closed gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open the widget. After the first click the control is relabeled "Close chat",
    // so re-clicking an "Open chat" locator would never resolve — assert each
    // labelled control in turn.
    await page.getByRole('button', { name: /open chat/i }).click();

    const messageInput = page.getByPlaceholder('Type your message...');
    await expect(messageInput).toBeVisible({ timeout: 5000 });

    // Close it via the in-widget "Close chat" control.
    await page.getByRole('button', { name: /close chat/i }).click();
    await expect(messageInput).toBeHidden();

    // The lightweight "Open chat" button returns; re-opening works without errors
    // (the widget chunk is already loaded, so this exercises the open/close cycle).
    const reopenButton = page.getByRole('button', { name: /open chat/i });
    await expect(reopenButton).toBeVisible();
    await reopenButton.click();
    await expect(messageInput).toBeVisible();

    console.log('✓ Open/close toggling handled gracefully');
  });
});
