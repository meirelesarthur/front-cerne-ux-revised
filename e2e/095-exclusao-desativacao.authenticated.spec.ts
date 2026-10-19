import { test, expect, request, type Page, type APIRequestContext } from '@playwright/test';
import fs from 'node:fs';

// TASK-095-FE-08 — E2E autenticado da regra de exclusão (095). Exige a API local
// em http://localhost:8080 e o vite com VITE_API_PHP_BACK_URL apontando para ela.
const API = 'http://localhost:8080/api/v1';
const OUT = 'e2e-artifacts/095';
const THEME_KEY = 'aleex-ai.theme';
const TAG = 'E2E095';
// Nenhum uuid/nome de dado do banco fixo no arquivo: o teste 00 descobre/cria tudo pela API.
// Fixtures VINCULADAS criadas no teste 00 (adiantamento -> funcionário e evento; conta a pagar -> fornecedor;
// o funcionário usa a primeira função da API, que passa a ter vínculo -> R1b). Animal bloqueado: descoberto
// por pesagem existente (GET), nunca criado nem excluído com sucesso. Cliente/cultura vinculados (R1c/R1a) são opcionais
// via env (nome de um registro com vínculo no ambiente); sem elas, esses cenários são pulados.
const LINKED_CLIENT = process.env.E2E_095_LINKED_CLIENT ?? '';
// Idem para cultura vinculada (R1a), via E2E_095_LINKED_CULTIVATION.
const LINKED_CULTIVATION = process.env.E2E_095_LINKED_CULTIVATION ?? '';
const LINKED: { employee: { uuid: string; name: string }; provider: { uuid: string; name: string }; advance?: string; expense?: string } = {
  employee: { uuid: '', name: '' },
  provider: { uuid: '', name: '' },
};
// Descobertos no teste 00.
const disc: { event?: { uuid: string; name: string }; fn?: { uuid: string; name: string }; farm?: string; animal?: string } = {};

const results: Record<string, unknown> = {};
const net: any[] = [];
const consoleErrors: string[] = [];
const fx: { emp?: any; prov?: any } = {};
let ctx: APIRequestContext;

function cpf() {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 9));
  const d = (a: number[]) => { const s = a.reduce((t, v, i) => t + v * (a.length + 1 - i), 0) % 11; return s < 2 ? 0 : 11 - s; };
  const d1 = d(n); const d2 = d([...n, d1]); const a = [...n, d1, d2].join('');
  return `${a.slice(0, 3)}.${a.slice(3, 6)}.${a.slice(6, 9)}-${a.slice(9)}`;
}

function track(page: Page) {
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 160)));
  page.on('response', async (r) => {
    const m = r.request().method();
    if (m === 'GET' || !r.url().startsWith(API)) return;
    let body: any = null;
    try { body = await r.json(); } catch { /* 204 */ }
    net.push({ m, url: r.url().replace(API, ''), status: r.status(), message: body?.message ?? null, blocked: body?.errors?.blocked_uuids ? `${body.errors.blocked_uuids.length} uuids` : null });
  });
}

async function open(page: Page, route: string, opts: { theme?: 'light' | 'dark'; farm?: string } = {}) {
  await page.addInitScript(([k, t, f]) => {
    if (!sessionStorage.getItem('e2e095-init')) {
      localStorage.setItem(k as string, t as string);
      if (f) localStorage.setItem('app-active-farm', f as string);
      sessionStorage.setItem('e2e095-init', '1');
    }
  }, [THEME_KEY, opts.theme ?? 'light', opts.farm ?? null]);
  await page.goto(route);
  await expect(page).not.toHaveURL(/\/login/);
  await page.waitForTimeout(4500);
}

async function authCtx(page: Page) {
  let hdr: Record<string, string> = {};
  const h = (r: any) => { const x = r.headers(); if (x['authorization'] && r.url().startsWith(API)) hdr = { Authorization: x['authorization'], 'X-Farm-Id': x['x-farm-id'] ?? '' }; };
  page.on('request', h);
  await open(page, '/cadastros-base/funcionarios');
  page.off('request', h);
  expect(Object.keys(hdr).length).toBeGreaterThan(0);
  ctx = await request.newContext({ baseURL: API + '/', extraHTTPHeaders: { ...hdr, Accept: 'application/json' } });
}

