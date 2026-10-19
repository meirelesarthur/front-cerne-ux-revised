import { test } from '@playwright/test';
import { MovCase, fillMovementUI, saveMovementUI, accountBalance, apiGet, loadState, saveState, logCase, shot, pickAsync, pickChakra, typeMoney, group, group as grp } from './lib';
test.use({ viewport: { width: 1600, height: 1500 } });

const R = (cat: number, center: number, cents: string) => ({ cat, center, cents });
type F = MovCase & { kind: 'expense' | 'income' };
const F: F[] = [
  { id: 'F01', kind: 'expense', tp: 'E', tc: 'F', acc: 'accB', value: '100000', date: '2026-10-14', party: 0, rateio: [R(0, 0, '100000')] },
  { id: 'F02', kind: 'expense', tp: 'E', tc: 'F', acc: 'accB', value: '1', date: '2026-10-14', party: 1, rateio: [R(1, 0, '1')] },
  { id: 'F03', kind: 'expense', tp: 'E', tc: 'F', acc: 'accC', value: '12345678', interest: '123456', date: '2026-10-14', party: 2, rateio: [R(0, 1, '12345678')] },
  { id: 'F04', kind: 'expense', tp: 'E', tc: 'F', acc: 'accD', value: '500000', interest: '50', date: '2026-10-10', party: 3, prop: 1, rateio: [R(2, 2, '500000')] },
  { id: 'F05', kind: 'expense', tp: 'E', tc: 'F', acc: 'accB', value: '25000', date: '2026-12-01', party: 4, rateio: [R(0, 0, '25000')] },
  { id: 'F06', kind: 'expense', tp: 'E', tc: 'F', acc: 'accC', value: '9999', interest: '999', date: '2026-10-14', party: 5, rateio: [R(3, 1, '9999')] },
  { id: 'F07', kind: 'expense', tp: 'E', tc: 'F', acc: 'accA', value: '3333', date: '2026-10-14', party: 6, rateio: [R(0, 0, '3333')] },
  { id: 'F08', kind: 'expense', tp: 'E', tc: 'F', acc: 'accB', value: '75000000000', date: '2026-10-14', party: 7, rateio: [R(4, 3, '75000000000')] },
  { id: 'F09', kind: 'expense', tp: 'E', tc: 'F', acc: 'accD', value: '1234', interest: '1', date: '2026-10-14', party: 8, rateio: [R(0, 0, '1234')] },
  { id: 'F10', kind: 'expense', tp: 'E', tc: 'F', acc: 'accC', value: '432100', date: '2026-10-14', party: 9, rateio: [R(0, 0, '200000'), R(1, 1, '232100')] },
  { id: 'G01', kind: 'income', tp: 'S', tc: 'F', acc: 'accB', value: '100000', date: '2026-10-14', party: 0, rateio: [R(0, 0, '100000')] },
  { id: 'G02', kind: 'income', tp: 'S', tc: 'F', acc: 'accB', value: '1', date: '2026-10-14', party: 1, rateio: [R(1, 0, '1')] },
  { id: 'G03', kind: 'income', tp: 'S', tc: 'F', acc: 'accB', value: '234567', interest: '12345', date: '2026-10-14', party: 2, rateio: [R(0, 1, '234567')] },
  { id: 'G04', kind: 'income', tp: 'S', tc: 'F', acc: 'accD', value: '50000', date: '2026-12-31', party: 3, rateio: [R(2, 2, '50000')] },
  { id: 'G05', kind: 'income', tp: 'S', tc: 'F', acc: 'accB', value: '10000', date: '2026-10-14', party: 4, prop: 1, rateio: [R(0, 0, '10000')] },
  { id: 'G06', kind: 'income', tp: 'S', tc: 'F', acc: 'accB', value: '8888', interest: '888', date: '2026-10-14', party: 5, rateio: [R(3, 1, '8888')] },
  { id: 'G07', kind: 'income', tp: 'S', tc: 'F', acc: 'accB', value: '500000', date: '2026-10-14', party: 6, rateio: [R(0, 0, '300000'), R(1, 1, '200000')] },
  { id: 'G08', kind: 'income', tp: 'S', tc: 'F', acc: 'accD', value: '100', date: '2026-12-31', party: 7, rateio: [R(0, 0, '100')] },
  { id: 'G09', kind: 'income', tp: 'S', tc: 'F', acc: 'accB', value: '99999', date: '2026-10-14', party: 8, rateio: [R(0, 0, '99999')] },
  { id: 'G10', kind: 'income', tp: 'S', tc: 'F', acc: 'accB', value: '1500000', interest: '15000', date: '2026-10-14', party: 9, rateio: [R(0, 0, '1500000')] },
];
const KEY = new Set(['F01', 'F03', 'G01', 'G03', 'F10']);
const num = (s: string) => Number(String(s).replace(/[^\d,-]/g, '').replace(',', '.'));

