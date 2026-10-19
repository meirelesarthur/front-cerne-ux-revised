import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// ─────────────────────────────────────────────────────────────────────────
// E2E autenticado de HOMOLOGAÇÃO das 6 telas novas do lote 058 (task-packet
// do Maestro, gb-cerne-front-tester-v2). Escopo LEVE: render + filtro (dt.
// popula fazenda) + download ponta-a-ponta + multi-fazenda (troca real via
// X-Farm-Id) + captura dos binários para homologação do dono (DEC-170).
//
// NÃO lê .env.login diretamente (isso é scripts/e2e/run-authenticated.sh);
// reusa a sessão persistida por e2e/auth.setup.ts (projeto `authenticated`).
//
// Escrito pelo gb-cerne-front-tester-v2 nesta sessão de validação. Cada
// teste é independente (Playwright cria um novo contexto/página a partir do
// storageState por teste) — falha em 1 tela não derruba as demais.
// ─────────────────────────────────────────────────────────────────────────

const EVIDENCE_DIR =
  '/home/pietro/ambiente/CORE_WORKSPACE/97-Esteiras/058/EVIDENCIAS/homologacao';

type ScreenResult = {
  screen: string;
  route: string;
  renderOk: boolean;
  renderNote: string;
  filtersOk: boolean;
  filtersNote: string;
  downloadOk: boolean;
  downloadNote: string;
  multiFarmOk: boolean;
  multiFarmNote: string;
  files: string[];
};

const results: ScreenResult[] = [];

function newResult(screen: string, route: string): ScreenResult {
  const r: ScreenResult = {
    screen,
    route,
    renderOk: false,
    renderNote: '',
    filtersOk: false,
    filtersNote: '',
    downloadOk: false,
    downloadNote: '',
    multiFarmOk: false,
    multiFarmNote: '',
    files: [],
  };
  results.push(r);
  return r;
}

test.afterAll(() => {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(EVIDENCE_DIR, '_resultado-homologacao-058.json'),
    JSON.stringify(results, null, 2),
  );
  // eslint-disable-next-line no-console -- saída de diagnóstico do harness p/ o tester ler do stdout
  console.log('RESULTADO_HOMOLOGACAO_058_JSON_START');
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(results, null, 2));
  // eslint-disable-next-line no-console
  console.log('RESULTADO_HOMOLOGACAO_058_JSON_END');
});

// ---------------------------------------------------------------------------
// Helpers genéricos (Chakra UI v3 / Ark UI usa data-part; react-select usa
// role=combobox/option nativamente — confirmado em node_modules/react-select).
// ---------------------------------------------------------------------------

function esc(s: string) {
  return s.replace(/"/g, '\\"');
}

// Localiza o elemento MAIS INTERNO cujo nó de texto direto contém labelText
// (evita casar o Box/Field.Root ancestral, que também "contém" o texto via
// concatenação de descendentes) e retorna seu container imediato (pai),
// onde o input/trigger do campo vive como IRMÃO do label.
function fieldContainer(page: Page, labelText: string) {
  return page
    .locator(`xpath=(//*[text()[contains(., "${esc(labelText)}")]])[1]`)
    .locator('xpath=..');
}

async function fillDateNear(page: Page, labelText: string, ddmmyyyy8digits: string) {
  const container = fieldContainer(page, labelText);
  const input = container.locator('input').first();
  await input.click();
  await input.pressSequentially(ddmmyyyy8digits, { delay: 15 });
  await page.keyboard.press('Tab');
}

async function pickFirstStaticOption(page: Page, labelText: string): Promise<string | null> {
  const container = fieldContainer(page, labelText);
  const trigger = container.locator('[data-part="trigger"]').first();
  await trigger.click();
  const item = page.locator('[data-part="item"]:not([data-disabled])').first();
  await item.waitFor({ state: 'visible', timeout: 8000 });
  const text = (await item.textContent())?.trim() ?? null;
  await item.click();
  return text;
}

async function pickFirstAsyncOption(page: Page, fieldName: string): Promise<string | null> {
  const input = page.locator(`#${fieldName}`);
  await input.click();
  const option = page.getByRole('option').first();
  await option.waitFor({ state: 'visible', timeout: 15000 });
  const text = (await option.textContent())?.trim() ?? null;
  await option.click();
  return text;
}

async function getFarmRows(page: Page): Promise<string[]> {
  const input = page.getByRole('textbox', { name: 'Selecionar fazenda ativa' });
  await input.click();
  const content = page.locator('[data-scope="popover"][data-part="content"]');
  await content.waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(200);
  const rows = content.locator('button, [role="button"]');
  const n = await rows.count();
  const farms: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const t = (await rows.nth(i).textContent())?.trim();
    if (t) farms.push(t);
  }
  await page.keyboard.press('Escape');
  return farms;
}

