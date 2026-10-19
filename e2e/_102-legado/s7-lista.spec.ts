import { test } from '@playwright/test';
import { login, useFarm, FARM_MTZ, rec, shot, listaFiltrada, stateGet, setSel, selRow, headerFarm, pickSelect2Ajax } from './lib';

test('E7 - Lista de Mov. Caixa/Bancario (cenario 7)', async ({ page }) => {
  test.setTimeout(3_000_000);
  await login(page); await useFarm(page, FARM_MTZ);
  const st = stateGet();
  const cod = (k: string) => (st.movs || []).concat(st.transf || []).filter((m: any) => m.caso.startsWith(k)).map((m: any) => String(m.codigo));
  const grupos: any = { 'F-entrada(E2)': cod('E2-'), 'F-saida(E3)': cod('E3-'), 'T(E5)': cod('E5-') };
  const D = 'start_date=01/10/2026&end_date=31/10/2026&pagination_quantity=200';
  const casos: { id: string; qs: string; nota: string; ui?: boolean }[] = [
    { id: 'C01', qs: D, nota: 'periodo de outubro, sem filtro adicional' },
    { id: 'C02', qs: D + '&type_movement=E', nota: 'Tipo Mov = Entrada' },
    { id: 'C03', qs: D + '&type_movement=S', nota: 'Tipo Mov = Saida' },
    { id: 'C04', qs: D + '&type_category=F', nota: 'Filtro Tipo Cat = Financiamento (sem categoria)' },
    { id: 'C05', qs: D + '&type_category=T', nota: 'Filtro Tipo Cat = Trans. Interna (sem categoria)' },
    { id: 'C06', qs: D + '&type_category=E', nota: 'Filtro Tipo Cat = Entrada' },
    { id: 'C07', qs: D + '&type_category=S', nota: 'Filtro Tipo Cat = Saida' },
    { id: 'C08', qs: D + '&account=295', nota: 'Conta BRAD' },
    { id: 'C09', qs: D + '&account=293&type_movement=E', nota: 'Conta XP + Entrada' },
    { id: 'C10', qs: D + '&proprietary_id=230', nota: 'Proprietario 230' },
    { id: 'C11', qs: D + '&start_value=100,00&end_value=1000,00', nota: 'faixa de valor 100 a 1000' },
    { id: 'C12', qs: 'start_date=01/10/2026&end_date=31/10/2026&pagination_quantity=10', nota: 'paginacao 10 registros (rodape x pagina)' },
    { id: 'C13', qs: 'start_date=01/01/2026&end_date=31/01/2026&pagination_quantity=30', nota: 'janeiro/2026 (sem filtro)' },
    { id: 'C14', qs: D + '&type_category=T&category=600', nota: 'Tipo Cat T + categoria Saldo Inicial (600)' },
    { id: 'C15', qs: D + '&type_category=T&category=599', nota: 'Tipo Cat T + categoria Movimento entre contas (599)' },
    { id: 'C16', qs: D + '&type_category=S&category=28458', nota: 'Tipo Cat S + categoria Salarios Permanentes' },
    { id: 'C17', qs: D + '&type_category=E&category=28312', nota: 'Tipo Cat E + categoria Venda de Soja' },
    { id: 'C18', qs: 'account=295&start_date=01/01/2020&end_date=31/12/2026&pagination_quantity=10', nota: 'BRAD periodo longo, 10 por pagina (procura saldo inicial)' },
  ];
  for (const c of casos) {
    const obs: any = {};
    try {
      const l = await listaFiltrada(page, c.qs);
      const colE = l.rows.map((r: any) => r.cells[8]).filter(Boolean);
      obs.fazenda = await headerFarm(page);
      obs.caption = l.caption; obs.linhas = l.rows.length;
      obs.rodape = l.foot;
      obs.porES = { E: colE.filter((x: string) => x === 'E').length, S: colE.filter((x: string) => x === 'S').length, outros: colE.filter((x: string) => x !== 'E' && x !== 'S').length };
      obs.valoresSaida = l.rows.filter((r: any) => r.cells[8] === 'S').slice(0, 4).map((r: any) => r.cells[10] + ' | juros ' + r.cells[9]);
      obs.valoresEntrada = l.rows.filter((r: any) => r.cells[8] === 'E').slice(0, 4).map((r: any) => r.cells[10] + ' | juros ' + r.cells[9]);
      obs.comJuros = l.rows.filter((r: any) => r.cells[9] && r.cells[9] !== '0,00').slice(0, 5).map((r: any) => r.cells[1] + ': juros ' + r.cells[9] + ' valor ' + r.cells[10]);
      obs.nossosCodigosPresentes = {};
      for (const g of Object.keys(grupos)) { const cs = grupos[g]; obs.nossosCodigosPresentes[g] = `${cs.filter((x: string) => l.rows.some((r: any) => r.cells[1] === x)).length}/${cs.length}`; }
      obs.primeirasLinhas = l.rows.slice(0, 4).map((r: any) => r.cells.slice(1, 12).join(' | '));
      if (['C01', 'C04', 'C05', 'C14', 'C18'].includes(c.id)) await shot(page, `796-E7-${c.id}-legado-lista`);
    } catch (e: any) { obs.ERRO = String(e).slice(0, 300); }
    rec({ cenario: 7, caso: 'E7-' + c.id, entrada: { query: c.qs, descricao: c.nota }, observado: obs });
  }
  // filtro pela UI: Tipo Cat + Categoria (readonly ate escolher tipo)
  for (const [id, tp, term] of [['U01', 'S', 'sal'], ['U02', 'E', 've'], ['U03', 'T', 'sal'], ['U04', 'F', 'emp']]) {
    const obs: any = {};
    try {
      await page.goto('/movements?start_date=01/01/2026&end_date=31/12/2026'); await page.waitForLoadState('networkidle');
      obs.categoriaAntes = await page.evaluate(() => ({ readonly: document.getElementById('select-category')?.hasAttribute('readonly'), ph: document.querySelector('#select2-select-category-container')?.textContent }));
      await setSel(page, 'inp-type_category', tp); await page.waitForTimeout(500);
      obs.categoriaDepois = await page.evaluate(() => ({ readonly: document.getElementById('select-category')?.hasAttribute('readonly') }));
      const r = await pickSelect2Ajax(page, '#select-category + .select2 .select2-selection', term, 0).catch((e) => 'ERRO ' + String(e).slice(0, 80));
      obs.categoriaEscolhida = r;
      await page.locator('form[method=get] button[type=submit]').first().click(); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
      obs.urlAposFiltrar = page.url().replace('http://localhost:8081', '');
      obs.caption = await page.evaluate(() => document.querySelector('table caption')?.textContent?.trim());
      obs.tipoCatMantido = await page.evaluate(() => (document.getElementById('inp-type_category') as HTMLSelectElement).value);
      if (id === 'U01') await shot(page, `796-E7-${id}-legado-filtro-ui`);
    } catch (e: any) { obs.ERRO = String(e).slice(0, 300); }
    rec({ cenario: 7, caso: 'E7-' + id, entrada: { tipoCat: tp, busca: term }, observado: obs });
  }
});
