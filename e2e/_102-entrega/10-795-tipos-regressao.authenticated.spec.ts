import { test } from '@playwright/test';
import { ExpCase, openExpenseNew, fillExpenseHeader, fillExpenseRateio, saveExpenseUI, apiGet, logCase, shot, pickAsync, pickChakra, group, visibleErrors, saveState, loadState } from './lib';
test.use({ viewport: { width: 1600, height: 1700 } });

// Cenário 10: tipos de apropriação Direta sem "(indisponível nesta versão)" — 10 aberturas com variações
for (let i = 1; i <= 10; i++) {
  test(`795-T${String(i).padStart(2, '0')} Apropriação Direta: tipos sem sufixo (abertura ${i})`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/home'); await page.waitForTimeout(1200);
    await openExpenseNew(page);
    // variações: alterna modalidade i vezes
    for (let k = 0; k < i % 4; k++) { await pickChakra(page, 'Modalidade', 'Direta'); await pickChakra(page, 'Modalidade', 'Indireta'); }
    const tipoDisabledIndireta = await group(page, 'Tipo').getByRole('combobox').isDisabled();
    await pickChakra(page, 'Modalidade', 'Direta');
    const t = group(page, 'Tipo').getByRole('combobox'); await t.click(); await page.waitForTimeout(500);
    const opts = await page.locator('div[role=option]:visible').allInnerTexts();
    if (i === 1 || i === 7) await shot(page, `795-T${String(i).padStart(2, '0')}-tipos-apropriacao-direta`);
    await page.keyboard.press('Escape');
    const api = (await apiGet(page, '/expenses/appropriation-types/options')).body?.data ?? [];
    const ok = opts.length === 4 && opts.every((o) => !/indispon/i.test(o)) && ['Agricultura', 'Pecuária', 'Área', 'Manutenção'].every((n) => opts.includes(n)) && api.length >= 4 && tipoDisabledIndireta === true;
    logCase({ ut: 795, scen: '10', id: `T${String(i).padStart(2, '0')}`, input: `abrir Nova Conta a Pagar; alternar Modalidade ${i % 4}x; Direta; abrir Tipo`, expected: '4 tipos (Agricultura, Pecuária, Área, Manutenção) sem "(indisponível nesta versão)"; Tipo desabilitado em Indireta; API options=4', got: JSON.stringify({ opts, apiOptions: api.map((a: any) => a.label), tipoDesabilitadoNaIndireta: tipoDisabledIndireta }), result: ok ? 'PASSOU' : 'FALHOU' });
    if (!ok) throw new Error(JSON.stringify({ opts, tipoDisabledIndireta }));
  });
}