async function filter(page: Page, name: string, status: 'Ativo' | 'Inativo' | 'Todos') {
  await page.getByRole('button', { name: /^filtros/i }).first().click();
  const dlg = page.getByRole('dialog');
  await expect(dlg).toBeVisible();
  await page.waitForTimeout(600);
  await dlg.getByPlaceholder(/^Buscar por nome/).fill(name);
  const clear = dlg.getByRole('button', { name: 'Clear value' });
  if (await clear.count()) { await clear.first().click(); await page.waitForTimeout(300); }
  if (status !== 'Todos') {
    await dlg.getByRole('combobox').last().click();
    await page.getByRole('option', { name: status, exact: true }).click();
  }
  await dlg.getByRole('button', { name: /aplicar filtro/i }).click();
  await page.waitForTimeout(2500);
}

const row = (page: Page, name: string) => page.locator('tbody tr', { hasText: name });

async function rowAction(page: Page, name: string, item: string) {
  const r = row(page, name);
  await expect(r).toHaveCount(1, { timeout: 15000 });
  const act = r.getByRole('button', { name: 'Actions' });
  if (await act.count()) await act.click(); else await r.getByRole('button').last().click();
  await page.getByRole('menuitem', { name: item, exact: true }).click();
}

async function confirm(page: Page, label: string) {
  const dlg = page.getByRole('dialog');
  await expect(dlg).toBeVisible();
  const btn = dlg.getByRole('button', { name: label, exact: true });
  await btn.click();
  return dlg;
}

async function menuItems(page: Page, name: string) {
  const r = row(page, name);
  await r.getByRole('button', { name: 'Actions' }).click();
  const items = await page.getByRole('menuitem').allInnerTexts();
  await page.keyboard.press('Escape');
  return items.map((t) => t.trim());
}

async function toastText(page: Page) {
  return (await page.locator('[data-scope="toast"], [role="status"], [role="alert"]').allInnerTexts()).join(' | ').replace(/\s+/g, ' ').slice(0, 300);
}

async function create(kind: 'employees' | 'providers', label: string) {
  const j = async (r: any) => r.json().catch(() => null);
  const city = (await j(await ctx.get('cities?per_page=1&search=a'))).data[0].uuid;
  const fn = (await j(await ctx.get('functions?per_page=1'))).data[0].uuid;
  const base = { nif: cpf(), name: `${TAG} ${label}`, nickname: `${TAG} ${label}`, address: 'Rua Teste', number: '1', district: 'Centro', city_uuid: city };
  const data = kind === 'employees' ? { ...base, employee: { function_uuid: fn, base_salary: 1500, birthday: '1990-01-01' } } : { ...base, provider: { type: 1 } };
  const r = await ctx.post(kind, { data });
  expect(r.status()).toBe(201);
  return (await j(r)).data;
}

test.describe.configure({ mode: 'serial' });

test.afterAll(async () => {
  const cleanup: Record<string, number> = {};
  if (ctx) {
    if (LINKED.advance) cleanup.advance = (await ctx.delete(`advances/${LINKED.advance}`)).status();
    if (LINKED.expense) cleanup.expense = (await ctx.delete(`expenses/${LINKED.expense}`)).status();
    if (LINKED.employee.uuid) cleanup.employee = (await ctx.delete(`employees/${LINKED.employee.uuid}`)).status();
    if (LINKED.provider.uuid) cleanup.provider = (await ctx.delete(`providers/${LINKED.provider.uuid}`)).status();
  }
  results.cleanup = cleanup;
  fs.writeFileSync(`${OUT}/e2e-results.json`, JSON.stringify({ results, consoleErrors, net }, null, 1));
});

