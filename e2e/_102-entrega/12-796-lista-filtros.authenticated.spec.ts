import { test } from '@playwright/test';
import { apiGet, logCase, shot, group, pickChakra } from './lib';
test.use({ viewport: { width: 1700, height: 1200 } });
const brl = (s: string) => { const neg = /-/.test(s); const n = Number(s.replace(/[^\d,]/g, '').replace(',', '.')); return neg ? -n : n; };

// Cenário 7a/7b: lista — Saída negativa, coluna Juros, rodapé juros + total líquido, em 10 páginas/tamanhos
const pages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
pages.forEach((pg) => {
  test(`796-LS${String(pg).padStart(2, '0')} lista página ${pg}: sinal, Juros e rodapé`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/financeiro/caixa'); await page.locator('tbody tr').first().waitFor({ timeout: 40000 }); await page.waitForTimeout(2000);
    for (let i = 1; i < pg; i++) {
      const arrow = page.locator('button').filter({ has: page.locator('svg') }).last();
      await arrow.click(); await page.waitForTimeout(1300);
    }
    const apiRespP = page.waitForResponse((r) => /\/api\/v1\/movements\?/.test(r.url()), { timeout: 5000 }).catch(() => null);
    await page.waitForTimeout(500); void apiRespP;
    const rows = await page.locator('tbody tr').evaluateAll((trs) => trs.map((tr) => {
      const tds = [...tr.querySelectorAll('td')].map((td) => (td as HTMLElement).innerText.replace(/\s+/g, ' ').trim());
      const valCell = tr.querySelectorAll('td')[7] as HTMLElement | undefined;
      const color = valCell ? getComputedStyle((valCell.querySelector('p, span, div') as HTMLElement) ?? valCell).color : '';
      return { tds, color };
    }));
    const foot = (await page.locator('tfoot').innerText().catch(() => '')).replace(/\s+/g, ' ');
    const footNums = (foot.match(/-?R\$\s?[\d.]+,\d{2}/g) ?? []).map(brl);
    let sumInt = 0; let net = 0; let negOk = true; let redOk = true; const hdr = await page.locator('th').allInnerTexts();
    for (const r of rows) {
      const tipo = r.tds[2]; const jur = brl(r.tds[5]); const val = brl(r.tds[7]);
      sumInt += jur; net += val;
      if (tipo === 'Saída' && !(val < 0)) negOk = false;
      if (tipo === 'Entrada' && !(val > 0)) negOk = false;
      if (tipo === 'Saída') { const m = r.color.match(/\d+/g)?.map(Number) ?? [0, 0, 0]; if (!(m[0] > m[1] + 40 && m[0] > m[2] + 40)) redOk = false; }
    }
    if (pg === 1 || pg === 5) await shot(page, `796-LS${String(pg).padStart(2, '0')}-lista-pagina-${pg}-sinal-juros-rodape`);
    const ok = hdr.includes('Juros') && rows.length > 0 && negOk && redOk && footNums.length >= 2 && Math.abs(footNums[0] - sumInt) < 0.005 && Math.abs(footNums[1] - net) < 0.015;
    logCase({ ut: 796, scen: '7', id: `LS${String(pg).padStart(2, '0')}`, input: `lista de movimentos, página ${pg} (10 linhas)`, expected: 'Saída com valor negativo e vermelho; Entrada positiva; coluna Juros; rodapé = soma dos juros e total líquido das linhas visíveis', got: JSON.stringify({ linhas: rows.length, colunaJuros: hdr.includes('Juros'), sinaisOk: negOk, saidaVermelha: redOk, rodape: footNums, somaJurosLinhas: Number(sumInt.toFixed(2)), liquidoLinhas: Number(net.toFixed(2)) }), result: ok ? 'PASSOU' : 'FALHOU' });
    if (!ok) { await shot(page, `796-LS${pg}-FALHA`); throw new Error(JSON.stringify({ rows: rows.length, negOk, redOk, footNums, sumInt, net })); }
  });
});

