import { test } from '@playwright/test';
import { ExpCase, openExpenseNew, fillExpenseHeader, fillExpenseRateio, saveExpenseUI, apiGet, logCase, shot, pickAsync, group, visibleErrors, saveState, loadState } from './lib';
test.use({ viewport: { width: 1600, height: 1700 } });

async function optionCount(page: any, id: string, search?: string): Promise<{ n: number; texts: string[] }> {
  const inp = page.locator(`[id="${id}"]`).first();
  await inp.click(); if (search) { await inp.fill(search); }
  await page.waitForTimeout(1500);
  const texts: string[] = await page.locator('div[role=option]:visible').allInnerTexts();
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  return { n: texts.length, texts };
}
async function fieldText(page: any, label: string) { return (await group(page, label).innerText().catch(() => '')).replace(/\s+/g, ' ').trim(); }
async function uuidOf(page: any, path: string, search: string) { const r = await apiGet(page, path, { search, per_page: 50 }); return (r.body?.data ?? []).find((x: any) => (x.description ?? x.name ?? x.label) === search)?.uuid ?? (r.body?.data ?? [])[0]?.uuid; }

// cenário 11: cascatas (10 combinações)
const combos = [
  { id: 'C01', area: 'Pasto 10', graz: 'Módulo 01', lot: 'Lote Eduardo', op: 'Colheita' },
  { id: 'C02', area: 'Pasto 03', graz: 'Módulo 02', lot: 'Lote Bezerras Desmamadas', op: 'Armazenagem' },
  { id: 'C03', area: 'Pasto 09', graz: 'modulo novo', lot: 'Lote Vacas Faz. Carioca', op: 'Identificação Animal' },
  { id: 'C04', area: 'Pasto 11', graz: 'Módulo 01', lot: '700 animais', op: 'Manutenção Instalações' },
  { id: 'C05', area: 'Pasto 45', graz: 'modulo novo', lot: 'lote teste processamento', op: 'Construção Instalações' },
  { id: 'C06', area: 'Pasto 15', graz: 'Módulo 02', lot: 'Lote Confinamento 01', op: 'Conservação do Solo' },
  { id: 'C07', area: 'Pasto 10', graz: 'modulo novo', lot: 'Lote 01 Vaca', op: 'Abertura Áreas de Produção' },
  { id: 'C08', area: 'Pasto 03', graz: 'Módulo 01', lot: 'Lote Teste Planilha', op: 'Armazenagem' },
  { id: 'C09', area: 'Pasto 11', graz: 'módulo pastejo teste estrutura', lot: '700 animais', op: 'Colheita' },
  { id: 'C10', area: 'Pasto 09', graz: 'Módulo 02', lot: 'Lote Vacas Faz. Carioca', op: 'Manutenção Culturas Perenes' },
];
combos.forEach((c) => {
  test(`795-${c.id} cascata Área ${c.area} x Módulo ${c.graz} -> Lote -> Animal; Operação ${c.op} -> Atividade`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/home'); await page.waitForTimeout(1500);
    await openExpenseNew(page);
    await fillExpenseHeader(page, { id: c.id, type: 'Pecuária', amount: '100', provIdx: 0 });
    const obs: any = {};
    const disabledAtStart = { lote: await page.locator('[id="aprop_pec_batch_uuid"]').isDisabled().catch(() => 'n/a'), animal: await page.locator('[id="aprop_pec_animal_uuid"]').isDisabled().catch(() => 'n/a'), atividade: await page.locator('[id="aprop_pec_activity_uuid"]').isDisabled().catch(() => 'n/a') };
    // 1) Área -> Módulo vazio; Lote carrega pela área
    await pickAsync(page, 'aprop_pec_area_uuid', 0, c.area);
    obs.moduloAposArea = await fieldText(page, 'Módulo');
    const areaUuid = await uuidOf(page, '/areas/options', c.area);
    const apiLotsArea = (await apiGet(page, '/batches/options', { area_uuid: areaUuid, include_empty: 0 })).body?.data ?? [];
    obs.loteUI_area = (await optionCount(page, 'aprop_pec_batch_uuid')).n; obs.loteAPI_area = apiLotsArea.length;
    // 2) Módulo -> Área limpa
    await pickAsync(page, 'aprop_pec_grazing_uuid', 0, c.graz);
    obs.areaAposModulo = await fieldText(page, 'Área');
    const grazUuid = await uuidOf(page, '/grazings/options', c.graz);
    const apiLotsGraz = (await apiGet(page, '/batches/options', { grazing_uuid: grazUuid, include_empty: 0 })).body?.data ?? [];
    obs.loteUI_graz = (await optionCount(page, 'aprop_pec_batch_uuid')).n; obs.loteAPI_graz = apiLotsGraz.length;
    // 3) Área de novo -> Módulo limpa
    await pickAsync(page, 'aprop_pec_area_uuid', 0, c.area);
    obs.moduloAposArea2 = await fieldText(page, 'Módulo');
    // 4) lote (se existir na área) -> animal
    const lotOpts = await optionCount(page, 'aprop_pec_batch_uuid');
    const hasLot = lotOpts.texts.find((t) => t.includes(c.lot.slice(0, 14)));
    if (hasLot) {
      await pickAsync(page, 'aprop_pec_batch_uuid', hasLot);
      const lotUuid = apiLotsArea.find((b: any) => b.label === hasLot)?.uuid;
      const apiAn = lotUuid ? ((await apiGet(page, '/animals/options', { batch_uuid: lotUuid, per_page: 100 })).body?.data ?? []).length : null;
      const anUI = await optionCount(page, 'aprop_pec_animal_uuid');
      obs.animalUI = anUI.n; obs.animalAPI = apiAn;
      obs.loteSel = hasLot;
      // trocar a Área limpa lote/animal?
    } else obs.loteSel = null;
    // 5) Operação -> Atividade
    const opsApi = (await apiGet(page, '/operations/options')).body?.data ?? [];
    const opUuid = opsApi.find((o: any) => o.name === c.op)?.uuid;
    const actApi = opUuid ? ((await apiGet(page, '/activities/options', { operation_uuid: opUuid })).body?.data ?? []).length : null;
    await pickAsync(page, 'aprop_pec_operation_uuid', 0, c.op);
    const actUI = await optionCount(page, 'aprop_pec_activity_uuid');
    obs.atividadeUI = actUI.n; obs.atividadeAPI = actApi;
    // trocar operação limpa atividade
    await pickAsync(page, 'aprop_pec_activity_uuid', 0);
    const actSel = await fieldText(page, 'Atividade');
    await pickAsync(page, 'aprop_pec_operation_uuid', 0, c.op === 'Colheita' ? 'Armazenagem' : 'Colheita');
    obs.atividadeAposTrocaOp = await fieldText(page, 'Atividade');
    obs.atividadeAntesTroca = actSel;
    if (c.id === 'C01' || c.id === 'C05') await shot(page, `795-${c.id}-cascata-estado-final`);
    const cmp = (ui: number, api: number | null) => api === null || (api <= 20 ? ui === api : ui >= 1);
    const ok = /Selecione o módulo/.test(obs.moduloAposArea) && /Selecione a área/.test(obs.areaAposModulo) && /Selecione o módulo/.test(obs.moduloAposArea2)
      && cmp(obs.loteUI_area, obs.loteAPI_area) && cmp(obs.loteUI_graz, obs.loteAPI_graz) && (obs.animalUI === undefined || cmp(obs.animalUI, obs.animalAPI)) && cmp(obs.atividadeUI, obs.atividadeAPI)
      && disabledAtStart.lote === true && disabledAtStart.animal === true && disabledAtStart.atividade === true
      && !/Selecione a atividade/.test(obs.atividadeAntesTroca) && /Selecione a atividade/.test(obs.atividadeAposTrocaOp);
    logCase({ ut: 795, scen: '11-cascata', id: c.id, input: JSON.stringify(c), expected: 'Lote/Animal/Atividade desabilitados no início; Área limpa Módulo e vice-versa; opções de Lote=API(por Área e por Módulo); Animal=API(do Lote); Atividade=API(da Operação); trocar Operação limpa Atividade', got: JSON.stringify({ disabledAtStart, ...obs }), result: ok ? 'PASSOU' : 'FALHOU' });
    if (!ok) { await shot(page, `795-${c.id}-cascata-FALHA`); throw new Error(JSON.stringify({ disabledAtStart, ...obs })); }
  });
});
