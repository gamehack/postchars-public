import { test, expect } from '@playwright/test';

test('home discovers X counter without analytics consent', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('navigation', { name:'Popular purpose-built text tools' })).toBeVisible();
  await page.getByRole('button', {name:'Reject optional'}).click();
  await page.getByRole('navigation', { name:'Popular purpose-built text tools' }).getByRole('link',{name:'X/Twitter Counter'}).click();
  await expect(page).toHaveURL(/\/twitter-character-counter\/$/);
  await expect(page.getByRole('heading',{level:1})).toContainText('Twitter');
});
test('home discovers Google Ads counter without tracking permission', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button', {name:'Reject optional'}).click();
  await page.getByRole('navigation', { name:'Popular purpose-built text tools' }).getByRole('link',{name:'Google Ads Counter'}).click();
  await expect(page).toHaveURL(/\/google-ads-character-counter\/$/);
  await expect(page.getByRole('heading',{level:1})).toContainText('Google Ads');
});
