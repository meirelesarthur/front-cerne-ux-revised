import { test } from '@playwright/test';
import { MovCase, fillMovementUI, saveMovementUI, accountBalance, apiGet, loadState, logCase, shot, saveState } from './lib';
test.use({ viewport: { width: 1600, height: 1100 } });

const R = (cat: number, center: number, cents: string) => ({ cat, center, cents });
const cases: MovCase[] = [
  { id: 'E01', tp: 'E', tc: 'E', acc: 'accB', value: '100000', date: '2026-10-14', party: 0, rateio: [R(0, 0, '100000')] },
  { id: 'E02', tp: 'E', tc: 'E', acc: 'accB', value: '1', date: '2026-10-14', party: 1, rateio: [R(1, 0, '1')] },
  { id: 'E03', tp: 'E', tc: 'E', acc: 'accA', value: '10000', interest: '550', date: '2026-10-14', party: 2, rateio: [R(0, 1, '10000')] },
  { id: 'E04', tp: 'E', tc: 'E', acc: 'accB', value: '12345678', date: '2026-10-14', party: 4, rateio: [R(0, 0, '5000000'), R(1, 1, '4000000'), R(2, 2, '3345678')] },
  { id: 'E05', tp: 'E', tc: 'E', acc: 'accB', value: '250000', date: '2026-01-10', party: 3, prop: 1, rateio: [R(0, 0, '100000'), R(2, 1, '150000')] },
  { id: 'E06', tp: 'E', tc: 'E', acc: 'accC', value: '77777', date: '2026-10-01', party: 5, doc: 'QA102-DOC-06', rateio: [R(3, 2, '77777')] },
  { id: 'E07', tp: 'E', tc: 'E', acc: 'accD', value: '5000000', interest: '12345', date: '2026-12-31', party: 6, rateio: [R(4, 3, '5000000')] },
  { id: 'S01', tp: 'S', tc: 'S', acc: 'accB', value: '30000', date: '2026-10-14', party: 0, rateio: [R(0, 0, '30000')] },
  { id: 'S02', tp: 'S', tc: 'S', acc: 'accB', value: '9999', interest: '111', date: '2026-10-14', party: 1, rateio: [R(1, 1, '9999')] },
  { id: 'S03', tp: 'S', tc: 'S', acc: 'accA', value: '10001', date: '2026-10-14', party: 2, rateio: [R(0, 0, '10001')], expect: 'fail' },
  { id: 'S04', tp: 'S', tc: 'S', acc: 'accA', value: '5000', date: '2026-10-14', party: 3, rateio: [R(2, 2, '5000')] },
  { id: 'S05', tp: 'S', tc: 'S', acc: 'accB', value: '123456', date: '2026-10-14', party: 3, prop: 1, rateio: [R(0, 0, '100000'), R(3, 1, '23456')] },
  { id: 'S06', tp: 'S', tc: 'S', acc: 'accA', value: '5000', date: '2026-10-14', party: 4, rateio: [R(1, 1, '5000')] },
  { id: 'S07', tp: 'S', tc: 'S', acc: 'accA', value: '1', date: '2026-10-14', party: 5, rateio: [R(0, 0, '1')], expect: 'fail' },
  { id: 'S08', tp: 'S', tc: 'S', acc: 'accC', value: '40000', date: '2026-09-01', party: 6, rateio: [R(0, 0, '40000')], expect: 'fail' },
];
const KEYS = new Set(['E01', 'E04', 'S01', 'S03', 'S05', 'S08']);

cases.forEach((c) => {
  test(`796-${c.id} ${c.tp}/${c.tc} ${c.acc} R$ ${(Number(c.value) / 100).toFixed(2)}`, async ({ page }) => {
    test.setTimeout(150_000);
    const st = loadState();
    const accUuid = st[c.acc];
    await page.goto('/home'); await page.waitForTimeout(1500);
    const balBefore = await accountBalance(page, accUuid);
    await fillMovementUI(page, c);
    if (KEYS.has(c.id)) await shot(page, `796-${c.id}-form-preenchido`);
    const res = await saveMovementUI(page);
    await page.waitForTimeout(1500);
    if (KEYS.has(c.id)) await shot(page, `796-${c.id}-apos-salvar`);
    const balAfter = await accountBalance(page, accUuid);
    const val = Number(c.value) / 100;
    const expDelta = c.expect === 'fail' ? 0 : c.tp === 'E' ? val : -val;
    let det: any = null;
    const uuid = res.body?.data?.uuid; if (!uuid) console.log('BODY', JSON.stringify(res.body)?.slice(0, 600));
    if (uuid) { det = (await apiGet(page, `/movements/${uuid}`)).body?.data; }
    const gotDelta = Number((balAfter - balBefore).toFixed(2));
    let ok: boolean; let exp: string;
    if (c.expect === 'fail') {
      exp = 'rejeitar (422 saldo insuficiente), nada gravado, saldo inalterado';
      ok = res.status === 422 && !uuid && gotDelta === 0;
    } else {
      exp = `201; value=${val.toFixed(2)} type=${c.tp}; ${c.rateio.length} rateio(s); saldo da conta ${expDelta >= 0 ? '+' : ''}${expDelta.toFixed(2)}`;
      ok = (res.status === 201 || res.status === 200) && !!det && Number(det.value) === val && det.type === c.tp && (det.allocations?.length ?? 0) === c.rateio.length && Math.abs(gotDelta - expDelta) < 0.005 && (!c.interest || Number(det.interest) === Number(c.interest) / 100);
    }
    const gravado = det ? { value: det.value, interest: det.interest, type: det.type, tc: det.type_category, date: det.date, doc: det.document, nAlloc: det.allocations?.length, sumAlloc: det.allocations?.reduce((a: number, x: any) => a + Number(x.value), 0), client: det.client_uuid ?? det.client?.uuid ?? null, provider: det.provider_uuid ?? det.provider?.uuid ?? null } : null;
    logCase({ ut: 796, scen: '8/save', id: c.id, input: `${c.tp}/${c.tc} conta=${c.acc} valor=${val.toFixed(2)} juros=${c.interest ? Number(c.interest) / 100 : 0} data=${c.date} rateios=${c.rateio.length} prop#${c.prop ?? 0} parte#${c.party}`, expected: exp, got: JSON.stringify({ http: res.status, msg: res.body?.message, errs: res.body?.errors, gravado, saldoAntes: balBefore, saldoDepois: balAfter, delta: gotDelta }), result: ok ? 'PASSOU' : 'FALHOU' });
    if (uuid) saveState({ created: [...(loadState().created ?? []), { id: c.id, uuid }] });
    if (!ok) { await shot(page, `796-${c.id}-FALHA`); throw new Error(`${exp} | obtido http=${res.status} delta=${gotDelta} ${JSON.stringify(res.body?.errors ?? res.body?.message)}`); }
  });
});
