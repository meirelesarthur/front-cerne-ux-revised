import { test } from '@playwright/test';
import { shot, pickChakra, pickAsync, group } from './lib';
test.use({ viewport: { width: 1600, height: 1700 } });
test('explore expense blocks', async ({ page }) => {
  test.setTimeout(100_000);
  page.setDefaultTimeout(8000);
  await page.goto('/financeiro/pagar/novo'); await page.waitForTimeout(9000);
  const step = async (n: string, f: () => Promise<any>) => { try { await f(); console.log('OK', n); } catch (e: any) { console.log('FAIL', n, String(e).slice(0, 150)); } };
  await step('modalidade', () => pickChakra(page, 'Modalidade', 'Direta'));
  await step('tipoopts', async () => { const t = group(page, 'Tipo').getByRole('combobox'); await t.click(); console.log('OPTS', (await page.locator('div[role=option]:visible').allInnerTexts()).join('|')); await page.keyboard.press('Escape'); });
  for (const tp of ['Pecuária', 'Manutenção']) {
    await step('tipo ' + tp, () => pickChakra(page, 'Tipo', tp));
    await page.waitForTimeout(1200);
    await shot(page, `795-explore-tipo-${tp}`);
    console.log('LABELS', tp, (await page.locator('label:visible').allInnerTexts()).join(' | '));
    console.log('INPUTS', tp, (await page.locator('input:visible, [role=combobox]:visible').evaluateAll((e) => e.map((x) => `${(x as HTMLInputElement).name || x.id}`))).join(' ; '));
  }
});
