import { test, expect } from '@playwright/test';

test('React editor only consumes its engagement marker after analytics opt-in', async ({page}) => {
  await page.route('**/gtag/js*', route => route.abort());
  await page.goto('/');
  await page.getByRole('button',{name:'Reject optional'}).click();
  await page.locator('#text-input').fill('draft-before-consent');

  const getEvents = () => page.evaluate(() => {
    const entries=(window as typeof window & {dataLayer?: unknown[]}).dataLayer||[];
    return entries.filter((row): row is IArguments =>
      typeof row==='object'&&row!==null&&'length' in row&&(row as IArguments)[0]==='event')
      .map(row => ({name:String(row[1]),params:row[2] as Record<string,unknown>}));
  });
  expect((await getEvents()).filter(e=>e.name==='tool_engaged')).toHaveLength(0);

  await page.getByRole('button',{name:'Privacy choices'}).click();
  await page.getByRole('button',{name:'Allow analytics'}).click();
  await page.locator('#text-input').fill('new-edit-after-consent');
  const acceptedEvents=(await getEvents()).filter(e=>e.name==='tool_engaged');
  expect(acceptedEvents).toEqual([{name:'tool_engaged',params:{page_type:'home'}}]);
  expect(JSON.stringify(acceptedEvents)).not.toContain('new-edit-after-consent');

  await page.getByRole('button',{name:'Privacy choices'}).click();
  await page.getByRole('button',{name:'Reject optional'}).click();
  await page.locator('#text-input').fill('more-private-text');
  expect((await getEvents()).filter(e=>e.name==='tool_engaged')).toHaveLength(1);
});
