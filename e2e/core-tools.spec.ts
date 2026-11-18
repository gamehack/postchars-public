import { test, expect } from '@playwright/test';
test('site search, text entry and local draft recovery', async ({ page }) => {
  await page.goto('/');
  const reject=page.getByRole('button',{name:'Reject optional'});
  if(await reject.isVisible())await reject.click();
  const editor=page.locator('#text-input');
  await expect(editor).toBeVisible();
  await editor.fill('A local draft for testing.');
  await page.getByLabel('Save drafts in this browser (opt-in)').check();
  await page.waitForTimeout(900); // wait for the deliberately debounced local save
  await page.reload();
  await expect(editor).toHaveValue('A local draft for testing.');
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Delete saved drafts'}).click();
  await expect(page.getByLabel('Save drafts in this browser (opt-in)')).not.toBeChecked();
});
test('Bluesky flags UTF-8 byte limit separately from grapheme limit',async ({page})=>{
  await page.goto('/bluesky-character-counter/');
  const input=page.locator('#tool-input');
  await input.fill('😀'.repeat(300));
  await expect(page.locator('#social-count')).toHaveText('300');
  await expect(page.locator('#social-status')).toContainText('Within');
  await input.fill('👩‍💻'.repeat(300));
  await expect(page.locator('#social-bytes')).toHaveText('3300');
  await expect(page.locator('#social-status')).toContainText('3,000-byte');
});
test('find and replace keeps the original and returns a literal preview',async ({page})=>{
  await page.goto('/find-and-replace-text/');
  await page.locator('#replace-original').fill('Cat cat cat.');
  await page.locator('#replace-query').fill('cat');
  await page.locator('#replace-with').fill('$&');
  await page.locator('#replace-all').click();
  await expect(page.locator('#replace-output')).toHaveValue('$& $& $&.');
  await expect(page.locator('#replace-original')).toHaveValue('Cat cat cat.');
});
test('X long draft produces individually numbered posts',async ({page})=>{
  await page.goto('/x-thread-splitter/');
  await page.locator('#sample-button').click();
  const posts=page.locator('#thread-results .pro-result-block');
  await expect(posts.first()).toBeVisible();
  expect(await posts.count()).toBeGreaterThan(1);
});
