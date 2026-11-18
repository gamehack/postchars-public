import { test, expect } from '@playwright/test';

async function trackedEvents(page: import('@playwright/test').Page) {
  return page.evaluate(() => (window as typeof window & {dataLayer?: unknown[]}).dataLayer
    ?.filter((row): row is IArguments => typeof row === 'object' && row !== null && 'length' in row && (row as IArguments)[0] === 'event')
    .map(row => ({ name: String(row[1]), params: row[2] as Record<string, unknown> })) || []);
}

test('static tool analytics uses explicit consent and never includes user text', async ({page}) => {
  // Block analytics transport but retain the gtag queue so event payloads
  // can be inspected without sending test data to a live GA4 property.
  await page.route('**/gtag/js*', route => route.abort());
  await page.goto('/sort-lines-alphabetically/');
  await page.getByRole('button', {name:'Reject optional'}).click();
  await page.locator('#tool-input').fill('private-first-draft');
  expect((await trackedEvents(page)).filter(x=>x.name==='tool_engaged')).toHaveLength(0);

  await page.getByRole('button', {name:'Privacy choices'}).click();
  await page.getByRole('button', {name:'Allow analytics'}).click();
  await page.locator('#tool-input').fill('private-second-draft');
  await page.getByRole('button',{name:'Copy result'}).click();
  const events=await trackedEvents(page);
  expect(events.filter(x=>x.name==='tool_engaged')).toEqual([{
    name:'tool_engaged',params:{tool_id:'sort-lines-alphabetically',tool_kind:'list'}
  }]);
  expect(events.filter(x=>x.name==='tool_action_click')).toContainEqual({
    name:'tool_action_click',params:{tool_id:'sort-lines-alphabetically',action:'copy_clicked'}
  });
  expect(JSON.stringify(events)).not.toContain('private-first-draft');
  expect(JSON.stringify(events)).not.toContain('private-second-draft');
  expect(events.some(x=>x.name==='guide_engaged')).toBe(false);

  await page.getByRole('button',{name:'Privacy choices'}).click();
  await page.getByRole('button',{name:'Reject optional'}).click();
  await page.locator('#tool-input').fill('private-third-draft');
  await page.getByRole('button',{name:'Copy result'}).click();
  expect(await trackedEvents(page)).toEqual(events);
});

test('actual editorial guide retains guide-engagement event', async ({page}) => {
  await page.route('**/gtag/js*', route => route.abort());
  await page.goto('/guides/google-ads-character-limits/');
  await page.getByRole('button',{name:'Allow analytics'}).click();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(async()=> (await trackedEvents(page)).filter(x=>x.name==='guide_engaged').length).toBeGreaterThan(0);
});
