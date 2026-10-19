import { Page, expect } from '@playwright/test';
import fs from 'fs';
export const EVID = '/home/pietro/ambiente/CORE_WORKSPACE/97-Esteiras/102/EVIDENCIAS/e2e-legado';
export const LOG = EVID + '/casos.jsonl';
export async function login(page: Page) {
  page.setDefaultTimeout(20000);
  await page.goto('/login');
  await page.fill('input[name=email]', process.env.LOGIN_EMAIL!);
  await page.fill('input[name=password]', process.env.LOGIN_PASSWORD!);
  await Promise.all([page.waitForLoadState('networkidle'), page.locator('form.form button').first().click()]);
}
export function rec(o: any) { fs.appendFileSync(LOG, JSON.stringify(o) + '\n'); }
export async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${EVID}/${name}.png`, fullPage: true });
}
// estado de um conjunto de campos
export async function st(page: Page, ids: string[]) {
  return page.evaluate((ids) => {
    const o: any = {};
    for (const id of ids) {
      const e = document.querySelector('#' + id) as any;
      if (!e) { o[id] = 'ausente'; continue; }
      const vis = !!(e.offsetParent || e.closest('.select2-hidden-accessible')?.parentElement?.offsetParent);
      const wrap = e.closest('.form-group')?.parentElement as HTMLElement | null;
      const hidden = !!wrap && wrap.offsetParent === null;
      o[id] = { v: e.value, dis: !!e.disabled, ro: e.hasAttribute('readonly'), oculto: hidden };
      if (e.tagName === 'SELECT') {
        o[id].optDis = [...e.options].filter((x: any) => x.disabled).map((x: any) => x.value);
        o[id].nOpts = e.options.length;
      }
    }
    return o;
  }, ids);
}
export async function setSel(page: Page, id: string, value: string) {
  await page.evaluate(([id, v]) => { const $ = (window as any).jQuery; const el = document.getElementById(id as string) as HTMLSelectElement; el.value = v as string; $(el).trigger('change'); }, [id, value]);
  await page.waitForTimeout(400);
}
export async function msgs(page: Page) {
  return page.evaluate(() => [...document.querySelectorAll('.alert, .swal2-popup, .toast, .invalid-feedback, .text-danger, .swal2-html-container, #toast-container')].map(e => (e as HTMLElement).innerText.trim()).filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).slice(0,8));
}

export async function pickSelect2Ajax(page: Page, sel: string, term: string, nth = 0): Promise<string> {
  await page.locator(sel).first().evaluate((e) => (e as HTMLElement).scrollIntoView({ block: 'center' }));
  await page.locator(sel).first().evaluate((e: any) => { (window as any).jQuery(e).trigger('click'); });
  await page.waitForTimeout(300);
  // select2 aberto?
  let search = page.locator('.select2-container--open .select2-search__field');
  if (!(await search.count())) {
    await page.locator(sel).first().evaluate((e: any) => { const $ = (window as any).jQuery; $(e).select2('open'); });
    search = page.locator('.select2-container--open .select2-search__field');
  }
  await search.first().fill(term);
  await page.waitForFunction(() => { const r = document.querySelectorAll('.select2-results__option'); return r.length > 0 && ![...r].some(x => /Buscando|Searching|Carregando/i.test(x.textContent || '')); }, null, { timeout: 15000 }).catch(() => {});
  const opts = page.locator('.select2-results__option[role=option], .select2-results__option[aria-selected]');
  const n = await opts.count();
  if (n <= nth) { await page.keyboard.press('Escape'); return 'SEM_RESULTADO:' + term; }
  const txt = (await opts.nth(nth).innerText()).trim();
  await opts.nth(nth).click();
  await page.waitForTimeout(500);
  return txt;
}
export async function pickSelect2Static(page: Page, id: string, value: string) { await setSel(page, id, value); }
export async function swalText(page: Page): Promise<string> {
  const t = await page.evaluate(() => { const e = document.querySelector('.swal-overlay--show-modal, .swal2-popup, .swal-modal') as HTMLElement | null; return e ? e.innerText.trim().replace(/\s+/g, ' ') : ''; });
  return t;
}
export async function closeSwal(page: Page) {
  const b = page.locator('.swal-button--confirm, .swal2-confirm, .swal-button').first();
  if (await b.count() && await b.isVisible().catch(()=>false)) await b.click().catch(()=>{});
  await page.waitForTimeout(300);
}
export async function fillMoney(page: Page, sel: string, v: string) {
  const loc = page.locator(sel).first();
  await loc.click(); await loc.fill(''); await loc.type(v, { delay: 15 }); await loc.blur(); await page.waitForTimeout(250);
}

export type Rat = { term?: string; nth?: number; centro?: string; valor?: string; pct?: string };
export type Mov = { tipo: string; tp: string; conta: string; farm?: string; prop?: string; valor: string; juros?: string; data?: string; doc?: string; nota?: string;
  cliente?: number; fornecedor?: number; destino?: string; rateio?: Rat[]; fiscal?: string };
export async function opt(page: Page, id: string, idx: number): Promise<string> {
  return page.evaluate(([id, idx]) => { const o = [...(document.getElementById(id as string) as HTMLSelectElement).options].filter(x => x.value && !x.disabled); return o[(idx as number) % o.length]?.value || ''; }, [id, idx]);
}
export async function optText(page: Page, id: string): Promise<string> {
  return page.evaluate((id) => { const s = document.getElementById(id) as HTMLSelectElement; return s.selectedOptions[0]?.text || ''; }, id);
}
export async function fillMov(page: Page, c: Mov) {
  const out: any = {};
  await page.goto('/movements/create'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(700);
  await setSel(page, 'inp-type', c.tipo); await setSel(page, 'inp-type_category', c.tp);
  if (c.data) out.dataDigitada = await setDate(page, '#inp-date', c.data);
  await setSel(page, 'inp-account_id', c.conta);
  if (c.farm) await setSel(page, 'inp-farm_id', c.farm);
  await setSel(page, 'inp-proprietary_id', c.prop || '189');
  await fillMoney(page, '#inp-value', c.valor);
  if (c.juros) await fillMoney(page, '#inp-interest', c.juros);
  if (c.doc) await page.fill('#inp-document', c.doc);
  if (c.nota) await page.fill('#inp-note', c.nota);
  if (c.fiscal) await setSel(page, 'inp-fiscal_document', c.fiscal);
  if (c.cliente != null) { const v = await opt(page, 'inp-client_id', c.cliente); await setSel(page, 'inp-client_id', v); out.cliente = await optText(page, 'inp-client_id'); }
  if (c.fornecedor != null) { const v = await opt(page, 'inp-provider_id', c.fornecedor); await setSel(page, 'inp-provider_id', v); out.fornecedor = await optText(page, 'inp-provider_id'); }
  if (c.destino) await setSel(page, 'inp-destination_account_id', c.destino);
  const rat = c.rateio || [{ term: c.tp === 'E' ? 'ven' : c.tp === 'T' ? 'mov' : (c.tp === 'F' ? (c.tipo === 'E' ? 'emp' : 'emp') : 'sal'), centro: '761' }];
  out.rateio = [];
  for (let i = 0; i < rat.length; i++) {
    if (i > 0) { await page.locator('.btn-add').first().click(); await page.waitForTimeout(500); }
    const row = page.locator('table.table-dynamic:visible tbody tr').nth(i);
    const sel = row.locator('select.select-categories');
    const idx = i;
    const handle = await sel.elementHandle();
    const r = rat[i];
    let txt = '';
    await handle!.evaluate((e: any) => { (window as any).jQuery(e).trigger('click'); });
    await page.waitForTimeout(300);
    const search = page.locator('.select2-container--open .select2-search__field');
    await search.first().fill(r.term || 'sal');
    await page.waitForFunction(() => { const x = document.querySelectorAll('.select2-results__option'); return x.length > 0 && ![...x].some(y => /Buscando|Searching|Carregando/i.test(y.textContent || '')); }, null, { timeout: 15000 }).catch(() => {});
    const opts = page.locator('.select2-results__option[role=option], .select2-results__option[aria-selected]');
    if ((await opts.count()) > (r.nth || 0)) { txt = (await opts.nth(r.nth || 0).innerText()).trim(); await opts.nth(r.nth || 0).click(); } else { await page.keyboard.press('Escape'); txt = 'SEM_RESULTADO:' + r.term; }
    await page.waitForTimeout(500);
    if (r.centro) await row.locator('select[name="centers[]"]').evaluate((e: any, v) => { const $ = (window as any).jQuery; $(e).val(v).trigger('change'); }, r.centro);
    if (r.valor) { const vi = row.locator('.category-values'); await vi.click(); await vi.fill(''); await vi.type(r.valor, { delay: 15 }); await vi.blur(); await page.waitForTimeout(400); }
    out.rateio.push({ cat: txt, centro: r.centro, valor: await row.locator('.category-values').inputValue(), pct: await row.locator('.category-percents').inputValue() });
  }
  out.totais = await page.evaluate(() => ({ tot: document.querySelector('#category-total')?.textContent, pct: document.querySelector('#category-percent')?.textContent, tt: document.querySelector('#total-title-value')?.textContent }));
  out.codigo = await page.inputValue('#inp-code');
  return out;
}
export async function submitMov(page: Page) {
  const urlBefore = page.url();
  const inv = await invalidos(page);
  await page.locator('#form-movements button[type=submit]').click();
  await page.waitForTimeout(1500);
  const sw = await swalText(page);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1500);
  return { url: page.url(), swal: sw || await swalText(page), msgs: (await msgs(page)).filter(m => !m.includes('Creditares')), invalidos: inv };
}

export type Exp = { farm?: string; number: string; typeId?: string; prop?: string; pay?: string; classif?: string; fiscal?: string; amount: string; emissao?: string; venc?: string;
  juros?: string; desconto?: string; multa?: string; fornecedor?: number; aprop?: string; apropType?: string; nota: string; rateio?: Rat[]; area?: string[];
  pec?: { area?: number | string; grazing?: number | string; batch?: number | string; animal?: number | string; op?: number | string; act?: number | string };
  man?: { equip?: number | string; hor?: string; km?: string };
  parc?: { qtd: string; primeira: string; intervalo?: string; entrada?: string; dataEntrada?: string } };
export async function fillExp(page: Page, e: Exp) {
  const out: any = {};
  await page.goto('/expenses/create'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(700);
  if (e.farm) { await setSel(page, 'inp-farm_id', e.farm); await page.waitForTimeout(800); }
  await page.fill('#inp-number', e.number);
  await setSel(page, 'inp-type_id', e.typeId || '1');
  await setSel(page, 'proprietary_id', e.prop || '189');
  if (e.classif) await setSel(page, 'inp-classification', e.classif);
  if (e.fiscal) await setSel(page, 'inp-fiscal_document', e.fiscal);
  await fillMoney(page, '#inp-amount', e.amount);
  out.emissao = await setDate(page, '#inp-dt_emission', e.emissao || '15/10/2026');
  if (e.juros) await fillMoney(page, '#inp-interest', e.juros);
  if (e.desconto) await fillMoney(page, '#inp-discount', e.desconto);
  if (e.multa) await fillMoney(page, '#inp-penalty', e.multa);
  const pay = e.pay || '1';
  if (pay === '2' && e.parc) {
    await setSel(page, 'inp-payment_type', '2'); await page.waitForTimeout(800);
    out.totalPrefillModal = await page.inputValue('#inp-total_amount');
    out.dataPrimeira = await setDate(page, '#inp-first_installment', e.parc.primeira);
    await closeSwal(page);
    await fillMoney(page, '#inp-total_amount', e.amount);
    if (e.parc.intervalo) await page.locator('#inp-int_installments').fill(e.parc.intervalo);
    if (e.parc.entrada) { await setSel(page, 'inp-has_input', '1'); await fillMoney(page, '#inp-input_value', e.parc.entrada); await setDate(page, '#inp-input_date', e.parc.dataEntrada || e.parc.primeira); }
    const q = page.locator('#inp-qtd_installments'); await q.click(); await q.press('Control+A'); await q.type(e.parc.qtd, { delay: 40 });
    await page.waitForTimeout(800); out.swalParcelas = await swalText(page); await closeSwal(page);
    await page.locator('#inp-total_amount').click(); await page.locator('#inp-total_amount').blur(); await page.waitForTimeout(1000);
    out.parcelas = await page.evaluate(() => [...document.querySelectorAll('#table-installments tbody tr')].map(r => (r as HTMLElement).innerText.trim().split(/\s+/)[0] + ' venc=' + [...r.querySelectorAll('input:not([type=file])')].map((x: any) => x.value).join(' valor=')));
    out.totParc = await page.evaluate(() => document.getElementById('total-installments')?.textContent?.trim());
    await page.locator('#form-parcelamento button[type=submit]').click(); await page.waitForTimeout(1200);
    out.aposConfirmarParcelas = await page.evaluate(() => ({ amount: (document.getElementById('inp-amount') as any).value, amountSomenteLeitura: (document.getElementById('inp-amount') as any).readOnly, venc: (document.getElementById('inp-due_date') as any).value, vencSomenteLeitura: (document.getElementById('inp-due_date') as any).readOnly, selo: (document.querySelector('.badge-installment') as HTMLElement)?.innerText.replace(/\s+/g, ' ') }));
  } else {
    await setSel(page, 'inp-payment_type', pay);
    out.venc = await setDate(page, '#inp-due_date', e.venc || '30/10/2026');
  }
  if (e.fornecedor != null) { const v = await opt(page, 'inp-provider_id', e.fornecedor); await setSel(page, 'inp-provider_id', v); out.fornecedor = (await optText(page, 'inp-provider_id')).slice(0, 60); }
  await setSel(page, 'inp-appropriation', e.aprop || '2');
  if (e.aprop === '1' && e.apropType) await setSel(page, 'inp-appropriation_type', e.apropType);
  await page.fill('#inp-note', e.nota);
  // apropriação
  if (e.pec) {
    const p = e.pec;
    const pick = async (name: string, idx?: number | string) => { if (idx == null) return ''; const v = await page.evaluate(([n, i]) => { const s = document.querySelector(`[name="${n}"]`) as HTMLSelectElement; const o = [...s.options].filter(x => x.value); if (!o.length) return ''; const x = typeof i === 'string' ? o.find(y => y.value === i) : o[(i as number) % o.length]; return x ? x.value + '|' + x.text.trim() : ''; }, [name, idx] as any); if (!v) return 'SEM_OPCOES'; await page.evaluate(([n, val]) => { const $ = (window as any).jQuery; $(`[name="${n}"]`).val(val).trigger('change'); }, [name, v.split('|')[0]]); await page.waitForTimeout(1100); return v.split('|')[1]; };
    out.pec = { area: await pick('aprop_area_id', p.area), grazing: await pick('aprop_grazing_id', p.grazing), batch: await pick('aprop_batch_id', p.batch), animal: await pick('aprop_animal_id', p.animal) };
    out.pec.op = await pick('aprop_operation_id', p.op);
    out.pec.actOpts = await page.evaluate(() => (document.querySelectorAll('[name="aprop_activity_id"] option').length));
    if (p.act != null) out.pec.act = await pick('aprop_activity_id', p.act);
  }
  if (e.man) {
    const m = e.man;
    const v = await page.evaluate((i) => { const s = document.querySelector('[name="aprop_equipment_id"]') as HTMLSelectElement; const o = [...s.options].filter(x => x.value); if (typeof i === 'string') { const f = o.find(x => x.value === i); return f ? f.value + '|' + f.text.trim() + '|' + f.getAttribute('data-family') : ''; } const x = o[(i as number) % o.length]; return x.value + '|' + x.text.trim() + '|' + x.getAttribute('data-family'); }, m.equip as any);
    out.equip = v;
    if (v) { await page.evaluate((val) => { const $ = (window as any).jQuery; $('[name="aprop_equipment_id"]').val(val).trigger('change'); }, v.split('|')[0]); await page.waitForTimeout(700); }
    out.contMan = await page.evaluate(() => { const h = document.querySelector('.aprop-hour-meter-container') as HTMLElement | null, k = document.querySelector('.aprop-mileage-container') as HTMLElement | null; return { horimetro: h ? (h.offsetParent ? 'visivel' : 'oculto') : 'ausente', km: k ? (k.offsetParent ? 'visivel' : 'oculto') : 'ausente', hLabel: h?.innerText.trim().replace(/\s+/g, ' '), kLabel: k?.innerText.trim().replace(/\s+/g, ' ') }; });
    if (m.hor != null) { const loc = page.locator('.aprop-hour-meter'); if (await loc.isVisible().catch(() => false)) { await loc.click(); await loc.fill(''); await loc.type(m.hor, { delay: 30 }); await loc.blur(); out.horAposDigitar = await loc.inputValue(); } else out.horAposDigitar = 'CAMPO_OCULTO'; }
    if (m.km != null) { const loc = page.locator('.aprop-mileage'); if (await loc.isVisible().catch(() => false)) { await loc.click(); await loc.fill(''); await loc.type(m.km, { delay: 30 }); await loc.blur(); out.kmAposDigitar = await loc.inputValue(); } else out.kmAposDigitar = 'CAMPO_OCULTO'; }
  }
  // rateio
  const rat = e.rateio || [{ term: 'sal', centro: '761', pct: '10000' }];
  out.rateio = [];
  for (let i = 0; i < rat.length; i++) {
    if (i > 0) { await page.locator('.btn-add').first().click(); await page.waitForTimeout(500); }
    const row = page.locator('table.table-dynamic:visible tbody tr').nth(i);
    const r = rat[i];
    const h = await row.locator('select.select-categories').elementHandle();
    await h!.evaluate((x: any) => { x.scrollIntoView({ block: 'center' }); (window as any).jQuery(x).trigger('click'); });
    await page.waitForTimeout(300);
    await page.locator('.select2-container--open .select2-search__field').first().fill(r.term || 'sal');
    await page.waitForFunction(() => { const x = document.querySelectorAll('.select2-results__option'); return x.length > 0 && ![...x].some(y => /Buscando|Searching|Carregando/i.test(y.textContent || '')); }, null, { timeout: 15000 }).catch(() => {});
    const opts = page.locator('.select2-results__option[role=option], .select2-results__option[aria-selected]');
    let txt = '';
    if ((await opts.count()) > (r.nth || 0)) { txt = (await opts.nth(r.nth || 0).innerText()).trim(); await opts.nth(r.nth || 0).click(); } else { await page.keyboard.press('Escape'); txt = 'SEM_RESULTADO:' + r.term; }
    await page.waitForTimeout(500);
    if (r.centro) await setCentro(row, r.centro);
    if (e.area && e.area[i]) { await row.locator('select[name="area_id[]"]').evaluate((x: any, v) => { (window as any).jQuery(x).val(v).trigger('change'); }, e.area[i]); }
    if (r.pct) { const pi = row.locator('.category-percents'); await pi.click(); await pi.fill(''); await pi.type(r.pct, { delay: 15 }); await pi.blur(); await page.waitForTimeout(400); }
    else if (r.valor) { const vi = row.locator('.category-values'); await vi.click(); await vi.fill(''); await vi.type(r.valor, { delay: 15 }); await vi.blur(); await page.waitForTimeout(400); }
    out.rateio.push({ cat: txt, centro: r.centro, valor: await row.locator('.category-values').inputValue(), pct: await row.locator('.category-percents').inputValue() });
  }
  out.totais = await page.evaluate(() => ({ tot: document.querySelector('#category-total')?.textContent, pct: document.querySelector('#category-percent')?.textContent }));
  return out;
}
export async function submitExp(page: Page) {
  const inv = await invalidos(page);
  await page.locator('#form-expense button[type=submit]').last().click();
  await page.waitForTimeout(1500);
  const sw = await swalText(page);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1500);
  return { url: page.url(), swal: sw || await swalText(page), msgs: (await msgs(page)).filter(m => !m.includes('Creditares')), invalidos: inv };
}

export async function invalidos(page: Page) {
  return page.evaluate(() => [...document.querySelectorAll('form :invalid')].filter((e: any) => !e.closest('.modal') && e.name).map((e: any) => e.name + ':' + (e.validationMessage || '')).slice(0, 8));
}

export async function setDate(page: Page, sel: string, v: string) {
  const d = page.locator(sel).first();
  await d.click(); await d.press('Control+A'); await d.press('Delete'); await d.type(v, { delay: 30 });
  await page.keyboard.press('Escape'); await page.locator('h4, .card-header-custom, body').first().click({ position: { x: 1, y: 1 }, force: true }).catch(() => {});
  await page.waitForTimeout(200);
  return d.inputValue();
}
export async function setCentro(row: any, v?: string) {
  await row.locator('select[name="centers[]"]').evaluate((x: any, v: any) => { const $ = (window as any).jQuery; const has = [...x.options].some((o: any) => o.value === v); const val = has ? v : ([...x.options].find((o: any) => o.value) || {}).value; $(x).val(val).trigger('change'); }, v);
}

export const FARM_MTZ = '294';
export async function useFarm(page: Page, id: string) {
  await page.goto('/change-farm/' + id); await page.waitForLoadState('networkidle').catch(() => {});
  return headerFarm(page);
}
export async function headerFarm(page: Page) {
  return page.evaluate(() => (document.querySelector('.dropdown-farm') as HTMLElement | null)?.innerText.trim().split('\n')[0] || '?');
}
export async function openMov(page: Page) { await page.goto('/movements/create'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(700); }
export async function movState(page: Page) {
  const s = await st(page, ['inp-type', 'inp-type_category', 'inp-client_id', 'inp-provider_id', 'inp-generates_obligation', 'inp-destination_account_id']);
  const lbl = await page.evaluate(() => (document.querySelector('#inp-destination_account_id')?.closest('.form-group')?.querySelector('label') as HTMLElement | null)?.innerText || '');
  const cats = await page.evaluate(() => [...(document.querySelector('table.table-dynamic') as HTMLElement).querySelectorAll('select.select-categories')].map(s => (s as HTMLSelectElement).selectedOptions[0]?.text?.trim() || ''));
  const bt = await page.evaluate(() => ({ addCliente: (document.querySelector('#btn-add-client') as HTMLButtonElement)?.disabled, addForn: (document.querySelector('#btn-add-provider') as HTMLButtonElement)?.disabled }));
  const f = (x: any) => x === 'ausente' ? 'ausente' : `${x.ro ? 'SOMENTE-LEITURA' : 'editável'}${x.oculto ? '/oculto' : ''}${x.v ? ' v=' + x.v : ''}`;
  return {
    tipo: s['inp-type'].v, tpCat: s['inp-type_category'].v, tpCatOpcoesDesabilitadas: s['inp-type_category'].optDis,
    cliente: f(s['inp-client_id']), fornecedor: f(s['inp-provider_id']), geraObrig: s['inp-generates_obligation'].v + (s['inp-generates_obligation'].ro ? ' (somente-leitura)' : ''),
    contaDestino: s['inp-destination_account_id'].oculto ? 'oculta' : 'visível', rotuloConta: lbl, btnAddCliente: bt.addCliente ? 'desab' : 'hab', btnAddFornecedor: bt.addForn ? 'desab' : 'hab', catsRateio: cats,
  };
}
export async function selRow(page: Page, rowIdx: number, term: string, nth = 0) {
  const h = await page.locator('table.table-dynamic:visible tbody tr').nth(rowIdx).locator('select.select-categories').elementHandle();
  await h!.evaluate((x: any) => { x.scrollIntoView({ block: 'center' }); (window as any).jQuery(x).trigger('click'); });
  await page.waitForTimeout(300);
  await page.locator('.select2-container--open .select2-search__field').first().fill(term);
  await page.waitForFunction(() => { const x = document.querySelectorAll('.select2-results__option'); return x.length > 0 && ![...x].some(y => /Buscando|Searching|Carregando/i.test(y.textContent || '')); }, null, { timeout: 15000 }).catch(() => {});
  const all = await page.locator('.select2-results__option').allInnerTexts();
  const opts = page.locator('.select2-results__option[role=option], .select2-results__option[aria-selected]');
  if ((await opts.count()) > nth) { await opts.nth(nth).click(); await page.waitForTimeout(400); } else { await page.keyboard.press('Escape'); }
  return all.map(x => x.trim());
}

export async function dumpForm(page: Page, formSel: string) {
  return page.evaluate((fs) => {
    const f = document.querySelector(fs) as HTMLFormElement; const o: any = {};
    if (!f) return { ERRO: 'form ausente ' + fs };
    f.querySelectorAll('input:not([type=hidden]):not([type=file]):not([type=search]), select, textarea, input[type=hidden][name=movement_id], input[type=hidden][name=farm_id]').forEach((e: any) => {
      if (!e.name || e.closest('.modal') || e.name === '_token') return;
      let v = e.tagName === 'SELECT' ? (e.selectedOptions[0]?.text || '').trim().slice(0, 60) : String(e.value).trim().slice(0, 80);
      if (e.tagName === 'SELECT' && !e.value) v = '';
      if (!v || v === 'Selecione') return;
      const k = e.name; if (o[k] !== undefined) { o[k] = [].concat(o[k], v as any); } else o[k] = v;
    });
    return o;
  }, formSel);
}
export async function autoFillRequired(page: Page, formSel: string, num: string) {
  for (let pass = 0; pass < 3; pass++) {
    const list = await page.evaluate((fs) => [...document.querySelectorAll(fs + ' :invalid')].filter((e: any) => !e.closest('.modal') && e.name && !e.disabled).map((e: any) => ({ n: e.name, t: e.tagName, ty: e.type })), formSel);
    if (!list.length) break;
    for (const f of list) {
      if (f.n.includes('categories') || f.n.includes('centers')) continue;
      if (f.t === 'SELECT') await page.evaluate(([n]) => { const $ = (window as any).jQuery; const s = document.querySelector(`select[name="${n}"]`) as HTMLSelectElement; const o = s && [...s.options].find(x => x.value); if (o) $(s).val(o.value).trigger('change'); }, [f.n]);
      else if (/date|due|emiss/.test(f.n)) await setDate(page, `input[name="${f.n}"]`, '30/10/2026');
      else if (/number/.test(f.n)) await page.fill(`input[name="${f.n}"]`, num);
      else if (f.t === 'TEXTAREA') await page.fill(`[name="${f.n}"]`, 'QA102L rascunho');
      else await page.fill(`[name="${f.n}"]`, '1').catch(() => {});
    }
  }
}
import fs2 from 'fs';
export const STATE = EVID + '/state.json';
export function stateGet(): any { try { return JSON.parse(fs2.readFileSync(STATE, 'utf8')); } catch { return { movs: [], exps: [] }; } }
export function stateAdd(k: string, v: any) { const s = stateGet(); (s[k] = s[k] || []).push(v); fs2.writeFileSync(STATE, JSON.stringify(s, null, 1)); }
export async function listRows(page: Page) {
  return page.evaluate(() => [...document.querySelectorAll('table tbody tr')].map(r => {
    const t = [...r.querySelectorAll('td')].map(td => (td as HTMLElement).innerText.trim().replace(/\s+/g, ' '));
    const a = r.querySelector('a[href*="/edit"]') as HTMLAnchorElement | null;
    return { cells: t, edit: a?.getAttribute('href') || '' };
  }));
}
export async function findMov(page: Page, code: string, extra = '') {
  await page.goto(`/movements?pagination_quantity=200${extra}`); await page.waitForLoadState('networkidle');
  const rows = await listRows(page);
  return rows.filter(r => r.cells[1] === code);
}

export async function listaFiltrada(page: Page, qs: string) {
  await page.goto(`/movements?${qs}`); await page.waitForLoadState('networkidle');
  const rows = await listRows(page);
  const caption = await page.evaluate(() => document.querySelector('table caption')?.textContent?.trim() || '');
  const foot = await page.evaluate(() => [...document.querySelectorAll('table tfoot tr, table tbody tr')].filter(r => /total/i.test((r as HTMLElement).innerText.slice(0, 12))).map(r => (r as HTMLElement).innerText.trim().replace(/\s+/g, ' ')));
  return { rows, caption, foot };
}
export async function deleteFromRow(page: Page, rowIdx: number) {
  const row = page.locator('table tbody tr').nth(rowIdx);
  await row.locator('a[data-toggle=dropdown]').click(); await page.waitForTimeout(300);
  await row.locator('button.btn-delete').click(); await page.waitForTimeout(800);
  const txt = await swalText(page);
  const conf = page.locator('.swal-button--confirm, .swal2-confirm').first();
  let ok = false;
  if (await conf.count()) { await conf.click(); ok = true; }
  await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(1500);
  return { confirmacao: txt, clicouConfirmar: ok, msgs: (await msgs(page)).filter(m => !m.includes('Creditares')), swalDepois: await swalText(page) };
}