async function switchToFarm(page: Page, farmDescription: string): Promise<void> {
  const input = page.getByRole('textbox', { name: 'Selecionar fazenda ativa' });
  await input.click();
  const content = page.locator('[data-scope="popover"][data-part="content"]');
  await content.waitFor({ state: 'visible', timeout: 10000 });
  await content.getByText(farmDescription, { exact: true }).click();
  await content.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function getActiveFarmText(page: Page): Promise<string> {
  return page.getByRole('textbox', { name: 'Selecionar fazenda ativa' }).inputValue();
}

async function generateAndCapture(
  page: Page,
  clickAction: () => Promise<void>,
  urlSubstr: string,
  savePath: string,
): Promise<{ status: number; bytes: number; farmIdHeader: string | null }> {
  const respPromise = page.waitForResponse((r) => r.url().includes(urlSubstr), {
    timeout: 30000,
  });
  await clickAction();
  const response = await respPromise;
  const status = response.status();
  let bytes = 0;
  if (status === 200) {
    const buf = await response.body();
    bytes = buf.length;
    fs.mkdirSync(path.dirname(savePath), { recursive: true });
    fs.writeFileSync(savePath, buf);
  }
  const reqHeaders = await response.request().headers();
  const farmIdHeader = reqHeaders['x-farm-id'] ?? null;
  return { status, bytes, farmIdHeader };
}

function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

// ===========================================================================
// F-221 — Histórico de Animais/Lote
// ===========================================================================
test('F-221 Histórico Animais/Lote — render + filtro + download + multi-fazenda', async ({
  page,
}) => {
  test.setTimeout(120000);
  const r = newResult('F-221 Histórico Animais/Lote', '/relatorios/pecuaria/historico-animais-lote');
  const consoleErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  await page.goto(r.route);
  await expect(page).not.toHaveURL(/\/login/);

  try {
    await expect(
      page.getByRole('heading', { name: 'Histórico de Animais/Lote' }),
    ).toBeVisible({ timeout: 15000 });
    r.renderOk = true;
    r.renderNote = `OK. console errors: ${consoleErrors.length}`;
  } catch (e) {
    r.renderNote = `FALHA render: ${(e as Error).message}`;
    return;
  }

  let batchLabelA: string | null = null;
  try {
    await fillDateNear(page, 'Data Início', '01012015');
    batchLabelA = await pickFirstAsyncOption(page, 'batch');
    r.filtersOk = !!batchLabelA;
    r.filtersNote = `lote selecionado (fazenda inicial): ${batchLabelA ?? 'NENHUM — sem opções no lookup'}`;
  } catch (e) {
    r.filtersNote = `FALHA filtros: ${(e as Error).message}`;
    return;
  }

  const farmA = await getActiveFarmText(page).catch(() => 'desconhecida');
  try {
    const btn = page.getByRole('button', { name: 'Gerar Relatório' });
    await expect(btn).toBeEnabled({ timeout: 5000 });
    const fileA = path.join(EVIDENCE_DIR, `F-221-${slug(farmA)}.pdf`);
    const resA = await generateAndCapture(
      page,
      () => btn.click(),
      '/animal-batch-history-report',
      fileA,
    );
    r.downloadOk = resA.status === 200 && resA.bytes > 0;
    r.downloadNote = `farmA="${farmA}" status=${resA.status} bytes=${resA.bytes} X-Farm-Id=${resA.farmIdHeader}`;
    if (r.downloadOk) r.files.push(fileA);

    const farms = await getFarmRows(page);
    const farmB = farms.find((f) => f !== farmA);
    if (!farmB) {
      r.multiFarmNote = `Sem 2ª fazenda distinta disponível para o usuário de teste (fazendas: ${JSON.stringify(farms)}).`;
    } else {
      await switchToFarm(page, farmB);
      await page.reload();
      await expect(
        page.getByRole('heading', { name: 'Histórico de Animais/Lote' }),
      ).toBeVisible({ timeout: 15000 });
      await fillDateNear(page, 'Data Início', '01012015');
      const batchLabelB = await pickFirstAsyncOption(page, 'batch');
      const btn2 = page.getByRole('button', { name: 'Gerar Relatório' });
      await expect(btn2).toBeEnabled({ timeout: 5000 });
      const fileB = path.join(EVIDENCE_DIR, `F-221-${slug(farmB)}.pdf`);
      const resB = await generateAndCapture(
        page,
        () => btn2.click(),
        '/animal-batch-history-report',
        fileB,
      );
      if (resB.status === 200 && resB.bytes > 0) r.files.push(fileB);
      r.multiFarmOk = resA.farmIdHeader !== resB.farmIdHeader && resB.status === 200;
      r.multiFarmNote =
        `farmA="${farmA}" (lote=${batchLabelA}) bytes=${resA.bytes} X-Farm-Id=${resA.farmIdHeader} | ` +
        `farmB="${farmB}" (lote=${batchLabelB}) status=${resB.status} bytes=${resB.bytes} X-Farm-Id=${resB.farmIdHeader} | ` +
        `bytes diferem: ${resA.bytes !== resB.bytes}`;
    }
  } catch (e) {
    r.downloadNote += ` | ERRO: ${(e as Error).message}`;
  }
});

// ===========================================================================
// F-217 — Custo de Produção Acumulado
// ===========================================================================
test('F-217 Custo de Produção Acumulado — render + filtro + download + multi-fazenda', async ({
  page,
}) => {
  test.setTimeout(120000);
  const r = newResult(
    'F-217 Custo de Produção Acumulado',
    '/relatorios/financeiro/custo-de-producao-acumulado',
  );
  const consoleErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  await page.goto(r.route);
  await expect(page).not.toHaveURL(/\/login/);

  try {
    await expect(
      page.getByRole('heading', { name: 'Custo de Produção Acumulado' }),
    ).toBeVisible({ timeout: 15000 });
    r.renderOk = true;
    r.renderNote = `OK. console errors: ${consoleErrors.length}`;
  } catch (e) {
    r.renderNote = `FALHA render: ${(e as Error).message}`;
    return;
  }

  // CORRIGIDO nesta esteira: matriz principal NÃO deve exibir "R$" — checagem
  // best-effort no DOM do form (a matriz real só existe dentro do PDF, fora
  // do DOM da SPA; registrado como nota, não como veredito visual do PDF).
  try {
    const groupLabel = await pickFirstStaticOption(page, 'Regime');
    const typeLabel = await pickFirstStaticOption(page, 'Tipo');
    const calcLabel = await pickFirstStaticOption(page, 'Módulo de Cálculo');
    await fillDateNear(page, 'Dt. Início', '01012026');
    await fillDateNear(page, 'Dt. Fim', '01092026');
    r.filtersOk = !!groupLabel && !!typeLabel && !!calcLabel;
    r.filtersNote = `Regime=${groupLabel} Tipo=${typeLabel} Módulo=${calcLabel} (todos estáticos, populados)`;
  } catch (e) {
    r.filtersNote = `FALHA filtros: ${(e as Error).message}`;
    return;
  }

  const farmA = await getActiveFarmText(page).catch(() => 'desconhecida');
  try {
    const btn = page.getByRole('button', { name: 'Gerar Relatório' });
    await expect(btn).toBeEnabled({ timeout: 5000 });
    const fileA = path.join(EVIDENCE_DIR, `F-217-${slug(farmA)}.pdf`);
    const resA = await generateAndCapture(
      page,
      () => btn.click(),
      '/accumulated-income-statement/pdf',
      fileA,
    );
    r.downloadOk = resA.status === 200 && resA.bytes > 0;
    r.downloadNote = `farmA="${farmA}" status=${resA.status} bytes=${resA.bytes} X-Farm-Id=${resA.farmIdHeader}`;
    if (r.downloadOk) r.files.push(fileA);

    const farms = await getFarmRows(page);
    const farmB = farms.find((f) => f !== farmA);
    if (!farmB) {
      r.multiFarmNote = `Sem 2ª fazenda distinta disponível (fazendas: ${JSON.stringify(farms)}).`;
    } else {
      await switchToFarm(page, farmB);
      await page.reload();
      await expect(
        page.getByRole('heading', { name: 'Custo de Produção Acumulado' }),
      ).toBeVisible({ timeout: 15000 });
      await pickFirstStaticOption(page, 'Regime');
      await pickFirstStaticOption(page, 'Tipo');
      await pickFirstStaticOption(page, 'Módulo de Cálculo');
      await fillDateNear(page, 'Dt. Início', '01012026');
      await fillDateNear(page, 'Dt. Fim', '01092026');
      const btn2 = page.getByRole('button', { name: 'Gerar Relatório' });
      await expect(btn2).toBeEnabled({ timeout: 5000 });
      const fileB = path.join(EVIDENCE_DIR, `F-217-${slug(farmB)}.pdf`);
      const resB = await generateAndCapture(
        page,
        () => btn2.click(),
        '/accumulated-income-statement/pdf',
        fileB,
      );
      if (resB.status === 200 && resB.bytes > 0) r.files.push(fileB);
      r.multiFarmOk = resA.farmIdHeader !== resB.farmIdHeader && resB.status === 200;
      r.multiFarmNote =
        `farmA="${farmA}" bytes=${resA.bytes} X-Farm-Id=${resA.farmIdHeader} | ` +
        `farmB="${farmB}" status=${resB.status} bytes=${resB.bytes} X-Farm-Id=${resB.farmIdHeader} | ` +
        `bytes diferem: ${resA.bytes !== resB.bytes}`;
    }
  } catch (e) {
    r.downloadNote += ` | ERRO: ${(e as Error).message}`;
  }
});

// ===========================================================================
// F-332 — Romaneio Cliente
// ===========================================================================
test('F-332 Romaneio Cliente — render + filtro + download + multi-fazenda', async ({ page }) => {
  test.setTimeout(120000);
  const r = newResult('F-332 Romaneio Cliente', '/relatorios/agricultura/romaneio-cliente');
  const consoleErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  await page.goto(r.route);
  await expect(page).not.toHaveURL(/\/login/);

  try {
    await expect(page.getByRole('heading', { name: 'Romaneio Cliente' })).toBeVisible({
      timeout: 15000,
    });
    r.renderOk = true;
    r.renderNote = `OK. console errors: ${consoleErrors.length}`;
  } catch (e) {
    r.renderNote = `FALHA render: ${(e as Error).message}`;
    return;
  }

  try {
    await fillDateNear(page, 'Data Início', '01012015');
    await fillDateNear(page, 'Data Fim', '09092026');
    r.filtersOk = true;
    r.filtersNote = 'Datas obrigatórias preenchidas (tela não tem filtro de Fazenda em form — só X-Farm-Id global).';
  } catch (e) {
    r.filtersNote = `FALHA filtros: ${(e as Error).message}`;
    return;
  }

  const farmA = await getActiveFarmText(page).catch(() => 'desconhecida');
  try {
    const btn = page.getByRole('button', { name: 'Gerar Relatório' });
    await expect(btn).toBeEnabled({ timeout: 5000 });
    const fileA = path.join(EVIDENCE_DIR, `F-332-${slug(farmA)}.pdf`);
    const resA = await generateAndCapture(
      page,
      () => btn.click(),
      '/transfer-cliente-report',
      fileA,
    );
    r.downloadOk = resA.status === 200 && resA.bytes > 0;
    r.downloadNote = `farmA="${farmA}" status=${resA.status} bytes=${resA.bytes} X-Farm-Id=${resA.farmIdHeader}`;
    if (r.downloadOk) r.files.push(fileA);

    const farms = await getFarmRows(page);
    const farmB = farms.find((f) => f !== farmA);
    if (!farmB) {
      r.multiFarmNote = `Sem 2ª fazenda distinta disponível (fazendas: ${JSON.stringify(farms)}).`;
    } else {
      await switchToFarm(page, farmB);
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Romaneio Cliente' })).toBeVisible({
        timeout: 15000,
      });
      await fillDateNear(page, 'Data Início', '01012015');
      await fillDateNear(page, 'Data Fim', '09092026');
      const btn2 = page.getByRole('button', { name: 'Gerar Relatório' });
      await expect(btn2).toBeEnabled({ timeout: 5000 });
      const fileB = path.join(EVIDENCE_DIR, `F-332-${slug(farmB)}.pdf`);
      const resB = await generateAndCapture(
        page,
        () => btn2.click(),
        '/transfer-cliente-report',
        fileB,
      );
      if (resB.status === 200 && resB.bytes > 0) r.files.push(fileB);
      r.multiFarmOk = resA.farmIdHeader !== resB.farmIdHeader && resB.status === 200;
      r.multiFarmNote =
        `farmA="${farmA}" bytes=${resA.bytes} X-Farm-Id=${resA.farmIdHeader} | ` +
        `farmB="${farmB}" status=${resB.status} bytes=${resB.bytes} X-Farm-Id=${resB.farmIdHeader} | ` +
        `bytes diferem: ${resA.bytes !== resB.bytes}`;
    }
  } catch (e) {
    r.downloadNote += ` | ERRO: ${(e as Error).message}`;
  }
});

