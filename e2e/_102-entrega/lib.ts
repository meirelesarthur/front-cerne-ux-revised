import { Page, APIRequestContext } from '@playwright/test';
export const OUT = '/home/pietro/ambiente/CORE_WORKSPACE/97-Esteiras/102/EVIDENCIAS/e2e';
export const API = 'http://localhost:8080/api/v1';

export async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
}

export async function apiHeaders(page: Page) {
  const farm = await page.evaluate(() => localStorage.getItem('app-active-farm'));
  const tok = await page.evaluate(() => localStorage.getItem('app-token'));
  const h: Record<string, string> = { Accept: 'application/json', 'X-Farm-Id': farm ?? '', Origin: 'http://localhost:5173', Referer: 'http://localhost:5173/' };
  if (tok) h['Authorization'] = `Bearer ${tok}`;
  return h;
}
export async function apiGet(page: Page, path: string, params: Record<string, any> = {}) {
  const r = await page.request.get(`${API}${path}`, { headers: await apiHeaders(page), params });
  let body: any = null;
  try { body = await r.json(); } catch { /* empty */ }
  return { status: r.status(), body };
}
export async function apiSend(page: Page, method: 'post'|'put'|'delete'|'patch', path: string, data?: any) {
  const r = await (page.request as APIRequestContext)[method](`${API}${path}`, { headers: await apiHeaders(page), data });
  let body: any = null;
  try { body = await r.json(); } catch { /* empty */ }
  return { status: r.status(), body };
}

export async function setDate(page: Page, iso: string) {
  const [y, m, d] = iso.split('-');
  const inp = page.locator('input[placeholder="DD/MM/YYYY"]').first();
  await inp.click(); await inp.fill(`${d}/${m}/${y}`); await inp.press('Tab');
}
export async function pickChakra(page: Page, label: string, optText: string | RegExp) {
  const f = group(page, label);
  const t = f.getByRole('combobox');
  await t.scrollIntoViewIfNeeded();
  for (let i = 0; i < 3; i++) {
    await t.click(); await page.waitForTimeout(250);
    if ((await t.getAttribute('aria-expanded')) === 'true') break;
  }
  await page.locator('div[role=option]:visible', { hasText: optText }).first().click();
}
// react-select / combobox por id do input. Se text for number, escolhe a n-ésima opção.
export async function pickAsync(page: Page, id: string, text: string | number = 0, search?: string) {
  const inp = page.locator(`[id="${id}"]`).first();
  await inp.click();
  if (search) { await inp.fill(search); await page.waitForTimeout(900); }
  const opts = page.locator('div[role=option]:visible');
  await opts.first().waitFor({ timeout: 10000 });
  if (typeof text === 'number') await opts.nth(text).click();
  else await opts.filter({ hasText: text }).first().click();
}
export async function typeMoney(page: Page, id: string, cents: string) {
  const inp = page.locator(`[id="${id}"]`).first();
  await inp.click(); await inp.fill(''); await inp.pressSequentially(cents, { delay: 15 });
}
export async function pickCombo(page: Page, placeholder: string, text: string | number = 0) {
  const inp = page.locator(`input[placeholder="${placeholder}"]`).first();
  await inp.click(); await page.waitForTimeout(400);
  const opts = page.locator('div[role=option]:visible');
  if (!(await opts.count())) { await inp.press('ArrowDown'); await page.waitForTimeout(400); }
  await opts.first().waitFor({ timeout: 8000 });
  if (typeof text === 'number') await opts.nth(text).click(); else await opts.filter({ hasText: text }).first().click();
}
import * as fs from 'fs';
export const STATE = '/tmp/claude-1000/-home-pietro-ambiente/573685d7-0cbe-45d5-82b6-020d81e9fd72/scratchpad/qa102-state.json';
export function loadState(): any { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { return {}; } }
export function saveState(patch: any) { fs.writeFileSync(STATE, JSON.stringify({ ...loadState(), ...patch }, null, 1)); }
export const LOG = '/tmp/claude-1000/-home-pietro-ambiente/573685d7-0cbe-45d5-82b6-020d81e9fd72/scratchpad/qa102-matrix.jsonl';
export function logCase(row: Record<string, any>) { fs.appendFileSync(LOG, JSON.stringify(row) + '\n'); }
export const money = (n: number) => n.toFixed(2);