// Cenário 13: obrigatoriedade de Fornecedor (1/2/4) + regressão de salvar (Agricultura / Área / Indireta)
type R = { id: string; type: ExpCase['type']; prov: boolean; expectSave: boolean; extra?: 'agri' | 'pec' | 'man'; skip?: 'op' | 'act' | 'equip' };
const rs: R[] = [
  { id: 'R01', type: 'Agricultura', prov: true, expectSave: true, extra: 'agri' },
  { id: 'R02', type: 'Área', prov: true, expectSave: true },
  { id: 'R03', type: 'Indireta', prov: true, expectSave: true },
  { id: 'R04', type: 'Agricultura', prov: false, expectSave: false, extra: 'agri' },
  { id: 'R05', type: 'Pecuária', prov: false, expectSave: false, extra: 'pec' },
  { id: 'R06', type: 'Manutenção', prov: false, expectSave: false, extra: 'man' },
  { id: 'R07', type: 'Área', prov: false, expectSave: true },
  { id: 'R08', type: 'Indireta', prov: false, expectSave: true },
  { id: 'R09', type: 'Pecuária', prov: true, expectSave: false, extra: 'pec', skip: 'op' },
  { id: 'R10', type: 'Pecuária', prov: true, expectSave: false, extra: 'pec', skip: 'act' },
  { id: 'R11', type: 'Manutenção', prov: true, expectSave: false, extra: 'man', skip: 'equip' },
  { id: 'R12', type: 'Agricultura', prov: true, expectSave: true, extra: 'agri' },
];
rs.forEach((r, idx) => {
  test(`795-${r.id} ${r.type} ${r.prov ? 'com' : 'sem'} Fornecedor${r.skip ? ' sem ' + r.skip : ''}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/home'); await page.waitForTimeout(1200);
    await openExpenseNew(page);
    await fillExpenseHeader(page, { id: r.id, type: r.type, amount: String(10000 + idx * 111), provIdx: r.prov ? idx % 10 : null, titleIdx: idx % 6 });
    if (r.extra === 'agri') {
      await pickAsync(page, 'aprop_agri_area_uuid', 0).catch(() => {});
      await pickAsync(page, 'aprop_agri_operation_uuid', 0).catch(() => {});
      await pickAsync(page, 'aprop_agri_cultivation_uuid', 0).catch(() => {});
    }
    if (r.extra === 'pec') {
      await pickAsync(page, 'aprop_pec_area_uuid', 0, 'Pasto 10');
      if (r.skip !== 'op') await pickAsync(page, 'aprop_pec_operation_uuid', 0);
      if (r.skip !== 'act' && r.skip !== 'op') await pickAsync(page, 'aprop_pec_activity_uuid', 0);
    }
    if (r.extra === 'man' && r.skip !== 'equip') await pickAsync(page, 'aprop_man_equipment_uuid', 0, 'A 73F VALTRA');
    await fillExpenseRateio(page, String(10000 + idx * 111));
    await page.waitForTimeout(400);
    const res = await saveExpenseUI(page);
    await page.waitForTimeout(1200);
    const errs = await visibleErrors(page);
    const uuid = res.body?.data?.uuid;
    const det = uuid ? (await apiGet(page, `/expenses/${uuid}`)).body?.data : null;
    await shot(page, `795-${r.id}-${r.type}-${r.prov ? 'com' : 'sem'}-fornecedor${r.skip ? '-sem-' + r.skip : ''}`);
    const saved = (res.status === 201 || res.status === 200) && !!uuid;
    const provErr = errs.some((e) => /fornecedor/i.test(e)) || /fornecedor/i.test(JSON.stringify(res.body?.errors ?? ''));
    let ok: boolean; let exp: string;
    if (r.expectSave) { exp = 'salvar (201); título gravado com o tipo escolhido'; ok = saved && !!det; }
    else if (r.skip) { exp = `bloquear: erro de ${r.skip === 'op' ? 'Operação' : r.skip === 'act' ? 'Atividade' : 'Equipamento'} obrigatório, sem criar título`; ok = !saved && (errs.length > 0 || !!res.body?.errors); }
    else { exp = 'bloquear: Fornecedor obrigatório (tipos 1/2/4), sem criar título'; ok = !saved && provErr; }
    logCase({ ut: 795, scen: '13', id: r.id, input: `${r.type} ${r.prov ? 'com' : 'sem'} Fornecedor${r.skip ? ', sem ' + r.skip : ''}`, expected: exp, got: JSON.stringify({ http: res.status, msg: res.body?.message, apiErrs: res.body?.errors, uiErrs: errs.slice(0, 5), saved, provErr, type: det?.appropriation_type, appropriation: det?.appropriation }), result: ok ? 'PASSOU' : 'FALHOU' });
    if (uuid) saveState({ expenses: [...(loadState().expenses ?? []), { id: r.id, uuid }] });
    if (!ok) throw new Error(`${exp} | saved=${saved} http=${res.status} uiErrs=${JSON.stringify(errs)} api=${JSON.stringify(res.body?.errors ?? res.body?.message)}`);
  });
});