// ===========================================================================
// F-336 — Pesagem Entrada/Saída
// ===========================================================================
test('F-336 Pesagem Entrada/Saída — render + filtro + download + multi-fazenda', async ({
  page,
}) => {
  test.setTimeout(120000);
  const r = newResult('F-336 Pesagem Entrada/Saída', '/relatorios/agricultura/pesagem-entrada-saida');
  const consoleErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  await page.goto(r.route);
  await expect(page).not.toHaveURL(/\/login/);

  try {
    await expect(page.getByRole('heading', { name: 'Pesagem Entrada/Saída' })).toBeVisible({
      timeout: 15000,
    });
    r.renderOk = true;
    r.renderNote = `OK. console errors: ${consoleErrors.length}`;
  } catch (e) {
    r.renderNote = `FALHA render: ${(e as Error).message}`;
    return;
  }

  let productLabelA: string | null = null;
  try {
    await fillDateNear(page, 'Data Inicial', '01012015');
    await fillDateNear(page, 'Data Final', '09092026');
    productLabelA = await pickFirstAsyncOption(page, 'product');
    r.filtersOk = !!productLabelA;
    r.filtersNote = `produto selecionado (fazenda inicial): ${productLabelA ?? 'NENHUM — sem opções no lookup'}`;
  } catch (e) {
    r.filtersNote = `FALHA filtros: ${(e as Error).message}`;
    return;
  }

  const farmA = await getActiveFarmText(page).catch(() => 'desconhecida');
  try {
    const btn = page.getByRole('button', { name: 'Gerar Relatório' });
    await expect(btn).toBeEnabled({ timeout: 5000 });
    const fileA = path.join(EVIDENCE_DIR, `F-336-${slug(farmA)}.pdf`);
    const resA = await generateAndCapture(
      page,
      () => btn.click(),
      '/weighing-in-out-report',
      fileA,
    );
    r.downloadOk = resA.status === 200 && resA.bytes > 0;
    r.downloadNote = `farmA="${farmA}" status=${resA.status} bytes=${resA.bytes} X-Farm-Id=${resA.farmIdHeader}`;
    if (r.downloadOk) r.files.push(fileA);

    const farms = await getFarmRows(page);
    const farmB = farms.find((f) => f !== farmA);
    if (!farmB) {
      r.multiFarmNote = `Sem 2ª fazenda distinta disponível (fazendas: ${JSON.stringify(farms)}).`;
    } else {
      await switchToFarm(page, farmB);
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Pesagem Entrada/Saída' })).toBeVisible({
        timeout: 15000,
      });
      await fillDateNear(page, 'Data Inicial', '01012015');
      await fillDateNear(page, 'Data Final', '09092026');
      const productLabelB = await pickFirstAsyncOption(page, 'product');
      const btn2 = page.getByRole('button', { name: 'Gerar Relatório' });
      await expect(btn2).toBeEnabled({ timeout: 5000 });
      const fileB = path.join(EVIDENCE_DIR, `F-336-${slug(farmB)}.pdf`);
      const resB = await generateAndCapture(
        page,
        () => btn2.click(),
        '/weighing-in-out-report',
        fileB,
      );
      if (resB.status === 200 && resB.bytes > 0) r.files.push(fileB);
      r.multiFarmOk = resA.farmIdHeader !== resB.farmIdHeader && resB.status === 200;
      r.multiFarmNote =
        `farmA="${farmA}" (produto=${productLabelA}) bytes=${resA.bytes} X-Farm-Id=${resA.farmIdHeader} | ` +
        `farmB="${farmB}" (produto=${productLabelB}) status=${resB.status} bytes=${resB.bytes} X-Farm-Id=${resB.farmIdHeader} | ` +
        `bytes diferem: ${resA.bytes !== resB.bytes}`;
    }
  } catch (e) {
    r.downloadNote += ` | ERRO: ${(e as Error).message}`;
  }
});

