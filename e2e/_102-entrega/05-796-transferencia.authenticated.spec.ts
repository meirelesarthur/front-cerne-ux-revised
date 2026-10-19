import { test } from '@playwright/test';
import { MovCase, fillMovementUI, saveMovementUI, accountBalance, apiGet, apiSend, loadState, logCase, shot, group } from './lib';
test.use({ viewport: { width: 1600, height: 1100 } });

// Cenário 5: Transferência Interna. Tipo=S -> "Conta Destino"; Tipo=E -> "Conta Origem".
const R = (cat: number, center: number, cents: string) => ({ cat, center, cents });
const T: (MovCase & { dest: string; exp: 'ok' | 'fail' })[] = [
  { id: 'T01', tp: 'S', tc: 'T', acc: 'accB', dest: 'accC', value: '10000', date: '2026-10-14', rateio: [R(0, 0, '10000')], exp: 'ok' },
  { id: 'T02', tp: 'S', tc: 'T', acc: 'accB', dest: 'accD', value: '1', date: '2026-10-14', rateio: [R(0, 0, '1')], exp: 'ok' },
  { id: 'T03', tp: 'S', tc: 'T', acc: 'accB', dest: 'accC', value: '123456', date: '2026-10-14', rateio: [R(0, 0, '100000'), R(0, 1, '23456')], exp: 'ok' },
  { id: 'T04', tp: 'E', tc: 'T', acc: 'accD', dest: 'accB', value: '5000', date: '2026-10-14', rateio: [R(0, 0, '5000')], exp: 'ok' },
  { id: 'T05', tp: 'E', tc: 'T', acc: 'accC', dest: 'accD', value: '99999', date: '2026-12-31', rateio: [R(0, 1, '99999')], exp: 'ok' },
  { id: 'T06', tp: 'S', tc: 'T', acc: 'accA', dest: 'accB', value: '10000000', date: '2026-10-14', rateio: [R(0, 0, '10000000')], exp: 'fail' },
  { id: 'T07', tp: 'S', tc: 'T', acc: 'accB', dest: 'accB', value: '1000', date: '2026-10-14', rateio: [R(0, 0, '1000')], exp: 'fail' },
  { id: 'T08', tp: 'S', tc: 'T', acc: 'accB', dest: 'accA', value: '2500', date: '2026-10-14', rateio: [R(0, 0, '2500')], exp: 'ok' },
  { id: 'T09', tp: 'S', tc: 'T', acc: 'accC', dest: 'accB', value: '77', date: '2026-10-13', rateio: [R(0, 0, '77')], exp: 'ok' },
  { id: 'T10', tp: 'E', tc: 'T', acc: 'accA', dest: 'accC', value: '1000', date: '2026-10-14', rateio: [R(0, 0, '1000')], exp: 'ok' },
  { id: 'T11', tp: 'S', tc: 'T', acc: 'accD', dest: 'accC', value: '300000', date: '2026-12-31', rateio: [R(0, 0, '300000')], exp: 'ok' },
  { id: 'T12', tp: 'E', tc: 'T', acc: 'accC', dest: 'accD', value: '99999', date: '2026-10-14', rateio: [R(0, 0, '99999')], exp: 'fail' },
];
const KEY = new Set(['T01', 'T03', 'T06', 'T07', 'T04', 'T05', 'T12']);
const rows = async (page: any, accs: string[]) => {
  const out: any[] = [];
  for (const a of accs) {
    const r = await apiGet(page, '/movements', { account_uuid: a, per_page: 50 });
    for (const m of r.body?.data ?? []) if (String(m.note ?? '').startsWith('QA102-T')) out.push(m);
  }
  return out;
};
T.forEach((c) => {
  test(`796-${c.id} Transf ${c.tp} ${c.acc}->${c.dest} R$ ${(Number(c.value) / 100).toFixed(2)}`, async ({ page }) => {
    test.setTimeout(150_000);
    const st = loadState();
    await page.goto('/home'); await page.waitForTimeout(1500);
    const bO = await accountBalance(page, st[c.acc]); const bD = await accountBalance(page, st[c.dest]);
    await fillMovementUI(page, c);
    if (KEY.has(c.id)) await shot(page, `796-${c.id}-form-transferencia-preenchido`);
    const res = await saveMovementUI(page);
    await page.waitForTimeout(1500);
    if (KEY.has(c.id)) await shot(page, `796-${c.id}-apos-salvar`);
    const aO = await accountBalance(page, st[c.acc]); const aD = await accountBalance(page, st[c.dest]);
    const val = Number(c.value) / 100;
    const sameAcc = c.acc === c.dest;
    const sOrig = c.tp === 'S' ? -val : val; // efeito na conta informada
    const got = { dO: Number((aO - bO).toFixed(2)), dD: Number((aD - bD).toFixed(2)) };
    const mine = await rows(page, [st[c.acc], st[c.dest]]).then((l) => l.filter((m) => m.note === `QA102-${c.id}`));
    let ok: boolean; let expd: string;
    if (c.exp === 'fail') { expd = 'rejeitar (422) sem gravar e sem alterar saldos'; ok = res.status >= 400 && mine.length === 0 && got.dO === 0 && got.dD === 0; }
    else { expd = `2 linhas (par); conta ${c.acc} ${sOrig >= 0 ? '+' : ''}${sOrig.toFixed(2)}, conta ${c.dest} ${(-sOrig) >= 0 ? '+' : ''}${(-sOrig).toFixed(2)}`; ok = res.status < 300 && mine.length === 2 && Math.abs(got.dO - sOrig) < 0.005 && Math.abs(got.dD + sOrig) < 0.005; }
    logCase({ ut: 796, scen: '5', id: c.id, input: `Transf Tipo=${c.tp} conta=${c.acc} outra=${c.dest} valor=${val.toFixed(2)} data=${c.date} rateios=${c.rateio.length}`, expected: expd, got: JSON.stringify({ http: res.status, msg: res.body?.message, errs: res.body?.errors, linhas: mine.map((m: any) => ({ t: m.type, tc: m.type_category, v: m.signed_value, mirror: m.is_mirror, acc: m.account?.account })), ...got }), result: ok ? 'PASSOU' : 'FALHOU' });
    void sameAcc;
    if (!ok) { await shot(page, `796-${c.id}-FALHA`); throw new Error(`${expd} | http=${res.status} linhas=${mine.length} d=${JSON.stringify(got)} ${JSON.stringify(res.body?.errors ?? res.body?.message)}`); }
  });
});

