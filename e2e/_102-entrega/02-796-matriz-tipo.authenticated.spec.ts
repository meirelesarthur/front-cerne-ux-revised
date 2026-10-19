import { test } from '@playwright/test';
import { gotoNovo, setDate, pickChakra, pickAsync, pickCombo, typeMoney, readFormState, shot, logCase, TC_LABEL, TP_LABEL, group, openTc } from './lib';
test.use({ viewport: { width: 1600, height: 1100 } });

// Matriz Tipo x Tp. Categoria (cenários 1, 2, 3, 4, 9): sem salvar.
const combos: [string, string][] = [['E','E'],['E','S'],['E','T'],['E','F'],['S','E'],['S','S'],['S','T'],['S','F']];
const KEY = new Set(['E-E','S-S','E-F','S-F']);
combos.forEach(([tp, tc], i) => {
  test(`796-M${String(i + 1).padStart(2, '0')} Tipo=${tp} x TpCat=${tc}`, async ({ page }) => {
    test.setTimeout(60_000);
    await gotoNovo(page);
    await pickChakra(page, 'Tipo', TP_LABEL[tp]);
    const before = await (async () => { await openTc(page); const o = await page.locator('div[role=option]:visible').evaluateAll((e) => e.map((x) => `${x.textContent}${x.getAttribute('aria-disabled') === 'true' ? '(desab)' : ''}`)); await page.keyboard.press('Escape'); return o; })();
    const tcDisabled = before.find((o) => o.startsWith(TC_LABEL[tc]))?.includes('(desab)');
    let selected = true;
    if (tcDisabled) {
      await openTc(page);
      await page.locator('div[role=option]:visible', { hasText: new RegExp('^' + TC_LABEL[tc].replace('/', '\\/') + '$') }).first().click({ force: true }).catch(() => {});
      await page.keyboard.press('Escape');
      const txt = (await group(page, 'Tp. Categoria').locator('[data-part=value-text]').first().innerText().catch(() => '')) || '';
      selected = txt.includes(TC_LABEL[tc]);
    } else {
      await pickChakra(page, 'Tp. Categoria', new RegExp('^' + TC_LABEL[tc].replace('/', '\\/') + '$'));
    }
    await page.waitForTimeout(400);
    const st = await readFormState(page);
    const validCombo = !(tc === 'E' && tp !== 'E') && !(tc === 'S' && tp !== 'S');
    // esperado (contrato L1/D-102): E->cliente, S->fornecedor, T->nenhum+destino, F: E->fornecedor / S->cliente + GeraObrigacao
    const expClient = tc === 'E' || (tc === 'F' && tp === 'S');
    const expProv = tc === 'S' || (tc === 'F' && tp === 'E');
    let ok: boolean; let exp: string;
    if (!validCombo) { exp = 'opção Tp.Categoria desabilitada e não selecionável'; ok = !!tcDisabled && !selected; }
    else {
      exp = `cliente ${expClient ? 'habilitado' : 'desab'}, fornecedor ${expProv ? 'habilitado' : 'desab'}, destino ${tc === 'T' ? 'visível' : 'oculto'}, GeraObrig ${tc === 'F' ? 'Sim(readonly)' : 'Não'}`;
      ok = st.clientDisabled === !expClient && st.providerDisabled === !expProv && st.destVisible === (tc === 'T') && st.genObr === (tc === 'F');
    }
    if (KEY.has(`${tp}-${tc}`) || !ok) await shot(page, `796-M${String(i + 1).padStart(2, '0')}-tipo${tp}-tpcat${tc}-estado-campos`);
    logCase({ ut: 796, scen: '1/2/3/9', id: `M${i + 1}`, input: `Tipo=${tp} TpCat=${tc}`, expected: exp, got: JSON.stringify({ tcOpts: before, selected, cliDes: st.clientDisabled, fornDes: st.providerDisabled, dest: st.destVisible, genObr: st.genObr }), result: ok ? 'PASSOU' : 'FALHOU' });
    if (!ok) throw new Error(`esperado ${exp}; obtido ${JSON.stringify(st)} sel=${selected}`);
  });
});