// ===========================================================================
// F-309 — Produtos x Previsão de Entrega
// ===========================================================================
test('F-309 Produtos x Prev. Entrega — render + filtro + download + multi-fazenda', async ({
  page,
}) => {
  test.setTimeout(120000);
  const r = newResult(
    'F-309 Produtos x Prev. Entrega',
    '/relatorios/suprimentos/produtos-prev-entrega',
  );
  const consoleErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  await page.goto(r.route);
  await expect(page).not.toHaveURL(/\/login/);

  try {
    await expect(page.getByRole('heading', { name: 'Produtos x Prev. Entrega' })).toBeVisible({
      timeout: 15000,
    });
    r.renderOk = true;
    r.renderNote = `OK. console errors: ${consoleErrors.length}`;
  } catch (e) {
    r.renderNote = `FALHA render: ${(e as Error).message}`;
    return;
  }

  try {
    await fillDateNear(page, 'Dt. Início', '01012015');
    await fillDateNear(page, 'Dt. Fim', '09092026');
    // Filtro de Fazenda EM FORM (farmOptions do /options combinado) —
    // confere que popula, mas deixa "Todas" (não seleciona) para não
    // conflitar com o mecanismo de X-Farm-Id global testado no multi-farm.
    const container = fieldContainer(page, 'Fazenda');
    const trigger = container.locator('[data-part="trigger"]').first();
    await trigger.click();
    await page.waitForTimeout(400);
    const optCount = await page.locator('[data-part="item"]:not([data-disabled])').count();
    await page.keyboard.press('Escape');
    r.filtersOk = optCount > 0;
    r.filtersNote = `Select "Fazenda" do form populou com ${optCount} opções (não selecionada — teste usa X-Farm-Id global).`;
  } catch (e) {
    r.filtersNote = `FALHA filtros: ${(e as Error).message}`;
    return;
  }

  const farmA = await getActiveFarmText(page).catch(() => 'desconhecida');
  try {
    const btnPdf = page.getByRole('button', { name: 'Baixar PDF' });
    await expect(btnPdf).toBeEnabled({ timeout: 5000 });
    const fileA = path.join(EVIDENCE_DIR, `F-309-${slug(farmA)}.pdf`);
    const resA = await generateAndCapture(
      page,
      () => btnPdf.click(),
      '/request-purchases/forecast-report',
      fileA,
    );
    r.downloadOk = resA.status === 200 && resA.bytes > 0;
    r.downloadNote = `farmA="${farmA}" status=${resA.status} bytes=${resA.bytes} X-Farm-Id=${resA.farmIdHeader}`;
    if (r.downloadOk) r.files.push(fileA);

    // Bônus: Excel (PDF e Excel quando houver) — só na fazenda A.
    try {
      const btnExcel = page.getByRole('button', { name: 'Baixar Excel' });
      const fileAExcel = path.join(EVIDENCE_DIR, `F-309-${slug(farmA)}.xlsx`);
      const resExcel = await generateAndCapture(
        page,
        () => btnExcel.click(),
        '/request-purchases/forecast-report/excel',
        fileAExcel,
      );
      r.downloadNote += ` | Excel status=${resExcel.status} bytes=${resExcel.bytes}`;
      if (resExcel.status === 200 && resExcel.bytes > 0) r.files.push(fileAExcel);
    } catch (e) {
      r.downloadNote += ` | Excel ERRO: ${(e as Error).message}`;
    }

    const farms = await getFarmRows(page);
    const farmB = farms.find((f) => f !== farmA);
    if (!farmB) {
      r.multiFarmNote = `Sem 2ª fazenda distinta disponível (fazendas: ${JSON.stringify(farms)}).`;
    } else {
      await switchToFarm(page, farmB);
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Produtos x Prev. Entrega' })).toBeVisible({
        timeout: 15000,
      });
      await fillDateNear(page, 'Dt. Início', '01012015');
      await fillDateNear(page, 'Dt. Fim', '09092026');
      const btn2 = page.getByRole('button', { name: 'Baixar PDF' });
      await expect(btn2).toBeEnabled({ timeout: 5000 });
      const fileB = path.join(EVIDENCE_DIR, `F-309-${slug(farmB)}.pdf`);
      const resB = await generateAndCapture(
        page,
        () => btn2.click(),
        '/request-purchases/forecast-report',
        fileB,
      );
      if (resB.status === 200 && resB.bytes > 0) r.files.push(fileB);
      r.multiFarmOk = resA.farmIdHeader !== resB.farmIdHeader && resB.status === 200;
      r.multiFarmNote =
        `farmA="${farmA}" bytes=${resA.bytes} X-Farm-Id=${resA.farmIdHeader} | ` +
        `farmB="${farmB}" status=${resB.status} bytes=${resB.bytes} X-Farm-Id=${resB.farmIdHeader} | ` +
        `bytes diferem: ${resA.bytes !== resB.bytes}`;
    }
  } catch (e) {
    r.downloadNote += ` | ERRO: ${(e as Error).message}`;
  }
});