test('00 fixtures', async ({ page }) => {
  test.setTimeout(90_000);
  await authCtx(page);
  const t = Date.now() % 100000;
  fx.emp = await create('employees', `Func B ${t}`);
  fx.prov = await create('providers', `Forn B ${t}`);
  const ea = await create('employees', `Func A ${t}`);
  const pa = await create('providers', `Forn A ${t}`);
  LINKED.employee = { uuid: ea.uuid, name: ea.name };
  LINKED.provider = { uuid: pa.uuid, name: pa.name };
  const j = async (r: any) => r.json().catch(() => null);
  const ev = (await j(await ctx.get('events?per_page=1'))).data?.[0];
  expect(ev, 'precisa existir ao menos 1 evento na API').toBeTruthy();
  disc.event = { uuid: ev.uuid, name: ev.name ?? ev.description };
  const fnItem = (await j(await ctx.get('functions?per_page=1'))).data[0];
  disc.fn = { uuid: fnItem.uuid, name: fnItem.name ?? fnItem.description };
  // Animal bloqueado: percorre as fazendas do usuário e pega um animal de uma pesagem existente.
  const farms = (await j(await ctx.get('me/farms'))).data ?? [];
  for (const f of farms) {
    const h = { 'X-Farm-Id': f.uuid };
    const w = (await j(await ctx.get('weighings?per_page=1', { headers: h })))?.data?.[0];
    if (!w) continue;
    const det = (await j(await ctx.get(`weighings/${w.uuid}`, { headers: h })))?.data;
    const ident = det?.animals?.[0]?.animal?.identification;
    if (ident) { disc.farm = f.uuid; disc.animal = String(ident); break; }
  }
  let r = await ctx.post('advances', { data: { employee_uuid: ea.uuid, event_uuid: disc.event.uuid, date: '2026-10-01', amount: 100, installments: [{ month: '2026-11', value: 100 }] } });
  expect(r.status()).toBe(201);
  LINKED.advance = (await j(r)).data.uuid;
  const tt = (await j(await ctx.get('type-titles/options'))).data.find((x: any) => x.type === 1).uuid;
  const cat = (await j(await ctx.get('financial-categories/options'))).data[0].uuid;
  const cc = (await j(await ctx.get('cost-centers/options'))).data.find((c: any) => !c.is_root).uuid;
  r = await ctx.post('expenses', { data: { number: String(Date.now()).slice(-8), type_title_uuid: tt, provider_uuid: pa.uuid, dt_emission: '2026-10-01', due_date: '2026-11-01', amount: 100, note: TAG, fiscal_document: false, is_taxation: false, payment_type: 1, classification: 'N', categories: [{ category_uuid: cat, center_uuid: cc, value: 100 }] } });
  expect(r.status()).toBe(201);
  LINKED.expense = (await j(r)).data.uuid;
  results.fixtures = { emp: fx.emp.name, prov: fx.prov.name };
});

