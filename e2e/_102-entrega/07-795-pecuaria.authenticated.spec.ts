import { test } from '@playwright/test';
import { ExpCase, openExpenseNew, fillExpenseHeader, fillExpenseRateio, saveExpenseUI, apiGet, logCase, shot, pickAsync, pickChakra, group, visibleErrors, saveState, loadState } from './lib';
test.use({ viewport: { width: 1600, height: 1700 } });

const E = (id: string, o: Partial<ExpCase>): ExpCase => ({ id, type: 'Pecuária', amount: '100000', provIdx: 0, ...o });
const cases: ExpCase[] = [
  E('P01', { area: 'Pasto 10', lot: 'Lote Eduardo', animalIdx: 0, op: 0, act: 0, amount: '150000', provIdx: 0 }),
  E('P02', { area: 'Pasto 03', lot: 'Lote Bezerras Desmamadas', animalIdx: 2, op: 'Armazenagem', act: 1, amount: '1', provIdx: 1 }),
  E('P03', { area: 'Pasto 09', lot: 'Lote Vacas Faz. Carioca', op: 'Colheita', act: 3, amount: '987654', provIdx: 2 }),
  E('P04', { area: 'Pasto 11', op: 'Identificação Animal', act: 0, amount: '250050', provIdx: 3 }),
  E('P05', { grazing: 'Módulo 01', lot: 'Lote Bezerros Desmamados', animalIdx: 5, op: 'Manutenção Instalações', act: 2, amount: '33333', provIdx: 4 }),
  E('P06', { grazing: 'modulo novo', lot: 'Lote Novilha Vazia', op: 'Construção Instalações', act: 4, amount: '1999', provIdx: 5 }),
  E('P07', { grazing: 'Módulo 02', op: 'Conservação do Solo', act: 1, amount: '500000', provIdx: 6 }),
  E('P08', { area: 'Pasto 45', lot: 'lote teste processamento', animalIdx: 1, op: 'Armazenagem', act: 0, amount: '75025', provIdx: 7 }),
  E('P09', { grazing: 'módulo pastejo teste estrutura', lot: 'TESTE ESTRUTURA', animalIdx: 11, op: 'Identificação Animal', act: 4, amount: '12345', provIdx: 8 }),
  E('P10', { area: 'Pasto 10', lot: 'Lote 01 Vaca', animalIdx: 0, op: 'Colheita', act: 7, amount: '5000000', provIdx: 9 }),
  E('P11', { area: 'Pasto 03', op: 5, act: 2, amount: '800', provIdx: 2, titleIdx: 5 }),
  E('P12', { grazing: 'Módulo 01', op: 'Colheita', act: 0, amount: '2000000', provIdx: 6, titleIdx: 1 }),
];
const KEY = new Set(['P01', 'P05', 'P09', 'P04']);

async function blockText(page: any) { return (await page.locator('[data-testid=expense-livestock-block]').innerText().catch(() => '')).replace(/\s+/g, ' '); }

