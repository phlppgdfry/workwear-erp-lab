const { test, expect } = require('@playwright/test');
async function downloaded(page, action) {
  const pending = page.waitForEvent('download'); await action(); const download = await pending;
  const stream = await download.createReadStream(); const chunks=[];
  for await (const chunk of stream) chunks.push(chunk);
  return {name:download.suggestedFilename(), data:Buffer.concat(chunks)};
}
test.beforeEach(async ({page}) => {
  page._errors=[]; page.on('pageerror',error=>page._errors.push(error.message));
});
test.afterEach(async ({page}) => { expect(page._errors).toEqual([]); });

test('compact queue, guided case history, session resolution, reset and filtered download', async ({page},testInfo) => {
  await page.goto('/');const order=page.getByRole('button',{name:'View WEB-NL-200011'});
  await expect(order).toBeVisible();
  if(testInfo.project.name==='mobile') { const box=await order.boundingBox(); expect(box.y+box.height).toBeLessThan(844); }
  await order.click();const dialog=page.getByRole('dialog'); await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Suggested next step');await expect(dialog).toContainText('company mapping');
  await page.getByLabel('Session note',{exact:true}).fill('Confirmed brand mapping with source owner.');
  await dialog.getByRole('button',{name:'Add session note'}).click();await expect(dialog).toContainText('Confirmed brand mapping with source owner.');
  await dialog.getByRole('button',{name:'Mark resolved',exact:true}).click();await expect(dialog).toContainText('Support record marked resolved.');
  await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(order).toBeFocused();
  await page.getByLabel('Brand',{exact:true}).selectOption('SHOETEQ');
  const file=await downloaded(page,()=>page.getByRole('button',{name:'Export selection'}).click());
  expect(file.data.toString()).toContain('WEB-NL-200011'); expect(file.data.toString()).not.toContain('WEB-FR-300099');expect(file.data.toString()).toContain('true');
  await page.getByRole('button',{name:'Reset demo'}).click();await page.getByLabel('Brand',{exact:true}).selectOption('');
  await page.getByLabel('Search orders').fill('NO-MATCH');await expect(page.locator('tbody')).toContainText('No exceptions match');
});