for (const kind of ['employee', 'provider'] as const) {
  const isEmp = kind === 'employee';
  const P = isEmp ? 'F' : 'P';
  const route = isEmp ? '/cadastros-base/funcionarios' : '/cadastros-base/fornecedores';
  const word = isEmp ? 'Funcionário' : 'Fornecedor';
  const getFx = () => (isEmp ? fx.emp : fx.prov);

  test(`${P}1 ${word}: desativar -> some do padrão, aparece em Inativo (PATCH, nunca DELETE)`, async ({ page }) => {
    test.setTimeout(120_000);
    track(page);
    await open(page, route);
    const name = getFx().name as string;
    await filter(page, name, 'Ativo');
    results[`${P}1_menu_ativo`] = await menuItems(page, name);
    await page.screenshot({ path: `${OUT}/${P}1-lista-ativo.png` });
    const before = net.length;
    await rowAction(page, name, 'Desativar');
    await page.screenshot({ path: `${OUT}/${P}1-dialogo-desativar-light.png` });
    await confirm(page, 'Desativar');
    await page.waitForTimeout(2500);
    results[`${P}1_toast`] = await toastText(page);
    const calls = net.slice(before).map((n) => `${n.m} ${n.url} ${n.status}`);
    results[`${P}1_calls`] = calls;
    expect(calls.some((c) => c.startsWith('DELETE'))).toBe(false);
    expect(calls.some((c) => new RegExp(`^PATCH /${isEmp ? 'employees' : 'providers'}/[0-9a-f-]+/deactivate 200`).test(c))).toBe(true);
    await expect(row(page, name)).toHaveCount(0);
    await filter(page, name, 'Inativo');
    await expect(row(page, name)).toHaveCount(1);
    results[`${P}1_menu_inativo`] = await menuItems(page, name);
    await page.screenshot({ path: `${OUT}/${P}1-lista-inativo.png` });
  });

  test(`${P}2 ${word}: ativar inativo -> volta`, async ({ page }) => {
    test.setTimeout(120_000);
    track(page);
    await open(page, route);
    const name = getFx().name as string;
    await filter(page, name, 'Inativo');
    const before = net.length;
    await rowAction(page, name, 'Ativar');
    await page.screenshot({ path: `${OUT}/${P}2-dialogo-ativar-light.png` });
    await confirm(page, 'Ativar');
    await page.waitForTimeout(2500);
    results[`${P}2_toast`] = await toastText(page);
    const calls = net.slice(before).map((n) => `${n.m} ${n.url} ${n.status}`);
    results[`${P}2_calls`] = calls;
    expect(calls.some((c) => new RegExp(`^PATCH /${isEmp ? 'employees' : 'providers'}/[0-9a-f-]+/activate 20[04]`).test(c))).toBe(true);
    await filter(page, name, 'Ativo');
    await expect(row(page, name)).toHaveCount(1);
  });

  test(`${P}3 ${word} sem vínculo: excluir -> 204 e some de Todos`, async ({ page }) => {
    test.setTimeout(120_000);
    track(page);
    await open(page, route);
    const name = getFx().name as string;
    await filter(page, name, 'Todos');
    const before = net.length;
    await rowAction(page, name, 'Excluir');
    await page.screenshot({ path: `${OUT}/${P}3-dialogo-excluir-light.png` });
    await confirm(page, 'Excluir');
    await page.waitForTimeout(2500);
    results[`${P}3_toast`] = await toastText(page);
    const calls = net.slice(before).map((n) => `${n.m} ${n.url} ${n.status}`);
    results[`${P}3_calls`] = calls;
    expect(calls.some((c) => new RegExp(`^DELETE /${isEmp ? 'employees' : 'providers'}/[0-9a-f-]+ 204`).test(c))).toBe(true);
    await filter(page, name, 'Todos');
    await expect(row(page, name)).toHaveCount(0);
    await page.screenshot({ path: `${OUT}/${P}3-pos-exclusao.png` });
    getFx().deleted = true;
  });

  test(`${P}4 ${word} com vínculo: excluir -> 422 genérico, item permanece`, async ({ page }) => {
    test.setTimeout(120_000);
    track(page);
    await open(page, route);
    const linked = isEmp ? LINKED.employee : LINKED.provider;
    await filter(page, linked.name, 'Ativo');
    const before = net.length;
    await rowAction(page, linked.name, 'Excluir');
    await confirm(page, 'Excluir');
    await page.waitForTimeout(2500);
    results[`${P}4_toast`] = await toastText(page);
    await page.screenshot({ path: `${OUT}/${P}4-toast-422.png` });
    const calls = net.slice(before);
    results[`${P}4_calls`] = calls.map((n) => `${n.m} ${n.url} ${n.status} "${n.message}"`);
    const del = calls.find((n) => n.m === 'DELETE');
    expect(del?.status).toBe(422);
    expect(results[`${P}4_toast`] as string).toContain('Não foi possível excluir');
    expect(results[`${P}4_toast`] as string).not.toMatch(/422 —/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(row(page, linked.name)).toHaveCount(1);
  });
}

test('P5 Fornecedor: desativar e ativar pelo formulário de edição', async ({ page }) => {
  test.setTimeout(180_000);
  track(page);
  const prov = await create('providers', `Forn C ${Date.now() % 100000}`);
  await open(page, '/cadastros-base/fornecedores');
  await filter(page, prov.name, 'Ativo');
  await rowAction(page, prov.name, 'Editar');
  await expect(page).toHaveURL(new RegExp(`/fornecedores/${prov.uuid}`));
  await page.waitForTimeout(3500);
  results.P5_botoes_ativo = await page.getByRole('button').allInnerTexts().then((a) => a.map((t) => t.trim()).filter((t) => /^(ativar|desativar|excluir)$/i.test(t)));
  await page.screenshot({ path: `${OUT}/P5-form-ativo.png` });
  const before = net.length;
  await page.getByRole('button', { name: 'Desativar', exact: true }).click();
  await page.screenshot({ path: `${OUT}/P5-dialogo-desativar-form-light.png` });
  await confirm(page, 'Desativar');
  await page.waitForTimeout(3000);
  results.P5_toast1 = await toastText(page);
  results.P5_url_apos_desativar = page.url().replace(/^https?:\/\/[^/]+/, '');
  // volta para a listagem (navigate(-1)); reabre o formulário do inativo
  await filter(page, prov.name, 'Inativo');
  await rowAction(page, prov.name, 'Editar');
  await page.waitForTimeout(3500);
  results.P5_botoes_inativo = await page.getByRole('button').allInnerTexts().then((a) => a.map((t) => t.trim()).filter((t) => /^(ativar|desativar|excluir)$/i.test(t)));
  await page.screenshot({ path: `${OUT}/P5-form-inativo.png` });
  await page.getByRole('button', { name: 'Ativar', exact: true }).click();
  await page.screenshot({ path: `${OUT}/P5-dialogo-ativar-form-light.png` });
  await confirm(page, 'Ativar');
  await page.waitForTimeout(3000);
  results.P5_toast2 = await toastText(page);
  const calls = net.slice(before).map((n) => `${n.m} ${n.url} ${n.status}`);
  results.P5_calls = calls;
  expect(calls.some((c) => /^PATCH \/providers\/[0-9a-f-]+\/deactivate 200/.test(c))).toBe(true);
  expect(calls.some((c) => /^PATCH \/providers\/[0-9a-f-]+\/activate 200/.test(c))).toBe(true);
  expect(calls.some((c) => c.startsWith('DELETE'))).toBe(false);
  results.P5_cleanup = (await ctx.delete(`providers/${prov.uuid}`)).status();
});

test('LD light/dark dos diálogos novos (Excluir funcionário, Ativar fornecedor)', async ({ page }) => {
  test.setTimeout(150_000);
  track(page);
  const emp = await create('employees', `Func D ${Date.now() % 100000}`);
  const prov = await create('providers', `Forn D ${Date.now() % 100000}`);
  await ctx.patch(`providers/${prov.uuid}/deactivate`);
  for (const theme of ['dark', 'light'] as const) {
    await page.addInitScript(([k, t]) => localStorage.setItem(k as string, t as string), [THEME_KEY, theme]);
    await page.goto('/cadastros-base/funcionarios'); await page.waitForTimeout(4500);
    await filter(page, emp.name, 'Todos');
    await rowAction(page, emp.name, 'Excluir');
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/LD-excluir-funcionario-${theme}.png` });
    await page.getByRole('dialog').getByRole('button', { name: /cancelar/i }).click();
    await page.goto('/cadastros-base/fornecedores'); await page.waitForTimeout(4500);
    await filter(page, prov.name, 'Inativo');
    await rowAction(page, prov.name, 'Ativar');
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/LD-ativar-fornecedor-${theme}.png` });
    await page.getByRole('dialog').getByRole('button', { name: /cancelar/i }).click();
  }
  results.LD_cleanup = [(await ctx.delete(`employees/${emp.uuid}`)).status(), (await ctx.delete(`providers/${prov.uuid}`)).status()];
});