export const TC_LABEL: Record<string, string> = { E: 'Entrada', S: 'Saída', T: 'Trans. Interna', F: 'Financiamento/Empréstimo' };
export const TP_LABEL: Record<string, string> = { E: 'Entrada', S: 'Saída' };
export function group(page: Page, label: string) {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return page.locator('[data-scope=field][role=group]').filter({ has: page.locator('label', { hasText: new RegExp('^' + esc + '\\s*\\*?\\s*$') }) }).first();
}
export async function gotoNovo(page: Page) {
  await page.goto('/financeiro/caixa/novo');
  await page.locator('input[placeholder="DD/MM/YYYY"]').first().waitFor({ timeout: 20000 });
  await page.waitForTimeout(2500);
}
export async function openTc(page: Page) {
  const t = group(page, 'Tp. Categoria').getByRole('combobox');
  for (let i = 0; i < 3; i++) { await t.click(); await page.waitForTimeout(250); if ((await t.getAttribute('aria-expanded')) === 'true') break; }
}
export async function readTcOptions(page: Page) {
  await openTc(page);
  const r = await page.locator('div[role=option]:visible').evaluateAll((els) => els.map((x) => `${x.textContent}${x.getAttribute('aria-disabled') === 'true' ? '(desab)' : ''}`));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  return r;
}
export async function readFormState(page: Page) {
  const sw = page.locator('input[id^="switch::"]');
  const nSw = await sw.count();
  const clientTxt = await group(page, 'Cliente').innerText();
  const provTxt = await group(page, 'Fornecedor').innerText();
  return {
    tcOptions: await readTcOptions(page),
    clientDisabled: await page.locator('[id="client_uuid"]').isDisabled(),
    providerDisabled: await page.locator('[id="provider_uuid"]').isDisabled(),
    clientEmpty: /Buscar cliente/.test(clientTxt),
    providerEmpty: /Buscar fornecedor/.test(provTxt),
    destVisible: (await page.locator('label', { hasText: /Conta (Destino|Origem)/ }).count()) > 0,
    genObr: nSw >= 2 ? await sw.nth(1).isChecked() : null,
    tipoTxt2: '',
    tcTxt: ((await group(page, 'Tp. Categoria').locator('[data-part=value-text]').first().innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim(),
    tipoVal: ((await group(page, 'Tipo').locator('[data-part=value-text]').first().innerText().catch(() => '')) || '').trim(),
    catRateioEmpty: /Buscar categoria/.test(await page.locator('div').filter({ has: page.locator('label', { hasText: /^Categoria/ }) }).filter({ has: page.locator('[id="allocations.0.category_uuid"]') }).last().innerText().catch(() => 'Buscar categoria')),
    clientTxt: clientTxt.replace(/\s+/g, ' ').trim(),
    provTxt: provTxt.replace(/\s+/g, ' ').trim(),
  };
}

export interface MovCase {
  id: string; tp: 'E' | 'S'; tc: 'E' | 'S' | 'T' | 'F'; acc: string; dest?: string; value: string; // centavos em dígitos
  interest?: string; date: string; party?: number; prop?: number; doc?: string; rateio: { cat: number; center: number; cents: string }[];
  expect?: 'ok' | 'fail'; note?: string;
}
export async function accountBalance(page: Page, uuid: string): Promise<number> {
  const r = await apiGet(page, `/accounts/${uuid}`);
  return Number(r.body?.data?.balance ?? NaN);
}
export async function fillMovementUI(page: Page, c: MovCase, fromList = false) {
  const st = loadState();
  if (fromList) {
    await page.goto('/financeiro/caixa'); await page.getByRole('button', { name: /Novo\(a\)/ }).waitFor({ timeout: 30000 });
    await page.waitForTimeout(1500); await page.getByRole('button', { name: /Novo\(a\)/ }).click();
    await page.locator('input[placeholder="DD/MM/YYYY"]').first().waitFor({ timeout: 20000 }); await page.waitForTimeout(2500);
  } else await gotoNovo(page);
  await setDate(page, c.date);
  await pickChakra(page, 'Tipo', TP_LABEL[c.tp]);
  await pickChakra(page, 'Tp. Categoria', new RegExp('^' + TC_LABEL[c.tc].replace('/', '\\/') + '$'));
  const accCode = { accA: 'Q1A', accB: 'Q1B', accC: 'Q1C', accD: 'Q1D' }[c.acc]!;
  await pickAsync(page, 'account_uuid', 0, accCode);
  if (c.tc === 'T' && c.dest) {
    const dc = { accA: 'Q1A', accB: 'Q1B', accC: 'Q1C', accD: 'Q1D' }[c.dest]!;
    await pickAsync(page, 'destination_account_uuid', 0, dc);
  }
  await pickCombo(page, 'Buscar proprietário', c.prop ?? 0);
  if (c.party !== undefined) {
    const isClient = (c.tc === 'E') || (c.tc === 'F' && c.tp === 'S');
    await pickAsync(page, isClient ? 'client_uuid' : 'provider_uuid', c.party);
  }
  await typeMoney(page, 'value', c.value);
  if (c.interest) await typeMoney(page, 'interest', c.interest);
  if (c.doc) await page.locator('input[name="document"]').fill(c.doc);
  await page.locator('textarea').first().fill(c.note ?? `QA102-${c.id}`);
  for (let i = 0; i < c.rateio.length; i++) {
    if (i > 0) { await page.getByRole('button', { name: /Adicionar Rateio/ }).click(); await page.waitForTimeout(500); }
    const r = c.rateio[i];
    await page.locator(`[id="allocations.${i}.category_uuid"]`).click(); await page.waitForTimeout(900);
    await page.locator('div[role=option]:visible').nth(r.cat).click();
    await pickAsync(page, `allocations.${i}.center_uuid`, r.center);
    await typeMoney(page, `allocations.${i}.value`, r.cents);
  }
  void st;
}
export async function saveMovementUI(page: Page) {
  let cap: { status: number; body: any; reqBody: any } = { status: 0, body: null, reqBody: null };
  const handler = async (route: any) => {
    const req = route.request();
    if (!['POST', 'PUT'].includes(req.method())) return route.fallback();
    const r = await route.fetch();
    let body: any = null; try { body = await r.json(); } catch { /* */ }
    let reqBody: any = null; try { reqBody = req.postDataJSON(); } catch { /* */ }
    cap = { status: r.status(), body, reqBody };
    await route.fulfill({ response: r });
  };
  await page.route(/\/api\/v1\/movements(\/[0-9a-f-]+)?(\?.*)?$/, handler);
  await page.getByRole('button', { name: 'Salvar' }).first().click();
  for (let i = 0; i < 60 && cap.status === 0; i++) await page.waitForTimeout(250);
  await page.unroute(/\/api\/v1\/movements(\/[0-9a-f-]+)?(\?.*)?$/, handler);
  return cap;
}

// ===================== UT-795 (Contas a Pagar) =====================
export interface ExpCase {
  id: string; titleIdx?: number; provIdx?: number | null; amount: string; issue?: string; due?: string; pay?: 'Parcela Única' | 'Parcelada';
  type: 'Agricultura' | 'Pecuária' | 'Área' | 'Manutenção' | 'Indireta';
  // pecuária
  area?: string; grazing?: string; lot?: string; animalIdx?: number; op?: string | number; act?: number | string;
  // manutenção
  equip?: string; meter?: string; // dígitos digitados
  note?: string;
}
export async function openExpenseNew(page: Page) {
  await page.goto('/financeiro/pagar/novo');
  await page.locator('input[name=number]').waitFor({ timeout: 25000 });
  await page.waitForTimeout(2500);
}
export async function fillExpenseHeader(page: Page, c: ExpCase) {
  await page.locator('input[name=number]').fill(`QA102-${c.id}`);
  await pickAsync(page, 'type_title_uuid', c.titleIdx ?? 3);
  if (c.provIdx !== null) await pickAsync(page, 'provider_uuid', c.provIdx ?? 0);
  await pickAsync(page, 'proprietary_uuid', 0).catch(() => {});
  const dates = page.locator('input[placeholder="DD/MM/YYYY"]');
  const iso = (s: string) => { const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };
  await dates.nth(0).click(); await dates.nth(0).fill(iso(c.issue ?? '2026-10-14')); await dates.nth(0).press('Tab');
  await dates.nth(1).click(); await dates.nth(1).fill(iso(c.due ?? '2026-11-14')); await dates.nth(1).press('Tab');
  await typeMoney(page, 'amount', c.amount);
  await pickChakra(page, 'Forma de Pagamento', c.pay ?? 'Parcela Única');
  await page.locator('textarea[name=note]').fill(c.note ?? `QA102-${c.id}`);
  if (c.type === 'Indireta') { /* Modalidade padrão = Indireta */ }
  else { await pickChakra(page, 'Modalidade', 'Direta'); await pickChakra(page, 'Tipo', c.type); }
  await page.waitForTimeout(600);
}
export async function fillExpenseRateio(page: Page, cents: string) {
  await page.getByText('Rateio', { exact: true }).first().click();
  await page.waitForTimeout(800);
  await page.locator('[id="categories.0.category_uuid"]').click(); await page.waitForTimeout(900);
  await page.locator('div[role=option]:visible').first().click();
  await pickAsync(page, 'categories.0.center_uuid', 0);
  await typeMoney(page, 'categories.0.value', cents);
  await page.getByText('Cabeçalho', { exact: true }).first().click();
  await page.waitForTimeout(500);
}
export async function saveExpenseUI(page: Page) {
  let cap: { status: number; body: any; reqBody: any } = { status: 0, body: null, reqBody: null };
  const re = /\/api\/v1\/expenses(\/[0-9a-f-]+)?(\?.*)?$/;
  const handler = async (route: any) => {
    const req = route.request();
    if (!['POST', 'PUT'].includes(req.method())) return route.fallback();
    const r = await route.fetch();
    let body: any = null; try { body = await r.json(); } catch { /* */ }
    let reqBody: any = null; try { reqBody = req.postDataJSON(); } catch { /* */ }
    cap = { status: r.status(), body, reqBody };
    await route.fulfill({ response: r });
  };
  await page.route(re, handler);
  await page.getByRole('button', { name: 'Salvar' }).first().click();
  for (let i = 0; i < 60 && cap.status === 0; i++) await page.waitForTimeout(250);
  await page.unroute(re, handler);
  return cap;
}
export async function visibleErrors(page: Page) {
  return (await page.locator('[data-part=error-text], .chakra-field__errorText').allInnerTexts().catch(() => [])).map((s) => s.trim()).filter(Boolean);
}
