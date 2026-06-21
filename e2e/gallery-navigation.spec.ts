import { test, expect } from '@playwright/test';

test.describe('Gallery Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display gallery preview section with thumbnails', async ({ page }) => {
    // Verify gallery section heading
    await expect(page.getByRole('heading', { name: 'Gallery Preview' })).toBeVisible();

    // Verify gallery preview description
    await expect(page.getByText('Take a closer look at our facility, equipment, and the quality materials we produce.')).toBeVisible();

    // Verify all four thumbnails are visible
    await expect(page.getByRole('link').filter({ hasText: 'Heavy Equipment' })).toBeVisible();
    await expect(page.getByRole('link').filter({ hasText: 'Material Stockpiles' })).toBeVisible();
    await expect(page.getByRole('link').filter({ hasText: 'Product Quality' })).toBeVisible();
    await expect(page.getByRole('link').filter({ hasText: 'Processing' })).toBeVisible();

    // Verify "View Full Gallery" button is present
    await expect(page.getByRole('button', { name: 'View Full Gallery' })).toBeVisible();
  });

  test('should navigate to gallery page when clicking first thumbnail', async ({ page }) => {
    // Find and click the first gallery thumbnail (Heavy Equipment)
    const firstThumbnail = page.getByRole('link').filter({ hasText: 'Heavy Equipment' });
    await firstThumbnail.click();

    // Verify navigation to gallery page
    await expect(page).toHaveURL('/gallery');

    // Verify gallery page heading is visible
    await expect(page.getByRole('heading', { name: 'Photo Gallery' })).toBeVisible();
  });

  test('should navigate to gallery page when clicking second thumbnail', async ({ page }) => {
    // Find and click the second gallery thumbnail (Material Stockpiles)
    const secondThumbnail = page.getByRole('link').filter({ hasText: 'Material Stockpiles' });
    await secondThumbnail.click();

    // Verify navigation to gallery page
    await expect(page).toHaveURL('/gallery');
    await expect(page.getByRole('heading', { name: 'Photo Gallery' })).toBeVisible();
  });

  test('should navigate to gallery page when clicking third thumbnail', async ({ page }) => {
    // Find and click the third gallery thumbnail (Product Quality)
    const thirdThumbnail = page.getByRole('link').filter({ hasText: 'Product Quality' });
    await thirdThumbnail.click();

    // Verify navigation to gallery page
    await expect(page).toHaveURL('/gallery');
    await expect(page.getByRole('heading', { name: 'Photo Gallery' })).toBeVisible();
  });

  test('should navigate to gallery page when clicking fourth thumbnail', async ({ page }) => {
    // Find and click the fourth gallery thumbnail (Processing)
    const fourthThumbnail = page.getByRole('link').filter({ hasText: 'Processing' });
    await fourthThumbnail.click();

    // Verify navigation to gallery page
    await expect(page).toHaveURL('/gallery');
    await expect(page.getByRole('heading', { name: 'Photo Gallery' })).toBeVisible();
  });

  test('should navigate to gallery page when clicking View Full Gallery button', async ({ page }) => {
    // Find and click the "View Full Gallery" button
    const galleryButton = page.getByRole('button', { name: 'View Full Gallery' });
    await galleryButton.click();

    // Verify navigation to gallery page
    await expect(page).toHaveURL('/gallery');
    await expect(page.getByRole('heading', { name: 'Photo Gallery' })).toBeVisible();
  });

  test('should display cursor pointer on thumbnail hover', async ({ page }) => {
    // Get the first gallery thumbnail
    const firstThumbnail = page.getByRole('link').filter({ hasText: 'Heavy Equipment' });

    // Verify the thumbnail has cursor-pointer class
    await expect(firstThumbnail).toHaveClass(/cursor-pointer/);
  });

  test('should display hover description text on thumbnail hover', async ({ page }) => {
    // Get the first gallery thumbnail
    const firstThumbnail = page.getByRole('link').filter({ hasText: 'Heavy Equipment' });

    // Hover over the thumbnail
    await firstThumbnail.hover();

    // Verify description text becomes visible on hover
    await expect(page.getByText('State of the art machinery')).toBeVisible();
  });

  test('should display all thumbnail labels correctly', async ({ page }) => {
    // Verify all thumbnail labels are present
    await expect(page.getByText('Heavy Equipment')).toBeVisible();
    await expect(page.getByText('Material Stockpiles')).toBeVisible();
    await expect(page.getByText('Product Quality')).toBeVisible();
    await expect(page.getByText('Processing')).toBeVisible();
  });

  test('should display gallery preview section on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify gallery section is still visible on mobile
    await expect(page.getByRole('heading', { name: 'Gallery Preview' })).toBeVisible();

    // Verify thumbnails are visible (should be 2 columns on mobile)
    await expect(page.getByRole('link').filter({ hasText: 'Heavy Equipment' })).toBeVisible();
    await expect(page.getByRole('link').filter({ hasText: 'Material Stockpiles' })).toBeVisible();
  });

  test('should have correct image alt text for accessibility', async ({ page }) => {
    // Verify all images have proper alt text
    await expect(page.getByRole('img', { name: 'Heavy Equipment' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Material Stockpiles' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Product Quality' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Processing' })).toBeVisible();
  });

  test('should maintain grid layout with 4 thumbnails', async ({ page }) => {
    // Get all gallery thumbnail links
    const thumbnails = page.getByRole('link').filter({ has: page.locator('img[alt*="Equipment"], img[alt*="Stockpiles"], img[alt*="Quality"], img[alt*="Processing"]') });

    // Verify there are exactly 4 thumbnails
    await expect(thumbnails).toHaveCount(4);
  });

  test('should display camera icon on thumbnails', async ({ page }) => {
    // Get the first thumbnail
    const firstThumbnail = page.getByRole('link').filter({ hasText: 'Heavy Equipment' });

    // Verify camera icon is present (Lucide Camera component)
    const cameraIcon = firstThumbnail.locator('svg.lucide-camera');
    await expect(cameraIcon).toBeVisible();
  });

  test('should have correct href attribute on all thumbnails', async ({ page }) => {
    // Verify all thumbnails link to /gallery
    const heavyEquipmentLink = page.getByRole('link').filter({ hasText: 'Heavy Equipment' });
    await expect(heavyEquipmentLink).toHaveAttribute('href', '/gallery');

    const stockpilesLink = page.getByRole('link').filter({ hasText: 'Material Stockpiles' });
    await expect(stockpilesLink).toHaveAttribute('href', '/gallery');

    const qualityLink = page.getByRole('link').filter({ hasText: 'Product Quality' });
    await expect(qualityLink).toHaveAttribute('href', '/gallery');

    const processingLink = page.getByRole('link').filter({ hasText: 'Processing' });
    await expect(processingLink).toHaveAttribute('href', '/gallery');
  });

  test('should navigate back to homepage from gallery', async ({ page }) => {
    // Click a thumbnail to go to gallery
    const firstThumbnail = page.getByRole('link').filter({ hasText: 'Heavy Equipment' });
    await firstThumbnail.click();

    // Verify we're on the gallery page
    await expect(page).toHaveURL('/gallery');

    // Navigate back
    await page.goBack();

    // Verify we're back on homepage
    await expect(page).toHaveURL('/');

    // Verify gallery preview section is still visible
    await expect(page.getByRole('heading', { name: 'Gallery Preview' })).toBeVisible();
  });
});
