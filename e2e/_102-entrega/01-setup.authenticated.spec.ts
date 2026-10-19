import { test } from '@playwright/test';
import { apiGet, apiSend, saveState } from './lib';

test('setup QA102: contas e dados-base via API', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/home'); await page.waitForTimeout(3000);
  const st: any = {};
  const mk = async (code: string, desc: string) => {
    const r = await apiSend(page, 'post', '/accounts', {
      bank: 'QA102 Banco', agency: '0102', account: `${code}-1`, type: 'C', limit: 0, is_enabled: true,
      code, description: desc, is_ticket: false, use_cash_book: true, farm_uuids: [],
    });
    console.log('create account', desc, r.status, JSON.stringify(r.body).slice(0, 300));
    return r.body?.data?.uuid;
  };
  st.accA = await mk('Q1A', 'QA102 Conta A baixo');
  st.accB = await mk('Q1B', 'QA102 Conta B medio');
  st.accC = await mk('Q1C', 'QA102 Conta C destino');
  st.accD = await mk('Q1D', 'QA102 Conta D extra');
  const farm = await page.evaluate(() => localStorage.getItem('app-active-farm'));
  st.farm = farm;
  const o = async (p: string, q: any = {}) => (await apiGet(page, p, q)).body?.data ?? [];
  st.provs = (await o('/providers/options', { per_page: 15 })).slice(0, 12);
  st.clients = (await o('/clients/options', { per_page: 15 })).slice(0, 12);
  st.props = await o('/proprietaries/options');
  st.catE = (await o('/financial-categories/options', { per_page: 30, type_id: 2, cost_center_scoped: 'true' })).slice(0, 12);
  st.catS = (await o('/financial-categories/options', { per_page: 30, type_id: 1, cost_center_scoped: 'true' })).slice(0, 12);
  st.catT = (await o('/financial-categories/options', { per_page: 30, bank_movement_scoped: 'true', class: 2, is_enabled: 'true' })).slice(0, 5);
  st.centers = (await o('/cost-centers/options', { per_page: 50 }));
  saveState(st);
  console.log(JSON.stringify({ farm, accs: [st.accA, st.accB, st.accC, st.accD], provs: st.provs.length, clients: st.clients.length, props: st.props.length, catE: st.catE.length, catS: st.catS.length, catT: st.catT.length, centers: st.centers.length }));
  console.log('catE sample', JSON.stringify(st.catE.slice(0,2)), 'catT', JSON.stringify(st.catT.slice(0,2)), 'center', JSON.stringify(st.centers.slice(0,3)));
});
