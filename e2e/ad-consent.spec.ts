import { test, expect } from '@playwright/test';

test('public build keeps optional third-party integrations inactive by default', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', request => {
    try {
      const target = new URL(request.url());
      // Navigation requests can fire while page.url() is still about:blank.
      // Compare against the known local Playwright preview origin instead.
      if (target.origin !== 'http://127.0.0.1:4173') externalRequests.push(request.url());
    } catch {
      // Ignore non-HTTP request URLs.
    }
  });

  await page.goto('/');
  await expect(page.locator('iframe.native-ad-frame')).toHaveCount(0);
  await page.getByRole('button', { name: 'Allow analytics' }).click();

  await expect(page.locator('iframe.native-ad-frame')).toHaveCount(0);
  await expect(page.locator('script[src^="https://"]')).toHaveCount(0);
  expect(externalRequests).toEqual([]);
});

test('editorial guides do not mount third-party frames in the public default configuration', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', request => {
    try {
      const target = new URL(request.url());
      // Navigation requests can fire while page.url() is still about:blank.
      // Compare against the known local Playwright preview origin instead.
      if (target.origin !== 'http://127.0.0.1:4173') externalRequests.push(request.url());
    } catch {
      // Ignore non-HTTP request URLs.
    }
  });

  await page.goto('/guides/google-ads-character-limits/');
  await expect(page.locator('.guide-ad-slot iframe')).toHaveCount(0);
  await page.getByRole('button', { name: 'Allow analytics' }).click();
  await expect(page.locator('.guide-ad-slot iframe')).toHaveCount(0);
  expect(externalRequests).toEqual([]);
});