// espelho: editar (travas) e excluir (par) — sobre os pares criados T01..T11 que passaram
['T01', 'T04', 'T03', 'T09'].forEach((tid, i) => {
  test(`796-${tid}-espelho editar travado e excluir par`, async ({ page }) => {
    test.setTimeout(180_000);
    const st = loadState();
    const c = T.find((x) => x.id === tid)!;
    await page.goto('/home'); await page.waitForTimeout(1500);
    const list = await rows(page, [st[c.acc], st[c.dest]]).then((l) => l.filter((m) => m.note === `QA102-${tid}`));
    if (list.length !== 2) { logCase({ ut: 796, scen: '5', id: `${tid}-espelho`, input: 'abrir linha espelho', expected: 'par existir', got: `linhas=${list.length}`, result: 'BLOCKED_DATA' }); throw new Error('par ausente (caso anterior falhou)'); }
    const mirror = list.find((m: any) => m.is_mirror) ?? list[0];
    await page.goto(`/financeiro/caixa/${mirror.uuid}`);
    await page.waitForTimeout(4500);
    const tipoDis = await group(page, 'Tipo').getByRole('combobox').isDisabled().catch(() => null);
    const tcDis = await group(page, 'Tp. Categoria').getByRole('combobox').isDisabled().catch(() => null);
    await shot(page, `796-${tid}-espelho-edicao-tipo-tpcat-travados`);
    const vb = [await accountBalance(page, st[c.acc]), await accountBalance(page, st[c.dest])];
    const del = await apiGet(page, `/movements/${mirror.uuid}`);
    // exclusão pela UI da lista: botão Excluir da linha espelho
    await page.goto('/financeiro/caixa'); await page.waitForTimeout(4000);
    const row = page.locator('tr', { hasText: `QA102-${tid}` });
    const hasRow = await row.count();
    logCase({ ut: 796, scen: '5', id: `${tid}-espelho-edit`, input: `abrir linha ${mirror.is_mirror ? 'espelho' : 'origem'} (${mirror.type})`, expected: 'Tipo e Tp. Categoria travados (desabilitados)', got: JSON.stringify({ tipoDis, tcDis, detalhe: del.status, linhasNaLista: hasRow, saldos: vb }), result: tipoDis && tcDis ? 'PASSOU' : 'FALHOU' });
    if (!(tipoDis && tcDis)) throw new Error(`travas: tipoDis=${tipoDis} tcDis=${tcDis}`);
    void i;
  });
});
