import { test } from '@playwright/test';
import { ExpCase, openExpenseNew, fillExpenseHeader, fillExpenseRateio, saveExpenseUI, apiGet, logCase, shot, pickAsync, saveState, loadState } from './lib';
test.use({ viewport: { width: 1600, height: 1700 } });

// meter: dígitos digitados (NumberInput preenche pela direita). expected = valor numérico esperado.
type M = ExpCase & { km: boolean; digits: string; expected: number };
const M = (id: string, o: Partial<M>): M => ({ id, type: 'Manutenção', amount: '100000', provIdx: 0, km: false, digits: '125', expected: 12.5, ...o } as M);
const cases: M[] = [
  M('M01', { equip: 'A 73F VALTRA', digits: '125', expected: 12.5, provIdx: 0 }),
  M('M02', { equip: 'ADUBADEIRA DE ARRASTE', digits: '0', expected: 0, provIdx: 1, amount: '1' }),
  M('M03', { equip: 'BALANÇA DIGITAL', digits: '5', expected: 0.5, provIdx: 2, amount: '45050' }),
  M('M04', { equip: 'BATEDEIRA', digits: '12345', expected: 1234.5, provIdx: 3, amount: '999999' }),
  M('M05', { equip: 'CAÇAMBA HIDRÁULICA CEMAG', digits: '9999999', expected: 999999.9, provIdx: 4 }),
  M('M06', { equip: 'BOMBA DE ABASTECIMENTO', digits: '1', expected: 0.1, provIdx: 5 }),
  M('M07', { equip: 'ADUBADEIRA HIDRÁULICA', digits: '100', expected: 10, provIdx: 6, amount: '1234567' }),
  M('M08', { equip: 'CAMINHÃO BASCULANTE', km: true, digits: '0', expected: 0, provIdx: 7 }),
  M('M09', { equip: 'CAMINHONETE FIAT TORO', km: true, digits: '150', expected: 150, provIdx: 8 }),
  M('M10', { equip: 'CAMINHONETE VW AMAROK', km: true, digits: '12345', expected: 12345, provIdx: 9, amount: '75500' }),
  M('M11', { equip: 'CAMINHÃO 1620', km: true, digits: '987654', expected: 987654, provIdx: 4 }),
  M('M12', { equip: 'BALANÇA ', digits: '123456789012', expected: 12345678901.2, provIdx: 5 }),
];
const KEY = new Set(['M01', 'M04', 'M08', 'M10']);

cases.forEach((c) => {
  test(`795-${c.id} Manutenção ${c.equip?.trim()} ${c.km ? 'Km ' : 'Horímetro '}${c.digits}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/home'); await page.waitForTimeout(1500);
    await openExpenseNew(page);
    await fillExpenseHeader(page, c);
    await pickAsync(page, 'aprop_man_equipment_uuid', 0, c.equip!.trim());
    await page.waitForTimeout(500);
    const meterId = c.km ? 'aprop_man_mileage' : 'aprop_man_hour_meter';
    const inp = page.locator(`[id="${meterId}"], input[name="${meterId}"]`).first();
    const disabled = await inp.isDisabled().catch(() => null);
    const otherVisible = await page.locator(`input[name="${c.km ? 'aprop_man_hour_meter' : 'aprop_man_mileage'}"]`).isVisible().catch(() => false);
    await inp.click(); await inp.fill(''); await inp.pressSequentially(c.digits, { delay: 40 });
    const shown = await inp.inputValue();
    if (KEY.has(c.id)) await shot(page, `795-${c.id}-manutencao-${c.km ? 'km' : 'horimetro'}-digitado`);
    await fillExpenseRateio(page, c.amount);
    const res = await saveExpenseUI(page);
    await page.waitForTimeout(1500);
    const uuid = res.body?.data?.uuid;
    const det = uuid ? (await apiGet(page, `/expenses/${uuid}`)).body?.data : null;
    const mt = det?.appropriation_detail?.maintenance ?? res.body?.data?.appropriation_detail?.maintenance ?? null;
    const rq = res.reqBody ?? {};
    let reopened = ''; let view = '';
    if (uuid) {
      await page.goto(`/financeiro/pagar/${uuid}`); await page.locator('[data-testid=expense-maintenance-block]').waitFor({ timeout: 25000 }).catch(() => {});
      await page.waitForTimeout(3000);
      reopened = await page.locator(`input[name="${meterId}"]`).inputValue().catch(() => '');
      if (KEY.has(c.id)) await shot(page, `795-${c.id}-manutencao-edicao-reaberta`);
      await page.goto(`/financeiro/pagar/${uuid}/visualizar`); await page.waitForTimeout(5000);
      view = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
      if (KEY.has(c.id)) await shot(page, `795-${c.id}-manutencao-visualizar`);
    }
    const sentVal = c.km ? rq.aprop_man_mileage : rq.aprop_man_hour_meter;
    const stored = c.km ? (mt?.mileage ?? mt?.km) : (mt?.hour_meter ?? mt?.horimeter);
    const exp = `201; ${c.km ? 'Km' : 'Horímetro'} enviado/gravado = ${c.expected}; campo ${c.km ? 'Km' : 'Horímetro'} exibido (o outro oculto); reabrir mostra o mesmo valor (sem ×10)`;
    const okExpected = Math.abs(Number(sentVal) - c.expected) < 0.051 && (stored === undefined || stored === null ? false : Math.abs(Number(stored) - c.expected) < 0.051);
    const reNum = Number(String(reopened).replace(/\./g, '').replace(',', '.'));
    const okReopen = c.km ? Math.abs(reNum - c.expected) < 0.5 : Math.abs(reNum - c.expected) < 0.051;
    const ok = (res.status === 201 || res.status === 200) && !!uuid && okExpected && okReopen && !otherVisible && disabled === false;
    logCase({ ut: 795, scen: '12', id: c.id, input: JSON.stringify({ equip: c.equip?.trim(), campo: c.km ? 'Km' : 'Horímetro', digitado: c.digits, valor: Number(c.amount) / 100 }), expected: exp, got: JSON.stringify({ http: res.status, msg: res.body?.message, errs: res.body?.errors, campoDesab: disabled, outroCampoVisivel: otherVisible, exibidoAoDigitar: shown, enviado: sentVal, gravado: stored, maintenance: mt, reabertoMostra: reopened, visualizarTemManut: /Manuten/.test(view) }), result: ok ? 'PASSOU' : 'FALHOU' });
    if (uuid) saveState({ expenses: [...(loadState().expenses ?? []), { id: c.id, uuid }] });
    if (!ok) { await shot(page, `795-${c.id}-FALHA`); throw new Error(`${exp} | http=${res.status} enviado=${sentVal} gravado=${stored} reaberto=${reopened} exibido=${shown} desab=${disabled} outro=${otherVisible} ${JSON.stringify(res.body?.errors ?? res.body?.message)}`); }
  });
});