cases.forEach((c) => {
  test(`795-${c.id} Pecuária ${c.area ? 'Área ' + c.area : 'Módulo ' + c.grazing}${c.lot ? ' / ' + c.lot : ' / sem lote'}${c.animalIdx !== undefined ? ' / animal#' + c.animalIdx : ' / sem animal'}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/home'); await page.waitForTimeout(1500);
    await openExpenseNew(page);
    await fillExpenseHeader(page, c);
    if (c.area) await pickAsync(page, 'aprop_pec_area_uuid', 0, c.area);
    if (c.grazing) await pickAsync(page, 'aprop_pec_grazing_uuid', 0, c.grazing);
    if (c.lot) await pickAsync(page, 'aprop_pec_batch_uuid', c.lot.slice(0, 18));
    if (c.animalIdx !== undefined) await pickAsync(page, 'aprop_pec_animal_uuid', c.animalIdx);
    if (typeof c.op === 'number') await pickAsync(page, 'aprop_pec_operation_uuid', c.op); else await pickAsync(page, 'aprop_pec_operation_uuid', 0, c.op);
    await pickAsync(page, 'aprop_pec_activity_uuid', Number(c.act));
    const before = await blockText(page);
    await fillExpenseRateio(page, c.amount);
    if (KEY.has(c.id)) await shot(page, `795-${c.id}-pecuaria-form-preenchido`);
    const res = await saveExpenseUI(page);
    await page.waitForTimeout(1500);
    const uuid = res.body?.data?.uuid;
    const det = uuid ? (await apiGet(page, `/expenses/${uuid}`)).body?.data : null;
    const ad = det?.appropriation_detail ?? res.body?.data?.appropriation_detail ?? null;
    const rq = res.reqBody ?? {};
    // reabrir edição e conferir reidratação
    let edit = ''; let view = '';
    if (uuid) {
      await page.goto(`/financeiro/pagar/${uuid}`); await page.locator('[data-testid=expense-livestock-block]').waitFor({ timeout: 25000 }).catch(() => {});
      await page.waitForTimeout(3000); edit = await blockText(page);
      if (KEY.has(c.id)) await shot(page, `795-${c.id}-pecuaria-edicao-reidratada`);
      await page.goto(`/financeiro/pagar/${uuid}/visualizar`); await page.waitForTimeout(5000);
      view = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
      if (KEY.has(c.id)) await shot(page, `795-${c.id}-pecuaria-visualizar`);
    }
    const sent = { area: rq.aprop_pec_area_uuid ?? null, graz: rq.aprop_pec_grazing_uuid ?? null, lot: rq.aprop_pec_batch_uuid ?? null, animal: rq.aprop_pec_animal_uuid ?? null, op: rq.aprop_pec_operation_uuid ?? null, act: rq.aprop_pec_activity_uuid ?? null, type: rq.appropriation_type ?? null, appr: rq.appropriation ?? null };
    const detOk = !!ad;
    const exp = `201; appropriation_type=2; área/módulo ${c.area ? 'só área' : 'só módulo'}; lote ${c.lot ? 'sim' : 'não'}; animal ${c.animalIdx !== undefined ? 'sim' : 'não'}; operação+atividade gravadas; edição reidrata; visualizar mostra`;
    const lv = ad?.livestock ?? {};
    const names = [lv.area?.description, lv.grazing?.description, lv.batch?.description, lv.operation?.name, lv.activity?.name].filter(Boolean) as string[];
    const hydratedHasOp = names.length >= 3 && names.every((n) => edit.includes(n)) && edit.includes(lv.code ?? '###');
    const okSave = (res.status === 201 || res.status === 200) && !!uuid && Number(det?.appropriation_type?.value ?? det?.appropriation_type) === 2;
    const okSent = (!!c.area === !!sent.area) && (!!c.grazing === !!sent.graz) && (!!c.lot === !!sent.lot) && (c.animalIdx !== undefined) === !!sent.animal && !!sent.op && !!sent.act;
    const ok = okSave && okSent && detOk && hydratedHasOp;
    logCase({ ut: 795, scen: '11', id: c.id, input: JSON.stringify({ area: c.area, graz: c.grazing, lote: c.lot, animalIdx: c.animalIdx, op: c.op, act: c.act, valor: Number(c.amount) / 100, fornIdx: c.provIdx }), expected: exp, got: JSON.stringify({ http: res.status, msg: res.body?.message, errs: res.body?.errors, sent, appropriation_detail: ad, edicaoBloco: edit.slice(0, 300), visualizarTemApropriacao: /Pecu[aá]ria/.test(view), antes: before.slice(0, 200) }), result: ok ? 'PASSOU' : 'FALHOU' });
    if (uuid) saveState({ expenses: [...(loadState().expenses ?? []), { id: c.id, uuid }] });
    if (!ok) { await shot(page, `795-${c.id}-FALHA`); throw new Error(`${exp} | http=${res.status} ${JSON.stringify(res.body?.errors ?? res.body?.message)} sent=${JSON.stringify(sent)} detOk=${detOk}`); }
  });
});