// Abre o Rebanho da fazenda descoberta, pesquisa o animal bloqueado e marca a linha dele.
async function selectBlockedAnimal(page: Page, theme: 'light' | 'dark' = 'light') {
  test.skip(!disc.farm || !disc.animal, 'nenhuma fazenda com pesagem (animal vinculado) encontrada na API');
  await open(page, '/cadastros-base/rebanho', { farm: disc.farm, theme });
  // identificação composta ("559RGN - Z3268"): a busca usa o 1o token; o campo fica dentro do painel Filtros
  const token = disc.animal!.split(' - ')[0];
  await page.getByRole('button', { name: /filtro/i }).first().click({ timeout: 8000 });
  await page.getByPlaceholder('Pesquisar Id Animal').first().fill(token);
  await page.getByRole('button', { name: /aplicar filtro/i }).click();
  await page.waitForTimeout(2500);
  const r = page.locator('tbody tr', { hasText: token }).first();
  await expect(r).toBeVisible({ timeout: 20000 });
  await r.locator('[data-part="control"]').first().click();
}

test('A1 Rebanho: exclusão em massa com bloqueados -> lista de identificações, sem uuid no toast', async ({ page }) => {
  test.setTimeout(150_000);
  track(page);
  await selectBlockedAnimal(page);
  await page.screenshot({ path: `${OUT}/A1-selecao.png` });
  await page.getByRole('button', { name: /apagar animais/i }).first().click();
  const dlg = page.getByRole('dialog');
  await expect(dlg).toBeVisible();
  results.A1_aviso = (await dlg.innerText()).replace(/\s+/g, ' ').slice(0, 400);
  await page.screenshot({ path: `${OUT}/A1-dialogo-aviso-light.png` });
  await dlg.getByRole('textbox').fill('APAGAR');
  const before = net.length;
  await dlg.getByRole('button', { name: 'Apagar', exact: true }).click();
  await page.waitForTimeout(3500);
  const calls = net.slice(before);
  results.A1_calls = calls.map((n) => `${n.m} ${n.url} ${n.status} ${n.blocked ?? ''} "${n.message}"`);
  results.A1_toast = await toastText(page);
  results.A1_dialogo_apos = (await page.getByRole('dialog').innerText({ timeout: 2500 }).catch(() => '(fechado)')).replace(/\s+/g, ' ').slice(0, 700);
  await page.screenshot({ path: `${OUT}/A1-bloqueados-light.png` });
  const del = calls.find((n) => n.m === 'DELETE');
  expect(del?.status).toBe(422);
  expect(results.A1_toast as string).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
  await expect(page.getByRole('dialog')).toContainText('vínculos ativos');
  // achado C: barra de seleção não pode cobrir o rótulo do botão (1280x720)
  // viewport maior para checar sobreposição da barra de seleção x botão "Desmarcar bloqueados"
  const deselect = page.getByRole('dialog').getByRole('button', { name: 'Desmarcar bloqueados' });
  const box = await deselect.boundingBox();
  const bar = await page.getByText(/animais? selecionados?/i).first().boundingBox({ timeout: 3000 }).catch(() => null);
  results.A1_overlap = { deselect: box, bar };
  // o botão pode sumir (diálogo fecha); avalia no documento, sem esperar o locator
  const topmostIsButton = await page.evaluate(() => {
    const el = [...document.querySelectorAll('button')].find((b) => /Desmarcar bloqueados/.test(b.textContent || ''));
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!top && el.contains(top);
  });
  expect(topmostIsButton).toBe(true);
  let clickable = true;
  try { await deselect.click({ timeout: 4000 }); } catch { clickable = false; }
  results.A1_desmarcar_clicavel = clickable;
  await page.waitForTimeout(1500);
  results.A1_apos_desmarcar = {
    dialogoAberto: await page.getByRole('dialog').count(),
    barraSelecionados: await page.getByText(/animais selecionados|animal selecionado/i).count(),
  };
  await page.screenshot({ path: `${OUT}/A1-apos-desmarcar.png` });
  // achado B: com 0 selecionados após desmarcar os bloqueados, o diálogo fecha e nada é enviado
  expect((results.A1_apos_desmarcar as any).dialogoAberto).toBe(0);
  expect(net.slice(before).filter((n) => n.m === 'DELETE').length).toBe(1);
  await page.screenshot({ path: `${OUT}/A1-apagar-zero.png` });
});

