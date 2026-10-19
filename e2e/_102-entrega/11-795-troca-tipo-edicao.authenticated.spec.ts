import { test } from '@playwright/test';
import { openExpenseNew, fillExpenseHeader, fillExpenseRateio, saveExpenseUI, apiGet, logCase, shot, pickAsync, pickChakra, saveState, loadState } from './lib';
test.use({ viewport: { width: 1600, height: 1700 } });

type T = 'Pecuária' | 'Manutenção' | 'Agricultura' | 'Indireta' | 'Área';
async function applyBlock(page: any, t: T, n: number) {
  if (t === 'Pecuária') {
    await pickAsync(page, 'aprop_pec_area_uuid', 0, ['Pasto 10', 'Pasto 03', 'Pasto 09', 'Pasto 11'][n % 4]);
    await pickAsync(page, 'aprop_pec_operation_uuid', n % 5);
    await pickAsync(page, 'aprop_pec_activity_uuid', n % 2);
  } else if (t === 'Manutenção') {
    await pickAsync(page, 'aprop_man_equipment_uuid', 0, ['A 73F VALTRA', 'BATEDEIRA', 'CAÇAMBA HIDRÁULICA CEMAG'][n % 3]);
    const m = page.locator('input[name="aprop_man_hour_meter"]'); await m.click(); await m.fill(''); await m.pressSequentially(String(100 + n * 7), { delay: 30 });
  } else if (t === 'Agricultura') {
    await pickAsync(page, 'aprop_agri_area_uuid', 0).catch(() => {});
    await pickAsync(page, 'aprop_agri_operation_uuid', 0).catch(() => {});
    await pickAsync(page, 'aprop_agri_cultivation_uuid', 0).catch(() => {});
  }
}
async function setType(page: any, t: T, n: number, creating: boolean) {
  if (t === 'Indireta') { await pickChakra(page, 'Modalidade', 'Indireta'); return; }
  await pickChakra(page, 'Modalidade', 'Direta');
  await pickChakra(page, 'Tipo', t);
  await page.waitForTimeout(800);
  await applyBlock(page, t, n);
  void creating;
}
const summarize = (d: any) => ({ appropriation: d?.appropriation, type: d?.appropriation_type?.value ?? d?.appropriation_type, pec: !!d?.appropriation_detail?.livestock, man: !!d?.appropriation_detail?.maintenance });

const seqs: T[][] = [
  ['Pecuária', 'Manutenção', 'Agricultura', 'Indireta'],
  ['Manutenção', 'Pecuária', 'Indireta'],
  ['Agricultura', 'Pecuária', 'Manutenção'],
  ['Área', 'Manutenção', 'Pecuária', 'Agricultura'],
  ['Pecuária', 'Agricultura', 'Manutenção'],
  ['Manutenção', 'Agricultura', 'Indireta'],
  ['Pecuária', 'Indireta', 'Manutenção'],
  ['Agricultura', 'Manutenção', 'Pecuária'],
  ['Manutenção', 'Indireta', 'Pecuária'],
  ['Pecuária', 'Manutenção', 'Pecuária'],
];
seqs.forEach((seq, si) => {
  const id = `S${String(si + 1).padStart(2, '0')}`;
  test(`795-${id} troca de tipo na edição: ${seq.join(' > ')}`, async ({ page }) => {
    test.setTimeout(420_000);
    await page.goto('/home'); await page.waitForTimeout(1200);
    await openExpenseNew(page);
    await fillExpenseHeader(page, { id, type: seq[0] === 'Indireta' ? 'Indireta' : (seq[0] as any), amount: String(20000 + si * 333), provIdx: si % 10, titleIdx: si % 6 });
    // header já escolheu o tipo; preenche o bloco
    await applyBlock(page, seq[0], si);
    await fillExpenseRateio(page, String(20000 + si * 333));
    const created = await saveExpenseUI(page);
    const uuid = created.body?.data?.uuid;
    const steps: any[] = [];
    let ok = !!uuid;
    if (uuid) saveState({ expenses: [...(loadState().expenses ?? []), { id, uuid }] });
    let det = uuid ? (await apiGet(page, `/expenses/${uuid}`)).body?.data : null;
    steps.push({ passo: `criar ${seq[0]}`, http: created.status, ...summarize(det), errs: created.body?.errors });
    for (let k = 1; k < seq.length && uuid; k++) {
      const t = seq[k];
      await page.goto(`/financeiro/pagar/${uuid}`); await page.locator('input[name=number]').waitFor({ timeout: 60000 }); await page.waitForTimeout(3500);
      await setType(page, t, si + k, false);
      if (k === 1 || k === seq.length - 1) await shot(page, `795-${id}-passo${k}-${t}-antes-salvar`);
      const res = await saveExpenseUI(page);
      await page.waitForTimeout(1500);
      det = (await apiGet(page, `/expenses/${uuid}`)).body?.data;
      const s = summarize(det);
      const exp = { Pecuária: { pec: true, man: false, type: 2, appropriation: 1 }, Manutenção: { pec: false, man: true, type: 4, appropriation: 1 }, Agricultura: { pec: false, man: false, type: 1, appropriation: 1 }, Área: { pec: false, man: false, type: 3, appropriation: 1 }, Indireta: { pec: false, man: false, type: null, appropriation: 2 } }[t as string] as any;
      const stepOk = (res.status === 200 || res.status === 201) && s.pec === exp.pec && s.man === exp.man && (exp.type === null ? !s.type : Number(s.type) === exp.type) && Number(s.appropriation) === exp.appropriation;
      steps.push({ passo: `trocar para ${t}`, http: res.status, errs: res.body?.errors ?? res.body?.message, ...s, esperado: exp, ok: stepOk });
      if (!stepOk) { ok = false; await shot(page, `795-${id}-passo${k}-${t}-FALHA`); break; }
    }
    logCase({ ut: 795, scen: '11/12-troca', id, input: seq.join(' > '), expected: 'cada troca grava só a apropriação nova; a antiga (lote/equipamento) some do detalhe; Indireta zera tipo', got: JSON.stringify(steps), result: ok ? 'PASSOU' : 'FALHOU' });
    if (!ok) throw new Error(JSON.stringify(steps));
  });
});
