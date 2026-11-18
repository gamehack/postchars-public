import { test, expect } from '@playwright/test';

test('X weighting runs when selected and leaves other platform counters correct', async ({page}) => {
  await page.goto('/character-counter/');
  const input=page.locator('#text-input');
  await input.fill('中文'); // two visible graphemes, four X weighted characters
  await page.locator('.platform-option').filter({hasText:'Standard post'}).click();
  await expect(page.locator('.limit-copy strong')).toHaveText('4');
  await expect(page.locator('.stat-card').first()).toContainText('X weighted');
  await page.locator('.platform-option').filter({hasText:'Instagram'}).click();
  await expect(page.locator('.limit-copy strong')).toHaveText('2');
  await expect(page.locator('.stat-card').first()).toContainText('Characters');
  // Switching back must re-compute from the current draft.
  await input.fill('中文啊');
  await page.locator('.platform-option').filter({hasText:'Standard post'}).click();
  await expect(page.locator('.limit-copy strong')).toHaveText('6');
});

test('tool directory search results still update after a draft edit', async ({page}) => {
  await page.goto('/');
  await page.locator('#text-input').fill('an example text');
  const search=page.getByPlaceholder('Search');
  await search.fill('Bluesky');
  await expect(page.locator('a[href="/bluesky-character-counter/"]')).toHaveCount(1);
  await search.fill('not-a-real-postchars-tool-phrase');
  await expect(page.locator('a[href="/bluesky-character-counter/"]')).toHaveCount(0);
});
