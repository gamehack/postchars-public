import { test, expect } from '@playwright/test';

test('word density target comparison and CSV export stay in the browser', async ({ page }) => {
  await page.goto('/keyword-density-checker/');
  await page.locator('#tool-text').fill('Landing page landing page.');
  await page.locator('#target-keyword').fill('landing page');
  await expect(page.locator('#target-count')).toHaveText('2');
  await expect(page.locator('#target-density')).toHaveText('50.00%');
  await page.locator('#compare-draft').fill('Landing page only.');
  await expect(page.locator('#target-compare')).toContainText('1 occurrences / 33.33%');
  const event = page.waitForEvent('download');
  await page.locator('#export-csv').click();
  const downloaded = await event;
  expect(downloaded.suggestedFilename()).toBe('postchars-word-density.csv');
});

test('character diff is grapheme aware and switches to side-by-side line view', async ({ page }) => {
  await page.goto('/text-diff-checker/');
  await page.locator('#diff-original').fill('A👩‍💻B');
  await page.locator('#diff-revised').fill('A👩‍🚀B');
  await page.locator('#diff-mode').selectOption('characters');
  await page.locator('#compare-button').click();
  await expect(page.locator('#diff-added')).toHaveText('1');
  await expect(page.locator('#diff-removed')).toHaveText('1');
  await expect(page.locator('.editor-diff-character.editor-diff-added')).toHaveCount(1);
  await page.locator('#diff-mode').selectOption('lines');
  await page.locator('#diff-view').selectOption('side-by-side');
  await expect(page.locator('.editor-diff-column')).toHaveCount(2);
});

test('local comparison imports only the chosen text file', async ({ page }) => {
  await page.goto('/text-diff-checker/');
  await page.locator('#diff-original-file').setInputFiles({ name: 'before.txt', mimeType: 'text/plain', buffer: Buffer.from('old line') });
  await expect(page.locator('#diff-original')).toHaveValue('old line');
  await page.locator('#diff-revised-file').setInputFiles({ name: 'after.txt', mimeType: 'text/plain', buffer: Buffer.from('new line') });
  await expect(page.locator('#diff-revised')).toHaveValue('new line');
  await expect(page.locator('#diff-added')).toHaveText('1');
});

test('Unicode normalization and mixed-script hints are not destructive', async ({ page }) => {
  await page.goto('/unicode-character-inspector/');
  await page.locator('#tool-input').fill('cafe\u0301 and p\u0430ypal');
  await expect(page.locator('#unicode-nfc')).toHaveText('Different from NFC');
  await expect(page.locator('#unicode-mixed')).toHaveText('1');
  await expect(page.locator('#unicode-mixed-examples')).toContainText('Latin');
  await expect(page.locator('#tool-input')).toHaveValue('cafe\u0301 and p\u0430ypal');
});