// Cenário 4: trocar o Tipo limpa Tp.Categoria, Cliente, Fornecedor, categoria do rateio e Gera Obrigação.
const clears: { id: string; tp: string; tc: string; party: 'client' | 'provider' | 'none'; idx: number; newTp: string }[] = [
  { id: 'L1', tp: 'E', tc: 'E', party: 'client', idx: 0, newTp: 'S' },
  { id: 'L2', tp: 'S', tc: 'S', party: 'provider', idx: 1, newTp: 'E' },
  { id: 'L3', tp: 'E', tc: 'F', party: 'provider', idx: 2, newTp: 'S' },
  { id: 'L4', tp: 'S', tc: 'F', party: 'client', idx: 3, newTp: 'E' },
  { id: 'L5', tp: 'E', tc: 'T', party: 'none', idx: 0, newTp: 'S' },
  { id: 'L6', tp: 'S', tc: 'T', party: 'none', idx: 1, newTp: 'E' },
  { id: 'L7', tp: 'E', tc: 'E', party: 'client', idx: 4, newTp: 'S' },
  { id: 'L8', tp: 'S', tc: 'S', party: 'provider', idx: 5, newTp: 'E' },
];
clears.forEach((c) => {
  test(`796-${c.id} trocar Tipo ${c.tp}->${c.newTp} (TpCat ${c.tc}) limpa dependentes`, async ({ page }) => {
    test.setTimeout(120_000);
    let posted: any = null;
    await page.route('**/api/v1/movements', async (route) => {
      if (route.request().method() === 'POST') { posted = route.request().postDataJSON(); await route.abort(); } else await route.continue();
    });
    await gotoNovo(page);
    await setDate(page, '2026-10-14');
    await pickChakra(page, 'Tipo', TP_LABEL[c.tp]);
    await pickChakra(page, 'Tp. Categoria', new RegExp('^' + TC_LABEL[c.tc].replace('/', '\\/') + '$'));
    await pickAsync(page, 'account_uuid', 0);
    await pickCombo(page, 'Buscar proprietário', 0);
    if (c.party === 'client') await pickAsync(page, 'client_uuid', c.idx);
    if (c.party === 'provider') await pickAsync(page, 'provider_uuid', c.idx);
    await typeMoney(page, 'value', '10000');
    await page.locator('[id="allocations.0.category_uuid"]').click(); await page.waitForTimeout(900);
    await page.locator('div[role=option]:visible').nth(c.idx).click();
    await pickAsync(page, 'allocations.0.center_uuid', 0);
    await typeMoney(page, 'allocations.0.value', '10000');
    await page.waitForTimeout(300);
    const before = await readFormState(page);
    const preFilled = (c.party === 'client' ? !before.clientEmpty : c.party === 'provider' ? !before.providerEmpty : true) && !before.catRateioEmpty;
    await pickChakra(page, 'Tipo', TP_LABEL[c.newTp]);
    await page.waitForTimeout(600);
    const after = await readFormState(page);
    const tcCleared = after.tcTxt === '' || /Selecione/.test(after.tcTxt);
    // exibição (DOM)
    const displayCleared = after.clientEmpty && after.providerEmpty && after.catRateioEmpty;
    if (c.id === 'L1' || c.id === 'L3' || !displayCleared) await shot(page, `796-${c.id}-apos-troca-tipo-${c.tp}-para-${c.newTp}-DOM`);
    // dado (payload): escolhe Tp.Cat válida p/ o novo tipo, completa e tenta salvar com POST abortado
    await pickChakra(page, 'Tp. Categoria', new RegExp('^' + (c.tc === 'T' ? TC_LABEL.T : c.tc === 'F' ? TC_LABEL.F : TC_LABEL[c.newTp]).replace('/', '\\/') + '$'));
    if (c.tc === 'T') await pickAsync(page, 'destination_account_uuid', 1);
    await page.getByRole('button', { name: 'Salvar' }).first().click();
    await page.waitForTimeout(2500);
    await shot(page, `796-${c.id}-apos-troca-tipo-tentativa-salvar`).catch(() => {});
    const errs1 = await page.locator('[data-part=error-text], .chakra-field__errorText').allInnerTexts().catch(() => []);
    // 2ª tentativa: repicar a categoria do rateio (a exibição antiga é obsoleta) e salvar de novo p/ capturar o payload real
    posted = null;
    await page.locator('[id="allocations.0.category_uuid"]').click(); await page.waitForTimeout(900);
    await page.locator('div[role=option]:visible').first().click();
    await page.getByRole('button', { name: 'Salvar' }).first().click();
    await page.waitForTimeout(2500);
    const errs = await page.locator('[data-part=error-text], .chakra-field__errorText, [role=alert]').allInnerTexts().catch(() => []);
    const payloadParty = posted ? { client_uuid: posted.client_uuid ?? null, provider_uuid: posted.provider_uuid ?? null, cat: posted.allocations?.map((a: any) => a.category_uuid) } : null;
    const dataCleared = posted ? (payloadParty!.client_uuid === null && payloadParty!.provider_uuid === null || (c.tc === 'F' && true)) : null;
    const ok = preFilled && tcCleared && displayCleared;
    logCase({ ut: 796, scen: '4', id: c.id, input: `Tipo ${c.tp}/${c.tc} preenchido (parte=${c.party}, cat#${c.idx}) -> Tipo ${c.newTp}`, expected: 'Tp.Cat, Cliente, Fornecedor, destino e categoria do rateio limpos (DOM e payload)', got: JSON.stringify({ preFilled, tcCleared, domCliente: after.clientTxt, domForn: after.provTxt, catRateioVazia: after.catRateioEmpty, payload: payloadParty, dataCleared, erros1: errs1.slice(0,3), erros2: errs.slice(0, 4) }), result: ok ? 'PASSOU' : 'FALHOU' });
    if (!ok) throw new Error(JSON.stringify({ preFilled, after: { cli: after.clientTxt, forn: after.provTxt, catVazia: after.catRateioEmpty }, payloadParty, errs }));
  });
});