test('A1-dark exclusão em massa: diálogo com bloqueados no tema escuro', async ({ page }) => {
  test.setTimeout(150_000);
  track(page);
  await selectBlockedAnimal(page, 'dark');
  await page.getByRole('button', { name: /apagar animais/i }).first().click();
  const dlg = page.getByRole('dialog');
  await dlg.getByRole('textbox').fill('APAGAR');
  await dlg.getByRole('button', { name: 'Apagar', exact: true }).click();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${OUT}/A1-bloqueados-dark.png` });
  results.A1dark_dialogo = (await page.getByRole('dialog').innerText({ timeout: 2500 }).catch(() => '(fechado)')).replace(/\s+/g, ' ').slice(0, 400);
});

// ── R1 / regressão das telas de vínculo ───────────────────────────────────
async function genericSearch(page: Page, text: string) {
  await page.getByRole('button', { name: /^filtros/i }).first().click();
  const dlg = page.getByRole('dialog');
  await expect(dlg).toBeVisible();
  await page.waitForTimeout(600);
  await dlg.getByRole('textbox').first().fill(text);
  await dlg.getByRole('button', { name: /aplicar filtro/i }).click();
  await page.waitForTimeout(2500);
}

// Alvos descobertos no teste 00 (função e evento vinculados pelas fixtures) ou informados por env (cliente).
const r1Targets = () => [
  { id: 'R1a-cultura', route: '/cadastros-base/cultura', search: LINKED_CULTIVATION, rowText: LINKED_CULTIVATION, kind: 'toast' },
  { id: 'R1b-funcoes', route: '/administrativo/funcoes', search: disc.fn?.name ?? '', rowText: disc.fn?.name ?? '', kind: 'toast' },
  { id: 'R1c-clientes', route: '/cadastros-base/clientes', search: LINKED_CLIENT, rowText: LINKED_CLIENT, kind: 'dialog' },
  { id: 'R1d-eventos', route: '/administrativo/eventos', search: disc.event?.name ?? '', rowText: disc.event?.name ?? '', kind: 'dialog' },
] as const;

for (const idx of [0, 1, 2, 3]) {
  const label = ['R1a-cultura', 'R1b-funcoes', 'R1c-clientes', 'R1d-eventos'][idx];
  test(`${label}: excluir com vínculo (toast da message / diálogo de vínculos mantido)`, async ({ page }) => {
    test.setTimeout(120_000);
    const c = r1Targets()[idx];
    test.skip(!c.search, 'alvo vinculado indisponível (defina E2E_095_LINKED_CLIENT / E2E_095_LINKED_CULTIVATION)');
    track(page);
    await open(page, c.route);
    await genericSearch(page, c.search);
    const before = net.length;
    await rowAction(page, c.rowText, 'Excluir');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${c.id}-confirmar.png` });
    await confirm(page, 'Excluir');
    await page.waitForTimeout(3000);
    const calls = net.slice(before);
    results[`${c.id}_calls`] = calls.map((n) => `${n.m} ${n.url} ${n.status} "${n.message}"`);
    results[`${c.id}_toast`] = await toastText(page);
    results[`${c.id}_dialog`] = (await page.getByRole('dialog').innerText({ timeout: 2500 }).catch(() => '(sem diálogo)')).replace(/\s+/g, ' ').slice(0, 500);
    await page.screenshot({ path: `${OUT}/${c.id}-resultado.png` });
    const del = calls.find((n) => n.m === 'DELETE');
    expect(del?.status).toBe(422);
    if (c.kind === 'toast') {
      expect(results[`${c.id}_toast`] as string).toContain('Não foi possível excluir');
      expect(results[`${c.id}_toast`] as string).not.toMatch(/422 —/);
    }
  });
}
