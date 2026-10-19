import { test } from '@playwright/test';
import { apiGet } from './lib';
import * as fs from 'fs';
test('probe', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/home'); await page.waitForTimeout(3000);
  const out: any = {};
  const paths: [string, any][] = [
    ['/accounts', { per_page: 50 }], ['/providers/options', { per_page: 30 }], ['/clients/options', { per_page: 30 }],
    ['/proprietaries/options', {}], ['/financial-categories/options', { per_page: 100 }],
    ['/cost-centers/options', { per_page: 100 }], ['/equipments/options', { per_page: 100 }],
    ['/movements', { per_page: 10 }], ['/expenses/appropriation-types/options', {}],
    ['/areas/options', { per_page: 20 }], ['/family-equipments/options', {per_page: 50}],
    ['/animal-batches', {per_page: 20}], ['/activities/options', {per_page:50}], ['/farms/current-tenant', {}],
  ];
  for (const [p, q] of paths) { const r = await apiGet(page, p, q); out[p] = { status: r.status, body: r.body }; }
  fs.writeFileSync('/tmp/claude-1000/-home-pietro-ambiente/573685d7-0cbe-45d5-82b6-020d81e9fd72/scratchpad/probe.json', JSON.stringify(out, null, 1));
  for (const k of Object.keys(out)) console.log(k, out[k].status, JSON.stringify(out[k].body)?.slice(0, 200));
});
