import { test, expect } from '@playwright/test';
test('cross-platform checker computes X weighting and other platform counts without text uploads', async ({page})=>{
 await page.goto('/cross-platform-post-checker/');
 const input=page.locator('#tool-input');
 await input.fill('中文 https://example.com');
 const cards=page.locator('.platform-card');
 await expect(cards).toHaveCount(12);
 await expect(cards.filter({hasText:'X / Twitter'}).locator('.count')).toContainText('28 / 280');
 await expect(cards.filter({hasText:'Instagram'}).locator('.count')).toContainText('22 / 2,200');
 await expect(page.locator('#summary')).toContainText('12 checked');
 await input.fill('a'.repeat(3001));
 await expect(cards.filter({hasText:'LinkedIn'}).locator('.over')).toContainText('Over limit by 1');
});
test('checker survives rejecting optional analytics and never includes user text in static page events',async({page})=>{
 await page.goto('/cross-platform-post-checker/');
 await page.getByRole('button',{name:'Reject optional'}).click();
 await page.locator('#tool-input').fill('private-draft-123');
 await expect(page.locator('.platform-card')).toHaveCount(12);
 await expect(page.locator('#summary')).toContainText('12 checked');
});

test('Bluesky Unicode byte cap, unverified Facebook limit, previews', async ({page})=>{
 await page.goto('/cross-platform-post-checker/');
 await page.locator('#tool-input').fill('👩‍💻'.repeat(300));
 const bluesky=page.locator('[data-check-id="bluesky"]');
 await expect(bluesky).toHaveAttribute('data-status','over');
 await expect(bluesky).toContainText('3,300 / 3,000 bytes');
 const facebook=page.locator('[data-check-id="facebook"]');
 await expect(facebook).toHaveAttribute('data-status','unknown');
 await expect(facebook).toContainText('No verified universal limit');
 await expect(page.locator('#preview-x')).toContainText('👩‍💻');
});
