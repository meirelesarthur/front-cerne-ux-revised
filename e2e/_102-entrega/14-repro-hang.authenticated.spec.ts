import { test } from '@playwright/test';
import { fillMovementUI, saveMovementUI, shot, MovCase } from './lib';
test.use({ viewport: { width: 1600, height: 1500 } });
const R = (cat: number, center: number, cents: string) => ({ cat, center, cents });
const base: MovCase = { id: 'RH', tp: 'E', tc: 'F', acc: 'accD', value: '500000', interest: '50', date: '2026-10-10', party: 3, prop: 1, rateio: [R(2, 2, '500000')] };
const b2: MovCase = { id: 'RH', tp: 'E', tc: 'F', acc: 'accB', value: '100000', date: '2026-10-14', party: 0, rateio: [R(0, 0, '100000')] };
const variants: (MovCase & { tag: string })[] = [
  { ...b2, tag: 'base-OK', id: 'RH1' },
  { ...b2, tag: 'data-10-10', id: 'RH2', date: '2026-10-10' },
  { ...b2, tag: 'contaD', id: 'RH3', acc: 'accD' },
  { ...b2, tag: 'cat2-centro2', id: 'RH4', rateio: [R(2, 2, '100000')] },
  { ...b2, tag: 'valor-5000', id: 'RH5', value: '500000', rateio: [R(0, 0, '500000')] },
  { ...b2, tag: 'juros-0,50', id: 'RH6', interest: '50' },
  { ...b2, tag: 'prop1', id: 'RH7', prop: 1 },
  { ...b2, tag: 'data-futura-12-01', id: 'RH8', date: '2026-12-01' },
  { ...b2, tag: 'contaC', id: 'RH9', acc: 'accC' },
  { ...b2, tag: 'contaA', id: 'RH10', acc: 'accA' },
];
variants.slice(0, 2).forEach((c) => test(`repro ${c.tag}`, async ({ page }) => {
  test.setTimeout(200_000);
  const pending = new Map<string, string>();
  const T = Date.now(); const allReq: string[] = [];
  page.on('request', (r) => { pending.set(r.url() + r.method(), `${((Date.now() - T) / 1000).toFixed(1)}s ${r.method()} ${r.url().slice(0, 130)}`); });
  page.on('response', (r) => { if (r.status() >= 400) allReq.push(`HTTP${r.status()} ${r.url().slice(0, 120)}`); });
  page.on('requestfinished', (r) => pending.delete(r.url() + r.method()));
  page.on('requestfailed', (r) => { allReq.push('FAILED ' + r.url().slice(0, 130) + ' ' + r.failure()?.errorText); pending.delete(r.url() + r.method()); });
  await page.goto('/home'); await page.waitForTimeout(1500);
  await fillMovementUI(page, c, true);
  await saveMovementUI(page);
  await page.waitForURL(/fromMovement=/, { timeout: 20000 }).catch(() => {});
  const tRedirect = ((Date.now() - T) / 1000).toFixed(1);
  const t0 = Date.now(); let state = 'blank';
  for (let i = 0; i < 20; i++) { if (await page.locator('input[name=number]').count()) { state = 'loaded'; break; } await page.waitForTimeout(1000); }
  const diag = await page.evaluate(() => ({   ss: Object.keys(sessionStorage).filter((k) => /obligation/.test(k)), path: location.pathname + location.search }));
  console.log(`RH ${c.tag}: ${state} after ${((Date.now() - t0) / 1000).toFixed(0)}s diag=${JSON.stringify(diag)} redirectAt=${tRedirect}s pending=${JSON.stringify([...pending.values()].slice(0, 10))} errosHttp=${JSON.stringify(allReq.slice(0, 6))}`);
  if (state === 'blank') await shot(page, `796-repro-${c.tag}-em-branco`).catch(() => {});
}));