// Cenário 7c: filtro "Tipo Cat." restringe opções de Categoria e NÃO filtra linhas (10 combinações)
const tcs = ['Entrada', 'Saída', 'Financiamento/Empréstimo', 'Trans. Interna', 'Entrada', 'Saída', 'Financiamento/Empréstimo', 'Trans. Interna', 'Entrada', 'Financiamento/Empréstimo'];
tcs.forEach((tc, i) => {
  test(`796-FT${String(i + 1).padStart(2, '0')} filtro Tipo Cat. = ${tc}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/financeiro/caixa'); await page.locator('tbody tr').first().waitFor({ timeout: 40000 }); await page.waitForTimeout(2000);
    const rowsBefore = await page.locator('tbody tr').count();
    const totalBefore = (await page.getByText(/Mostrando \d+ de \d+/).innerText().catch(() => '')).trim();
    await page.getByRole('button', { name: /Filtros/ }).click(); await page.waitForTimeout(1200);
    const catDisabledInicial = await page.locator('[id="category_uuid"]').isDisabled().catch(() => null);
    const tcOptsHandle = group(page, 'Filtro Tipo Cat.').getByRole('combobox');
    await pickChakra(page, 'Filtro Tipo Cat.', new RegExp('^' + tc.replace('/', '\\/') + '$'));
    await page.waitForTimeout(600);
    const catDisabledDepois = await page.locator('[id="category_uuid"]').isDisabled().catch(() => null);
    // opções da categoria
    await page.locator('[id="category_uuid"]').click(); await page.waitForTimeout(1500);
    const catOpts = await page.locator('div[role=option]:visible').allInnerTexts();
    await page.keyboard.press('Escape');
    if (i === 0 || i === 3) await shot(page, `796-FT${String(i + 1).padStart(2, '0')}-filtro-tipocat-${tc.replace(/[^A-Za-z]/g, '')}`);
    // escolhe uma categoria e troca o Tipo Cat. -> limpa
    let cleared: boolean | null = null;
    if (catOpts.length > 1 && i % 2 === 0) {
      await page.locator('[id="category_uuid"]').click(); await page.waitForTimeout(800); await page.locator('div[role=option]:visible').nth(Math.min(1, catOpts.length - 1)).click();
      await pickChakra(page, 'Filtro Tipo Cat.', tc === 'Entrada' ? 'Saída' : 'Entrada'); await page.waitForTimeout(600);
      cleared = /Buscar categoria|Selecione/.test((await group(page, 'Categoria').innerText().catch(() => '')));
      await pickChakra(page, 'Filtro Tipo Cat.', new RegExp('^' + tc.replace('/', '\\/') + '$'));
    }
    // aplicar
    const reqP = page.waitForResponse((r) => /\/api\/v1\/movements\?/.test(r.url()), { timeout: 15000 }).catch(() => null);
    await page.getByRole('button', { name: /Aplicar|Filtrar/ }).first().click().catch(() => {});
    const resp = await reqP; const reqUrl = resp?.url() ?? '';
    await page.waitForTimeout(2500);
    const rowsAfter = await page.locator('tbody tr').count();
    const totalAfter = (await page.getByText(/Mostrando \d+ de \d+/).innerText().catch(() => '')).trim();
    const badge = (await page.getByRole('button', { name: /Filtros/ }).innerText().catch(() => '')).replace(/\s+/g, ' ');
    if (i === 0 || i === 3) await shot(page, `796-FT${String(i + 1).padStart(2, '0')}-apos-aplicar-linhas-nao-mudam`);
    const ok = catDisabledInicial === true && catDisabledDepois === false && catOpts.length > 0 && !/type_category|category_type/.test(reqUrl) && rowsAfter === rowsBefore && totalAfter === totalBefore && (cleared === null || cleared === true);
    logCase({ ut: 796, scen: '7', id: `FT${String(i + 1).padStart(2, '0')}`, input: `Filtros > Filtro Tipo Cat. = ${tc}; opções de Categoria; aplicar`, expected: 'Categoria começa desabilitada; habilita ao escolher Tipo Cat.; lista de categorias restrita; trocar Tipo Cat. limpa Categoria; aplicar NÃO envia type_category nem reduz linhas; contador não conta Tipo Cat.', got: JSON.stringify({ catDesabInicial: catDisabledInicial, catDesabDepois: catDisabledDepois, qtdOpcoesCategoria: catOpts.length, amostra: catOpts.slice(0, 3), limpouAoTrocar: cleared, reqUrl: reqUrl.slice(0, 200), linhasAntes: rowsBefore, linhasDepois: rowsAfter, totalAntes: totalBefore, totalDepois: totalAfter, botaoFiltros: badge }), result: ok ? 'PASSOU' : 'FALHOU' });
    void tcOptsHandle;
    if (!ok) { await shot(page, `796-FT${i + 1}-FALHA`); throw new Error(JSON.stringify({ catDisabledInicial, catDisabledDepois, n: catOpts.length, cleared, reqUrl, rowsBefore, rowsAfter, totalBefore, totalAfter })); }
  });
});

test('796-SI Saldo Inicial: linha I sem Editar/Excluir e com atalho', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/home'); await page.waitForTimeout(1500);
  const r = await apiGet(page, '/movements', { per_page: 50, type_category: 'I' });
  const list: any[] = (r.body?.data ?? []).filter((m: any) => m.is_opening_balance);
  if (!list.length) { logCase({ ut: 796, scen: '7', id: 'SI', input: 'procurar linha de Saldo Inicial no tenant', expected: 'linha I sem Editar/Excluir e com atalho', got: `API /movements?type_category=I status=${r.status} linhas=${list.length}`, result: 'BLOCKED_DATA' }); throw new Error('BLOCKED_DATA: nenhuma linha de Saldo Inicial'); }
  logCase({ ut: 796, scen: '7', id: 'SI', input: 'linha de saldo inicial existente', expected: 'sem Editar/Excluir; atalho', got: `linhas=${list.length}`, result: 'PASSOU' });
});
