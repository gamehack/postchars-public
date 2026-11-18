import { test, expect } from '@playwright/test';

test('SERP snippet preview is usable on desktop and mobile without analytics', async ({ page }) => {
  await page.goto('/serp-snippet-preview/');
  await page.getByRole('button', { name: 'Reject optional' }).click();
  await page.getByRole('button', { name: 'Mobile preview' }).click();
  await expect(page.locator('#serp-preview')).toHaveClass(/growth-serp-mobile/);
  await expect(page.getByRole('button', { name: 'Mobile preview' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Try example' }).click();
  await expect(page.locator('#seo-title')).toHaveValue('Free Character Counter – Count Text Online');
  await expect(page.locator('#preview-title')).toContainText('Free Character Counter');
  await expect(page.locator('#seo-html')).toHaveValue(/<title>/);

  await page.getByRole('button', { name: 'Desktop preview' }).click();
  await expect(page.locator('#serp-preview')).not.toHaveClass(/growth-serp-mobile/);
  await expect(page.getByRole('button', { name: 'Desktop preview' })).toHaveAttribute('aria-pressed', 'true');
});

test('readability examples and related editing cluster are readable without JavaScript', async ({ page }) => {
  await page.goto('/readability-checker/');
  await expect(page.getByRole('heading', { name: 'What does my Flesch Reading Ease score mean?' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'word and phrase frequency checker' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Check repeated wording' })).toHaveAttribute('href', '/keyword-density-checker/');
  await expect(page.getByRole('link', { name: 'Review SEO title and description' })).toHaveAttribute('href', '/serp-snippet-preview/');
});
