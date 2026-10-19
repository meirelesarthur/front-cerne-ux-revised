import { test } from '@playwright/test';
import { fillMovementUI, saveMovementUI, shot, logCase, loadState } from './lib';
test.use({ viewport: { width: 1600, height: 1500 } });
test('explore financiamento E/F', async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto('/home'); await page.waitForTimeout(1500);
  await fillMovementUI(page, { id: 'FX1', tp: 'S', tc: 'F', acc: 'accB', value: '250000', interest: '1000', date: '2026-10-14', party: 0, rateio: [{ cat: 0, center: 0, cents: '250000' }] });
  const res = await saveMovementUI(page);
  console.log('POST', res.status, JSON.stringify(res.body?.data?.generated_obligation_draft ?? res.body?.message));
  await page.waitForTimeout(9000);
  console.log('URL', page.url());
  await shot(page, '796-FX1-explore-redirect-nova-conta-receber');
  await page.getByText('Rateio', { exact: true }).first().click().catch(()=>{}); await page.waitForTimeout(1200); await shot(page, '796-FX1-explore-receber-aba-rateio'); console.log('RINPUTS', (await page.locator('input:visible').evaluateAll(e=>e.map(x=>(x as HTMLInputElement).name||x.id))).join(' ; ')); await page.getByText('Cabeçalho', { exact: true }).first().click().catch(()=>{}); await page.waitForTimeout(500);
  const labels = await page.locator('label').allInnerTexts(); console.log('LABELS', labels.join(' | '));
  const vals = await page.locator('input:visible, textarea:visible').evaluateAll(e=>e.map(x=>`${(x as HTMLInputElement).name||x.id}=${(x as HTMLInputElement).value}`)); console.log('VALS', vals.join(' ; '));
  const btns = await page.locator('button:visible').allInnerTexts(); console.log('BTNS', btns.filter(Boolean).join(' | '));
});
