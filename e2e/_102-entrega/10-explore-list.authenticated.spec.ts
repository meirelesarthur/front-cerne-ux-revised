import { test } from '@playwright/test';
import { shot } from './lib';
test.use({ viewport: { width: 1700, height: 1100 } });
test('explore receber novo', async ({ page }) => {
  test.setTimeout(90_000);
  page.setDefaultTimeout(10000);
  await page.goto('/financeiro/receber/novo'); await page.waitForTimeout(9000);
  console.log('RINPUTS', (await page.locator('input:visible, textarea:visible').evaluateAll(e=>e.map(x=>(x as HTMLInputElement).name||x.id))).join(' ; '));
  await page.getByText('Rateio', { exact: true }).first().click(); await page.waitForTimeout(1500);
  console.log('RATEIO', (await page.locator('input:visible').evaluateAll(e=>e.map(x=>(x as HTMLInputElement).name||x.id))).join(' ; '));
  await shot(page, '796-explore-receber-aba-rateio');
});
