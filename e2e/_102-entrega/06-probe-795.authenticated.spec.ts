import { test } from '@playwright/test';
import { apiGet, loadState, saveState } from './lib';
test('probe 795 data 2', async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto('/home'); await page.waitForTimeout(2500);
  const lot = '01a11be1-e802-7061-99ad-742afb1aa735';
  for (const q of [{ batch_uuid: lot }, { batch_uuid: lot, per_page: 100 }, { batch_uuid: lot, 'statuses[]': 'A', per_page: 100 }]) {
    const r = await apiGet(page, '/animals/options', q); console.log('ANIM', JSON.stringify(q), r.status, (r.body?.data ?? []).length, JSON.stringify(r.body?.data?.slice(0, 2)), JSON.stringify(r.body?.message));
  }
  // lotes com animais
  const st = loadState().p795; const lots = [...st.lotsByArea, ...st.lotsByGraz].filter((x: any) => x.nb > 0).flatMap((x: any) => x.b.map((b: any) => ({ ...b, via: x.area ?? x.g })));
  const withAn: any[] = [];
  for (const l of lots) { const r = await apiGet(page, '/animals/options', { batch_uuid: l.uuid, per_page: 100 }); const n = (r.body?.data ?? []).length; if (n > 0) withAn.push({ lot: l.label, uuid: l.uuid, n, via: l.via }); }
  console.log('LOTS COM ANIMAIS', JSON.stringify(withAn));
  const all: any[] = []; let page_ = 1;
  for (; page_ <= 6; page_++) { const r = await apiGet(page, '/equipments/options', { purpose: 'expense-maintenance', per_page: 100, page: page_ }); const d = r.body?.data ?? []; all.push(...d); if (d.length < 100) break; }
  const km = all.filter((e: any) => e.uses_mileage);
  console.log('EQ total', all.length, 'km', km.length, JSON.stringify(km.slice(0, 5)), 'fam', JSON.stringify([...new Set(all.map((e: any) => e.family?.description))]));
  saveState({ p795b: { withAn, km: km.slice(0, 6), nonKm: all.filter((e: any) => !e.uses_mileage).slice(0, 6).map((e:any)=>({uuid:e.uuid,code:e.code,description:e.description})) } });
});