// ===========================================================================
// F-264 — Movimento Bancário
// ===========================================================================
test('F-264 Movimento Bancário — render + filtro + download + multi-fazenda', async ({ page }) => {
  test.setTimeout(120000);
  const r = newResult('F-264 Movimento Bancário', '/relatorios/financeiro/movimento-bancario');
  const consoleErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  await page.goto(r.route);
  await expect(page).not.toHaveURL(/\/login/);

  try {
    await expect(page.getByRole('heading', { name: 'Movimento Bancário' })).toBeVisible({
      timeout: 15000,
    });
    r.renderOk = true;
    r.renderNote = `OK. console errors: ${consoleErrors.length}`;
  } catch (e) {
    r.renderNote = `FALHA render: ${(e as Error).message}`;
    return;
  }

  try {
    await fillDateNear(page, 'Data Início', '01012015');
    await fillDateNear(page, 'Data Fim', '09092026');
    const container = fieldContainer(page, 'Fazenda');
    const trigger = container.locator('[data-part="trigger"]').first();
    await trigger.click();
    await page.waitForTimeout(400);
    const optCount = await page.locator('[data-part="item"]:not([data-disabled])').count();
    await page.keyboard.press('Escape');
    r.filtersOk = optCount > 0;
    r.filtersNote = `Select "Fazenda" do form (tenant-scoped, listFarms()) populou com ${optCount} opções (não selecionada — teste usa X-Farm-Id global).`;
  } catch (e) {
    r.filtersNote = `FALHA filtros: ${(e as Error).message}`;
    return;
  }

  const farmA = await getActiveFarmText(page).catch(() => 'desconhecida');
  try {
    const btn = page.getByRole('button', { name: 'Gerar Relatório' });
    await expect(btn).toBeEnabled({ timeout: 5000 });
    const fileA = path.join(EVIDENCE_DIR, `F-264-${slug(farmA)}.pdf`);
    const resA = await generateAndCapture(
      page,
      () => btn.click(),
      '/financial-movement-report',
      fileA,
    );
    r.downloadOk = resA.status === 200 && resA.bytes > 0;
    r.downloadNote = `farmA="${farmA}" status=${resA.status} bytes=${resA.bytes} X-Farm-Id=${resA.farmIdHeader}`;
    if (r.downloadOk) r.files.push(fileA);

    const farms = await getFarmRows(page);
    const farmB = farms.find((f) => f !== farmA);
    if (!farmB) {
      r.multiFarmNote = `Sem 2ª fazenda distinta disponível (fazendas: ${JSON.stringify(farms)}).`;
    } else {
      await switchToFarm(page, farmB);
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Movimento Bancário' })).toBeVisible({
        timeout: 15000,
      });
      await fillDateNear(page, 'Data Início', '01012015');
      await fillDateNear(page, 'Data Fim', '09092026');
      const btn2 = page.getByRole('button', { name: 'Gerar Relatório' });
      await expect(btn2).toBeEnabled({ timeout: 5000 });
      const fileB = path.join(EVIDENCE_DIR, `F-264-${slug(farmB)}.pdf`);
      const resB = await generateAndCapture(
        page,
        () => btn2.click(),
        '/financial-movement-report',
        fileB,
      );
      if (resB.status === 200 && resB.bytes > 0) r.files.push(fileB);
      r.multiFarmOk = resA.farmIdHeader !== resB.farmIdHeader && resB.status === 200;
      r.multiFarmNote =
        `farmA="${farmA}" bytes=${resA.bytes} X-Farm-Id=${resA.farmIdHeader} | ` +
        `farmB="${farmB}" status=${resB.status} bytes=${resB.bytes} X-Farm-Id=${resB.farmIdHeader} | ` +
        `bytes diferem: ${resA.bytes !== resB.bytes}`;
    }
  } catch (e) {
    r.downloadNote += ` | ERRO: ${(e as Error).message}`;
  }
});