F.forEach((c) => {
  test(`796-${c.id} Financiamento ${c.tp}/F -> ${c.kind === 'expense' ? 'Conta a Pagar' : 'Conta a Receber'} R$ ${(Number(c.value) / 100).toFixed(2)} juros ${(Number(c.interest ?? 0) / 100).toFixed(2)}`, async ({ page }) => {
    test.setTimeout(240_000);
    const st = loadState();
    const cons: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error' && !/final argument passed/.test(m.text())) cons.push('console.error: ' + m.text().slice(0, 300)); });
    page.on('pageerror', (e) => cons.push('PAGEERROR: ' + String(e).slice(0, 400)));
    page.on('response', (r) => { if (r.status() >= 400) cons.push(`HTTP ${r.status()} ${r.request().method()} ${r.url().slice(0, 140)}`); });
    await page.goto('/home'); await page.waitForTimeout(1500);
    const balBefore = await accountBalance(page, st[c.acc]);
    await fillMovementUI(page, c, true);
    // Gera Obrigação = Sim readonly
    const sw = page.locator('input[id^="switch::"]').nth(1);
    const genChecked = await sw.isChecked(); const genDisabled = await sw.isDisabled();
    const cliDis = await page.locator('[id="client_uuid"]').isDisabled(); const provDis = await page.locator('[id="provider_uuid"]').isDisabled();
    if (KEY.has(c.id)) await shot(page, `796-${c.id}-movimento-financiamento-preenchido`);
    const T0 = Date.now(); const lg = (m: string) => console.log(`[${c.id}] ${((Date.now() - T0) / 1000).toFixed(1)}s ${m}`);
    const mres = await saveMovementUI(page); lg('mov saved ' + mres.status);
    const draft = mres.body?.data?.generated_obligation_draft ?? null;
    const movUuid = mres.body?.data?.uuid;
    const urlRe = c.kind === 'expense' ? /\/financeiro\/pagar\/novo\?fromMovement=/ : /\/financeiro\/receber\/novo\?fromMovement=/;
    const redirected = await page.waitForURL(urlRe, { timeout: 20000 }).then(() => true).catch(() => false);
    lg('redirected=' + redirected);
    let reloadedBlank = false;
    const okForm = await page.locator('input[name=number]').waitFor({ timeout: 25000 }).then(() => true).catch(() => false);
    if (!okForm) { await shot(page, `796-${c.id}-titulo-pagina-em-branco`).catch(() => {}); reloadedBlank = true; await page.reload(); await page.locator('input[name=number]').waitFor({ timeout: 60000 }).catch(() => {}); }
    lg('number visible reloadedBlank=' + reloadedBlank);
    await page.waitForTimeout(3500);
    const pre = {
      amount: num(await page.locator('input[name=amount]').inputValue().catch(() => '')),
      interest: num(await page.locator('input[name=interest]').inputValue().catch(() => '')),
      issue: await page.locator('input[placeholder="DD/MM/YYYY"]').nth(0).inputValue().catch(() => ''),
      note: await page.locator('textarea[name=note]').inputValue().catch(() => ''),
      party: (await grp(page, c.kind === 'expense' ? 'Fornecedor' : 'Cliente').innerText().catch(() => '')).replace(/\s+/g, ' ').trim(),
      proprietary: (await grp(page, 'Proprietário').innerText().catch(() => '')).replace(/\s+/g, ' ').trim(),
    };
    lg('pre read'); if (KEY.has(c.id)) await shot(page, `796-${c.id}-titulo-prefill-${c.kind}`); lg('shot ok');
    // completar e salvar o título
    await page.locator('input[name=number]').fill(`QA102-${c.id}`);
    await pickAsync(page, 'type_title_uuid', 3);
    const dates = page.locator('input[placeholder="DD/MM/YYYY"]');
    const vIdx = 1;
    await dates.nth(vIdx).click(); await dates.nth(vIdx).fill('14/11/2026'); await dates.nth(vIdx).press('Tab');
    if (c.kind === 'expense') await pickChakra(page, 'Forma de Pagamento', 'Parcela Única');
    else { const fp = await group(page, 'Forma de Pagamento').innerText().catch(() => ''); if (!/Única/.test(fp)) await pickChakra(page, 'Forma de Pagamento', /Única|À vista/); }
    // rateio do título
    await page.getByText('Rateio', { exact: true }).first().click(); await page.waitForTimeout(800);
    if (c.kind === 'income') { await page.getByRole('button', { name: /Adicionar Categoria/ }).click(); await page.waitForTimeout(800); }
    const catId = (await page.locator('[id$="category_uuid"]:visible').first().getAttribute('id')) ?? 'categories.0.category_uuid';
    const base = catId.replace(/category_uuid$/, '');
    await page.locator(`[id="${catId}"]`).click(); await page.waitForTimeout(900);
    await page.locator('div[role=option]:visible').first().click();
    await pickAsync(page, `${base}center_uuid`, 0);
    await typeMoney(page, `${base}value`, c.value);
    await page.getByText(c.kind === 'expense' ? 'Cabeçalho' : 'Dados', { exact: true }).first().click(); await page.waitForTimeout(400);
    // captura do POST do título
    let tcap: any = { status: 0, body: null, reqBody: null };
    const re = c.kind === 'expense' ? /\/api\/v1\/expenses(\?.*)?$/ : /\/api\/v1\/incomes(\?.*)?$/;
    const handler = async (route: any) => { const rq = route.request(); if (rq.method() !== 'POST') return route.fallback(); const r = await route.fetch(); let b: any = null; try { b = await r.json(); } catch { /* */ } let rb: any = null; try { rb = rq.postDataJSON(); } catch { /* */ } tcap = { status: r.status(), body: b, reqBody: rb }; await route.fulfill({ response: r }); };
    await page.route(re, handler);
    await page.getByRole('button', { name: 'Salvar' }).first().click();
    for (let i = 0; i < 80 && tcap.status === 0; i++) await page.waitForTimeout(250);
    await page.unroute(re, handler);
    await page.waitForTimeout(2500);
    const finalUrl = page.url();
    if (KEY.has(c.id)) await shot(page, `796-${c.id}-apos-salvar-titulo`);
    const titleUuid = tcap.body?.data?.uuid;
    const base2 = c.kind === 'expense' ? '/expenses' : '/incomes';
    const tdet = titleUuid ? (await apiGet(page, `${base2}/${titleUuid}`)).body?.data : null;
    const mdet = movUuid ? (await apiGet(page, `/movements/${movUuid}`)).body?.data : null;
    const balAfter = await accountBalance(page, st[c.acc]);
    const val = Number(c.value) / 100; const jur = Number(c.interest ?? 0) / 100;
    const expDelta = c.tp === 'E' ? val : -val;
    const partyUuid = c.kind === 'expense' ? (tdet?.provider?.uuid ?? tdet?.provider_uuid ?? tdet?.provider) : (tdet?.client?.uuid ?? tdet?.client_uuid ?? tdet?.client); console.log('TDET KEYS', Object.keys(tdet ?? {}).join(','), JSON.stringify(tdet?.provider ?? tdet?.client));
    const links = mdet ? Object.entries(mdet).filter(([k]) => /obligation|expense|income/i.test(k)).map(([k, v]) => `${k}=${JSON.stringify(v)?.slice(0, 80)}`) : [];
    const checks = {
      geraObrig: genChecked && genDisabled,
      partiesState: c.kind === 'expense' ? (cliDis && !provDis) : (!cliDis && provDis),
      draftType: draft?.type === c.kind,
      redirected,
      prefillAmount: Math.abs(pre.amount - val) < 0.005,
      prefillInterest: Math.abs(pre.interest - jur) < 0.005,
      prefillNote: pre.note === `QA102-${c.id}`,
      reqHasMovementUuid: tcap.reqBody?.movement_uuid === movUuid,
      titleCreated: (tcap.status === 201 || tcap.status === 200) && !!titleUuid,
      titleAmount: !!tdet && Math.abs(Number(tdet.amount) - val) < 0.005,
      titleParty: !!partyUuid && partyUuid === (c.kind === 'expense' ? draft?.provider_uuid : draft?.client_uuid) && partyUuid === (c.kind === 'expense' ? (mdet?.provider_uuid ?? mdet?.provider?.uuid) : (mdet?.client_uuid ?? mdet?.client?.uuid)),
      voltouLista: /\/financeiro\/caixa(\?|$|\/)/.test(finalUrl),
      saldo: Math.abs((balAfter - balBefore) - expDelta) < 0.005,
    };
    const ok = Object.values(checks).every(Boolean);
    logCase({ ut: 796, scen: '2/3', id: c.id, input: `${c.tp}/F ${c.kind} conta=${c.acc} valor=${val.toFixed(2)} juros=${jur.toFixed(2)} data=${c.date} rateios=${c.rateio.length} parte#${c.party} prop#${c.prop ?? 0}`, expected: `Gera Obrigação Sim readonly; ${c.kind === 'expense' ? 'Cliente desab/Fornecedor hab' : 'Cliente hab/Fornecedor desab'}; redireciona a ${c.kind === 'expense' ? 'Nova Conta a Pagar' : 'Nova Conta a Receber'} pré-preenchida; título salvo com movement_uuid; volta à lista; saldo ${expDelta >= 0 ? '+' : ''}${expDelta.toFixed(2)}`, got: JSON.stringify({ paginaTituloEmBrancoRecarregada: reloadedBlank, consoleEHttpErros: cons.slice(0, 10), mov: { http: mres.status, uuid: movUuid }, draft, cliDis, provDis, genChecked, genDisabled, pre, titulo: { keys: Object.keys(tdet ?? {}).join(','), partyRaw: JSON.stringify(c.kind === 'expense' ? (tdet?.provider ?? tdet?.provider_uuid) : (tdet?.client ?? tdet?.client_uuid)), http: tcap.status, uuid: titleUuid, reqMovUuid: tcap.reqBody?.movement_uuid, amount: tdet?.amount, appropriation: tdet?.appropriation, errs: tcap.body?.errors ?? tcap.body?.message }, vinculoNoMovimento: links, urlFinal: finalUrl, saldoDelta: Number((balAfter - balBefore).toFixed(2)), checks }), result: ok ? 'PASSOU' : 'FALHOU' });
    if (movUuid) saveState({ fin: [...(loadState().fin ?? []), { id: c.id, kind: c.kind, movUuid, titleUuid, acc: c.acc, val }] });
    if (!ok) { await shot(page, `796-${c.id}-FALHA`); throw new Error(`checks=${JSON.stringify(checks)} pre=${JSON.stringify(pre)} titulo=${tcap.status} ${JSON.stringify(tcap.body?.errors ?? tcap.body?.message)} url=${finalUrl}`); }
  });
});
