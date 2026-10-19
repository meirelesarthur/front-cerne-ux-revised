import { test } from '@playwright/test';
import { login, useFarm, FARM_MTZ, openMov, movState, setSel, rec, shot, selRow, fillMoney, swalText, closeSwal, msgs, submitMov, setCentro, headerFarm } from './lib';

test.beforeEach(async ({ page }) => { await login(page); await useFarm(page, FARM_MTZ); });

test('E1 - Tipo x Tp.Categoria (cenario 1)', async ({ page }) => {
  test.setTimeout(600000);
  const casos: [string, string, string][] = [
    ['C01', '', ''], ['C02', 'E', ''], ['C03', 'S', ''], ['C04', 'E', 'E'], ['C05', 'E', 'T'], ['C06', 'E', 'F'],
    ['C07', 'S', 'S'], ['C08', 'S', 'T'], ['C09', 'S', 'F'], ['C10', 'E', 'S*'], ['C11', 'S', 'E*'], ['C12', 'E', 'F>vazio'],
  ];
  for (const [id, t, c] of casos) {
    await openMov(page);
    const ent: any = { tipo: t || '(nenhum)', tpCat: c || '(nenhum)', fazenda: await headerFarm(page) };
    let obs: any;
    try {
      if (t) await setSel(page, 'inp-type', t);
      if (c.endsWith('*')) {
        // tentativa pela UI de escolher opção desabilitada
        const real = c.replace('*', '');
        const r = await page.selectOption('#inp-type_category', real, { timeout: 2500 }).then(() => 'selecionou').catch(() => 'nao-selecionavel-pela-UI(opcao desabilitada)');
        obs = { tentativaSelecionar: r, ...(await movState(page)) };
      } else if (c === 'F>vazio') {
        await setSel(page, 'inp-type_category', 'F'); await setSel(page, 'inp-type_category', '');
        obs = await movState(page);
      } else {
        if (c) await setSel(page, 'inp-type_category', c);
        obs = await movState(page);
      }
    } catch (e: any) { obs = { ERRO: String(e).slice(0, 200) }; }
    const sh = ['C04', 'C06', 'C09'].includes(id) ? `796-E1-${id}-legado-estado-tipo-${t}-tp-${c.replace('*','x')}` : undefined;
    if (sh) await shot(page, sh);
    rec({ cenario: 1, caso: 'E1-' + id, entrada: ent, observado: obs, screenshot: sh });
  }
});

test('E4 - Trocar o Tipo limpa o que (cenario 4)', async ({ page }) => {
  test.setTimeout(900000);
  const casos = [
    { id: 'C01', t: 'E', tp: 'E', cli: 2, prov: null, cats: ['ven'], novo: 'S' },
    { id: 'C02', t: 'E', tp: 'F', cli: null, prov: 4, cats: ['emp'], novo: 'S' },
    { id: 'C03', t: 'E', tp: 'T', cli: null, prov: null, cats: ['mov'], novo: 'S', dest: '293' },
    { id: 'C04', t: 'S', tp: 'S', cli: null, prov: 6, cats: ['sal'], novo: 'E' },
    { id: 'C05', t: 'S', tp: 'F', cli: 8, prov: null, cats: ['emp'], novo: 'E' },
    { id: 'C06', t: 'S', tp: 'T', cli: null, prov: null, cats: ['mov'], novo: 'E', dest: '294' },
    { id: 'C07', t: 'E', tp: 'E', cli: 3, prov: null, cats: ['ven', 'jur'], novo: 'S' },
    { id: 'C08', t: 'S', tp: 'S', cli: null, prov: 9, cats: ['sal', 'adu', 'com'], novo: 'E' },
    { id: 'C09', t: 'E', tp: 'E', cli: 5, prov: null, cats: ['ven'], novo: 'E' },
    { id: 'C10', t: 'S', tp: 'S', cli: null, prov: 7, cats: ['sal'], novo: 'S' },
    { id: 'C11', t: 'E', tp: 'F', cli: null, prov: 10, cats: ['emp', 'jur'], novo: 'S' },
    { id: 'C12', t: 'S', tp: 'F', cli: 11, prov: null, cats: ['jur'], novo: '' },
  ];
  for (const c of casos) {
    if (process.env.ONLY4 && !process.env.ONLY4.split(',').includes(c.id)) continue;
    await openMov(page);
    let antes: any, depois: any, centrosDepois: any;
    try {
      await setSel(page, 'inp-type', c.t); await setSel(page, 'inp-type_category', c.tp);
      if ((c as any).dest) await setSel(page, 'inp-destination_account_id', (c as any).dest);
      if (c.cli != null) { const v = await page.evaluate((i) => { const o = [...(document.getElementById('inp-client_id') as HTMLSelectElement).options].filter(x => x.value); return o[i].value; }, c.cli); await setSel(page, 'inp-client_id', v); }
      if (c.prov != null) { const v = await page.evaluate((i) => { const o = [...(document.getElementById('inp-provider_id') as HTMLSelectElement).options].filter(x => x.value); return o[i].value; }, c.prov); await setSel(page, 'inp-provider_id', v); }
      await fillMoney(page, '#inp-value', '100,00');
      for (let i = 0; i < c.cats.length; i++) { if (i > 0) { await page.locator('.btn-add').first().click(); await page.waitForTimeout(500); } await selRow(page, i, c.cats[i]); await setCentro(page.locator('table.table-dynamic:visible tbody tr').nth(i), '761'); if (c.cats.length > 1 && i < c.cats.length - 1) { const vi = page.locator('table.table-dynamic:visible tbody tr').nth(i).locator('.category-values'); await vi.click(); await vi.fill(''); await vi.type('3000', { delay: 15 }); await vi.blur(); await page.waitForTimeout(400); } }
      const snap = async () => ({ ...(await movState(page)), clienteTxt: await page.evaluate(() => (document.getElementById('inp-client_id') as HTMLSelectElement).selectedOptions[0]?.text || ''), fornecedorTxt: await page.evaluate(() => (document.getElementById('inp-provider_id') as HTMLSelectElement).selectedOptions[0]?.text.slice(0, 40) || ''), destino: await page.evaluate(() => (document.getElementById('inp-destination_account_id') as HTMLSelectElement).value), valor: await page.inputValue('#inp-value'), nLinhasRateio: await page.locator('table.table-dynamic:visible tbody tr').count() });
      antes = await snap();
      if (c.id === 'C01' || c.id === 'C08') await shot(page, `796-E4-${c.id}-legado-antes-troca`);
      await setSel(page, 'inp-type', c.novo);
      depois = await snap();
      if (c.id === 'C01' || c.id === 'C08') await shot(page, `796-E4-${c.id}-legado-depois-troca-${c.novo}`);
    } catch (e: any) { depois = { ERRO: String(e).slice(0, 250) }; }
    rec({ cenario: 4, caso: 'E4-' + c.id, entrada: { tipoInicial: c.t, tpCat: c.tp, cliente: c.cli, fornecedor: c.prov, categoriasRateio: c.cats, novoTipo: c.novo || '(vazio)' }, observado: { antes, depois }, screenshot: (c.id === 'C01' || c.id === 'C08') ? `796-E4-${c.id}-*` : undefined });
  }
});
