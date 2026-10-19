import { test } from '@playwright/test';
test('warm vite', async ({ page }) => {
  test.setTimeout(600_000);
  const t0 = Date.now();
  for (const [u, sel] of [['/financeiro/caixa', 'tbody tr'], ['/financeiro/caixa/novo', 'input[placeholder="DD/MM/YYYY"]'], ['/financeiro/pagar/novo', 'input[name=number]'], ['/financeiro/receber/novo', 'input[name=number]'], ['/financeiro/pagar', 'tbody tr']] as const) {
    await page.goto(u); await page.locator(sel).first().waitFor({ timeout: 180_000 }).catch(() => console.log('warm timeout', u));
    console.log('warm', u, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
});
