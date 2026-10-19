import { test } from '@playwright/test';
import { login, useFarm, FARM_MTZ, openMov, setSel, rec, shot, selRow, fillMoney, swalText, closeSwal, msgs, submitMov, setCentro, invalidos } from './lib';
test.beforeEach(async ({ page }) => { await login(page); await useFarm(page, FARM_MTZ); });

test('E8a - opcoes de Categoria por Tp.Categoria (cenario 8)', async ({ page }) => {
  test.setTimeout(900000);
  const casos: [string, string, string, string][] = [
    ['C01', 'E', 'E', 'ven'], ['C02', 'E', 'E', 'jur'], ['C03', 'E', 'E', 'emp'], ['C04', 'S', 'S', 'sal'], ['C05', 'S', 'S', 'adu'], ['C06', 'S', 'S', 'jur'],
    ['C07', 'E', 'T', 'com'], ['C08', 'S', 'T', 'ven'], ['C09', 'E', 'F', 'emp'], ['C10', 'E', 'F', 'fin'], ['C11', 'S', 'F', 'emp'], ['C12', 'S', 'F', 'jur'], ['C13', 'E', 'E', 've'],
  ];
  for (const [id, t, tp, term] of casos) {
    await openMov(page);
    let obs: any;
    try {
      await setSel(page, 'inp-type', t); await setSel(page, 'inp-type_category', tp);
      const todas = await selRow(page, 0, term, 0);
      const escolhida = await page.evaluate(() => (document.querySelector('select.select-categories') as HTMLSelectElement).selectedOptions[0]?.text?.trim() || '');
      const conta = await page.evaluate(() => (document.querySelector('#plan-account') as HTMLSelectElement)?.selectedOptions[0]?.text?.trim() || '');
      obs = { opcoesListadas: todas.length, primeiras: todas.slice(0, 8), escolhida, contaContabilAuto: conta };
      if (['C01', 'C04', 'C07', 'C09', 'C11'].includes(id)) await shot(page, `796-E8a-${id}-legado-categorias-${t}-${tp}-${term}`);
    } catch (e: any) { obs = { ERRO: String(e).slice(0, 250) }; }
    rec({ cenario: 8, caso: 'E8a-' + id, entrada: { tipo: t, tpCat: tp, busca: term }, observado: obs });
  }
});

test('E8b - calculo do rateio e validacoes (cenario 8)', async ({ page }) => {
  test.setTimeout(900000);
  type C = { id: string; valor: string; linhas: { term: string; valor?: string; pct?: string }[]; submit?: boolean; nota: string };
  const casos: C[] = [
    { id: 'C01', valor: '', linhas: [{ term: 'ven', pct: '10000' }], nota: 'sem valor do movimento -> preencher rateio' },
    { id: 'C02', valor: '100,00', linhas: [{ term: 'ven' }], nota: 'valor 100 apos categoria; 1 linha autopreenchida' },
    { id: 'C03', valor: '100,00', linhas: [{ term: 'ven', valor: '30,00' }, { term: 'jur', valor: '70,00' }], nota: '2 linhas por valor 30/70' },
    { id: 'C04', valor: '100,00', linhas: [{ term: 'ven', pct: '4000' }, { term: 'jur', pct: '6000' }], nota: '2 linhas por percentual 40/60' },
    { id: 'C05', valor: '100,00', linhas: [{ term: 'ven', valor: '60,00' }, { term: 'jur', valor: '60,00' }], nota: 'soma excede o valor' },
    { id: 'C06', valor: '100,00', linhas: [{ term: 'ven', valor: '30,00' }, { term: 'jur', valor: '30,00' }], submit: true, nota: 'soma menor que o valor + salvar' },
    { id: 'C07', valor: '99,99', linhas: [{ term: 'ven', pct: '3333' }, { term: 'jur', pct: '3333' }, { term: 'com', pct: '3334' }], nota: '3 linhas 33,33/33,33/33,34 sobre 99,99' },
    { id: 'C08', valor: '1000,00', linhas: [{ term: 'ven', pct: '5000' }, { term: 'jur', pct: '5001' }], nota: 'percentual total 100,01' },
    { id: 'C09', valor: '0,01', linhas: [{ term: 'ven' }], nota: 'valor 1 centavo' },
    { id: 'C10', valor: '12345678,90', linhas: [{ term: 'ven' }], nota: 'valor grande' },
    { id: 'C11', valor: '100,00', linhas: [{ term: 'ven', valor: '100,00' }, { term: 'jur', valor: '0,00' }], nota: 'segunda linha zerada' },
    { id: 'C12', valor: '100,00', linhas: [{ term: 'ven' }], nota: 'trocar valor depois do rateio (100 -> 250)' },
  ];
  for (const c of casos) {
    await openMov(page);
    let obs: any = { avisos: [] };
    try {
      await setSel(page, 'inp-type', 'E'); await setSel(page, 'inp-type_category', 'E');
      await setSel(page, 'inp-account_id', '295'); await setSel(page, 'inp-proprietary_id', '189');
      if (c.valor) await fillMoney(page, '#inp-value', c.valor);
      for (let i = 0; i < c.linhas.length; i++) {
        if (i > 0) { await page.locator('.btn-add').first().click(); await page.waitForTimeout(500); }
        await selRow(page, i, c.linhas[i].term);
        const row = page.locator('table.table-dynamic:visible tbody tr').nth(i);
        await setCentro(row, '761');
        const sw0 = await swalText(page); if (sw0) { obs.avisos.push('apos categoria: ' + sw0); await closeSwal(page); }
        const tgt = c.linhas[i].valor ? '.category-values' : c.linhas[i].pct ? '.category-percents' : null;
        const v = c.linhas[i].valor || c.linhas[i].pct;
        if (tgt) { const el = row.locator(tgt); await el.click(); await el.fill(''); await el.type(v!, { delay: 15 }); await el.blur(); await page.waitForTimeout(500); const sw = await swalText(page); if (sw) { obs.avisos.push(`linha ${i + 1}: ${sw}`); await closeSwal(page); } }
      }
      if (c.id === 'C12') { await fillMoney(page, '#inp-value', '250,00'); const sw = await swalText(page); if (sw) { obs.avisos.push(sw); await closeSwal(page); } }
      obs.linhas = await page.evaluate(() => [...(document.querySelectorAll('table.table-dynamic')[0] as HTMLElement).querySelectorAll('tbody tr')].map(r => ({ valor: (r.querySelector('.category-values') as HTMLInputElement).value, pct: (r.querySelector('.category-percents') as HTMLInputElement).value })));
      obs.totais = await page.evaluate(() => ({ totalRateado: document.querySelector('#category-total')?.textContent, pctTotal: document.querySelector('#category-percent')?.textContent?.trim(), valorTitulo: document.querySelector('#total-title-value')?.textContent }));
      if (c.submit || c.valor === '') {
        // tentativa de salvar com rateio inconsistente (nao grava quando bloqueado)
        const r = await submitMov(page); obs.salvar = r;
        if (r.url.endsWith('/movements')) obs.ATENCAO = 'gravou - ver codigo na lista';
      }
      if (['C03', 'C05', 'C06'].includes(c.id)) await shot(page, `796-E8b-${c.id}-legado-rateio`);
    } catch (e: any) { obs.ERRO = String(e).slice(0, 250); }
    rec({ cenario: 8, caso: 'E8b-' + c.id, entrada: { valorMovimento: c.valor || '(vazio)', linhas: c.linhas, descricao: c.nota }, observado: obs });
  }
});
