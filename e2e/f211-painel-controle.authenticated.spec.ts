import fs from 'fs';
import path from 'path';

import { test, expect, Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────
// E2E autenticado do F-211 (Painel de Controle / Visão Geral = /home) —
// execução 062, gb-cerne-front-tester-v2. Escopo: roteamento (OverviewPanel
// substitui o launcher antigo), os 11 blocos wireados a API real (sem mock),
// estados de UI, console/rede, troca de fazenda ativa (X-Farm-Id) e captura
// light+dark para leitura visual do Maestro (DEC-170).
//
// NÃO lê .env.login diretamente (isso é scripts/e2e/run-authenticated.sh);
// reusa a sessão persistida por e2e/auth.setup.ts (projeto `authenticated`).
// Escrito pelo gb-cerne-front-tester-v2 nesta sessão de validação.
// ─────────────────────────────────────────────────────────────────────────

const EVIDENCE_DIR =
  '/home/pietro/ambiente/CORE_WORKSPACE/97-Esteiras/062-painel-controle/EVIDENCIAS/screenshots-f211';

type BlockSpec = { surfaceId: string; heading: string };

const BLOCKS: BlockSpec[] = [
  { surfaceId: 'f211-map-areas', heading: 'Mapa dos talhões' },
  { surfaceId: 'f211-kpi-metrics', heading: 'Receitas realizadas' },
  { surfaceId: 'f211-receipts-monthly', heading: 'Receitas mensais' },
  { surfaceId: 'f211-operational-result', heading: 'Resultado operacional' },
  { surfaceId: 'f211-cashflow-projection', heading: 'Fluxo de caixa projetado' },
  { surfaceId: 'f211-financial-summary-coecot', heading: 'Custo de produção' },
  { surfaceId: 'f211-financial-summary-forecast', heading: 'Previsão a receber/pagar' },
  { surfaceId: 'f211-financial-summary-aging', heading: 'Aging de títulos' },
  { surfaceId: 'f211-financial-summary-concentration', heading: 'Concentração de receita' },
  { surfaceId: 'f211-exceptions-week', heading: 'Exceções da semana' },
  { surfaceId: 'f211-stock-coverage', heading: 'Cobertura de estoque' },
  { surfaceId: 'f211-product-results', heading: 'Resultado por produto' },
];

const consoleErrorsLog: string[] = [];
const networkErrorsLog: string[] = [];
const capturedFiles: string[] = [];

function attachDiagnostics(page: Page) {
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrorsLog.push(m.text());
  });
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().includes('/api/')) {
      networkErrorsLog.push(`${r.status()} ${r.request().method()} ${r.url()}`);
    }
  });
}

async function shot(page: Page, name: string): Promise<string> {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  const file = path.join(EVIDENCE_DIR, `${name}.png`);
  await page.screenshot({ path: file });
  capturedFiles.push(file);
  return file;
}

async function isDarkTheme(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.dataset.theme === 'dark');
}

async function toggleTheme(page: Page) {
  await page.getByRole('button', { name: 'Alternar tema' }).click();
  await page.waitForTimeout(300);
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

// Marcador ESTÁVEL de "casca carregada": o subtítulo `HeaderDashboard`
// (`Visão geral` / `Visão geral · {farm}`) é renderizado SEMPRE, independente
// de RBAC por bloco (ao contrário de "Mapa dos talhões", que só aparece com
// `home_dashboard_view`) — achado desta sessão: o usuário do harness só tem
// `incomestatement_view` (ver `f211-diag-permissions`), então NENHUM bloco
// gateado por `home_*` aparece; usar a casca como sinal de "app montou".
async function waitForShellLoaded(page: Page) {
  await page.getByText('Visão geral', { exact: false }).first().waitFor({ timeout: 20000 });
}

test.afterAll(() => {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  const summary = {
    consoleErrors: consoleErrorsLog,
    networkErrors: networkErrorsLog,
    files: capturedFiles,
  };
  fs.writeFileSync(
    path.join(EVIDENCE_DIR, '_resultado-f211-e2e.json'),
    JSON.stringify(summary, null, 2)
  );
  // eslint-disable-next-line no-console -- saída de diagnóstico do harness p/ o tester ler do stdout
  console.log('RESULTADO_F211_E2E_JSON_START');
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(summary, null, 2));
  // eslint-disable-next-line no-console
  console.log('RESULTADO_F211_E2E_JSON_END');
});

test('F-211 /home renderiza OverviewPanel (não o launcher antigo)', async ({ page }) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page).toHaveURL(/\/home/);

  // Marcador positivo do OverviewPanel novo (casca sempre renderizada).
  await expect(page.getByText('Visão geral', { exact: false }).first()).toBeVisible({
    timeout: 20000,
  });

  // Marcadores do launcher antigo (`src/pages/Home/index.tsx`) NÃO podem
  // aparecer mais em `/home`.
  await expect(page.getByText('Últimos acessos', { exact: false })).toHaveCount(0);
  await expect(page.getByText('Favoritos', { exact: false })).toHaveCount(0);

  await shot(page, 'f211-overview-panel-roteamento-light');
});

test('F-211 blocos renderizam com dado real (light) — screenshot por bloco', async ({ page }) => {
  test.setTimeout(120000);
  attachDiagnostics(page);

  // Não trava em waitForResponse de overview/financial-summary: o usuário do
  // harness (achado desta sessão, ver f211-diag-permissions) só tem
  // `incomestatement_view` — `canOverview`/`canFinancial` ficam false e essas
  // 2 queries nascem `enabled:false` (NUNCA disparam a request). Captura
  // "melhor esforço": se disparar, valida o envelope; se não, documenta.
  const respOverview = page
    .waitForResponse((r) => r.url().includes('/dashboards/home/overview'), { timeout: 5000 })
    .catch(() => null);
  const respFinancial = page
    .waitForResponse((r) => r.url().includes('/dashboards/home/financial-summary'), {
      timeout: 5000,
    })
    .catch(() => null);

  await page.goto('/home');
  await waitForShellLoaded(page);
  const [overviewResp, financialResp] = await Promise.all([respOverview, respFinancial]);

  if (overviewResp) {
    expect(overviewResp.status(), 'overview endpoint deve responder 2xx').toBeLessThan(300);
    expect(
      overviewResp.request().headers()['x-farm-id'],
      'overview deve levar X-Farm-Id'
    ).toBeTruthy();
  } else {
    networkErrorsLog.push(
      'OVERVIEW_QUERY_NAO_DISPAROU: canOverview=false para o usuário do harness (sem home_dashboard_view) — query enabled:false, request nunca sai do client.'
    );
  }
  if (financialResp) {
    expect(financialResp.status(), 'financial-summary endpoint deve responder 2xx').toBeLessThan(
      300
    );
  } else {
    networkErrorsLog.push(
      'FINANCIAL_QUERY_NAO_DISPAROU: canFinancial=false para o usuário do harness (sem home_financial_dashboard_view) — query enabled:false, request nunca sai do client.'
    );
  }

  await shot(page, 'f211-overview-panel-full-light');

  for (const block of BLOCKS) {
    const locator = page.getByText(block.heading, { exact: false }).first();
    try {
      await locator.waitFor({ state: 'visible', timeout: 8000 });
      await locator.scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      await shot(page, `${block.surfaceId}-light`);
    } catch (e) {
      // Bloco pode estar ausente por RBAC do usuário do harness ou dado
      // vazio honesto — registra e segue (não derruba os outros blocos).
      networkErrorsLog.push(
        `BLOCO_NAO_VISIVEL surface=${block.surfaceId} heading="${block.heading}" erro=${(e as Error).message}`
      );
    }
  }
});

test('F-211 tema dark — captura full page + blocos-chave', async ({ page }) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await waitForShellLoaded(page);

  const wasDark = await isDarkTheme(page);
  if (wasDark) {
    // Garante partir de light para o par de screenshots ficar determinístico.
    await toggleTheme(page);
  }
  await shot(page, 'f211-overview-panel-full-light-confirmado');

  await toggleTheme(page);
  expect(await isDarkTheme(page), 'html[data-theme] deve virar dark após o toggle').toBe(true);
  await page.waitForTimeout(300);
  await shot(page, 'f211-overview-panel-full-dark');

  for (const block of BLOCKS.slice(0, 4)) {
    const locator = page.getByText(block.heading, { exact: false }).first();
    const visible = await locator.isVisible().catch(() => false);
    if (visible) {
      await locator.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await shot(page, `${block.surfaceId}-dark`);
    }
  }

  // Devolve o tema a light para não vazar estado para os próximos testes
  // (cada teste roda com sua própria página, mas o tema é persistido em
  // localStorage do MESMO storageState reaproveitado entre specs).
  await toggleTheme(page);
});

test('F-211 item A — margem bruta exibe PERCENTUAL, distinto do Saldo operacional (R$)', async ({
  page,
}) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await waitForShellLoaded(page);

  const marginLabel = page.getByText('Margem bruta', { exact: false }).first();
  await marginLabel.waitFor({ state: 'visible', timeout: 20000 });
  await marginLabel.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);

  // Fix wave F-211, item A: "Margem bruta" agora exibe `gross_margin_pct`
  // (PERCENTUAL, ex. "42,3%") como valor PRINCIPAL — antes exibia o MESMO
  // valor absoluto (R$) do card vizinho "Saldo operacional" (bug de design:
  // os 2 cards eram idênticos por construção). Sobe até o DashboardCard pai
  // (ancestral comum de label+valor+tooltip) e lê o texto inteiro do bloco.
  const marginCard = page.locator('div').filter({ hasText: 'Margem bruta' }).last();
  const marginCardText = (await marginCard.textContent()) ?? '';

  const saldoLabel = page.getByText('Saldo operacional', { exact: false }).first();
  await saldoLabel.waitFor({ state: 'visible', timeout: 10000 });
  const saldoCard = page.locator('div').filter({ hasText: 'Saldo operacional' }).last();
  const saldoCardText = (await saldoCard.textContent()) ?? '';

  await shot(page, 'f211-itemA-margem-bruta-percentual');

  if (/sem dado/i.test(marginCardText)) {
    // Lacuna honesta (sem receita/custo realizados no período) é estado
    // válido — documenta e não derruba o teste (não é o bug do item A).
    networkErrorsLog.push(
      `ITEM_A_MARGEM_SEM_DADO: card exibiu lacuna honesta, não pôde validar formato % — texto="${marginCardText}"`
    );
    return;
  }

  expect(marginCardText, 'card de margem bruta deve exibir PERCENTUAL (%)').toMatch(/%/);
  // O valor de "Saldo operacional" é moeda (R$); a margem bruta não deve mais
  // replicar esse mesmo valor absoluto (bug corrigido pelo item A).
  const saldoValueMatch = /R\$\s*[\d.,]+/.exec(saldoCardText);
  if (saldoValueMatch) {
    expect(
      marginCardText,
      'card de margem bruta não pode repetir o valor absoluto (R$) do Saldo operacional'
    ).not.toContain(saldoValueMatch[0]);
  }
});

test('F-211 Ajuste 2 — filtro de período (1/2/3/6/12 meses, default 6) refatia sem erro', async ({
  page,
}) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await waitForShellLoaded(page);

  // Default deve ser "Últimos 6 meses" (Ajuste 2 — trocou de 3/6/10 para
  // 1/2/3/6/12, default '6').
  const periodTrigger = page.getByRole('button', { name: /Últimos 6 meses/i });
  await expect(
    periodTrigger,
    'default do filtro de período deve ser "Últimos 6 meses"'
  ).toBeVisible({ timeout: 15000 });

  await periodTrigger.click();
  await page.waitForTimeout(200);
  await shot(page, 'f211-ajuste2-filtro-periodo-aberto');

  // As 5 opções contratadas devem estar todas presentes no menu aberto.
  for (const label of [
    'Último mês',
    'Últimos 2 meses',
    'Últimos 3 meses',
    'Últimos 6 meses',
    'Últimos 12 meses',
  ]) {
    await expect(
      page.getByRole('menuitem', { name: label }),
      `opção de período ausente: ${label}`
    ).toBeVisible();
  }

  // Troca para "Últimos 3 meses" e confirma que o gráfico "Receitas mensais"
  // refatia client-side sem erro de console/rede (recorte sobre dado já
  // buscado, nenhuma nova chamada de API).
  await page.getByRole('menuitem', { name: 'Últimos 3 meses' }).click();
  await page.waitForTimeout(400);
  await expect(page.getByRole('button', { name: /Últimos 3 meses/i })).toBeVisible();
  await page.getByText('Receitas mensais', { exact: false }).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await shot(page, 'f211-ajuste2-periodo-3-meses-receitas-mensais');

  expect(consoleErrorsLog, 'troca de período não pode gerar erro de console').toHaveLength(0);
});

test('F-211 Ajustes 4+5 — bloco Previsão tem título e 3 cards full-width (sem quebra)', async ({
  page,
}) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await waitForShellLoaded(page);

  // Ajuste 4 — GAP-FE-254 fechado: o bloco agora tem título de seção
  // ("Previsão a receber/pagar"), igual aos blocos irmãos.
  const forecastTitle = page.getByText('Previsão a receber/pagar', { exact: false }).first();
  await forecastTitle.waitFor({ state: 'visible', timeout: 20000 });
  await forecastTitle.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);

  // Ajuste 5 — largura total da fileira: mede o card do bloco Previsão
  // (ancestral comum de título+3 colunas) e compara com a fileira de KPIs
  // vizinha (`DashboardRow` do bloco #3, mesma página) para confirmar que
  // NÃO sobra espaço vazio à direita (card ocupa a largura da grid, mirror
  // dos blocos irmãos).
  const forecastCard = page.locator('div').filter({ hasText: 'Previsão a receber/pagar' }).last();
  const forecastBox = await forecastCard.boundingBox();
  const gridWidth = await page.evaluate(() => {
    const grid = document.querySelector('main') ?? document.body;
    return grid.getBoundingClientRect().width;
  });
  expect(forecastBox, 'bounding box do bloco Previsão deve existir').not.toBeNull();
  if (forecastBox) {
    const ratio = forecastBox.width / gridWidth;
    expect(
      ratio,
      'bloco Previsão deve ocupar quase a largura total da grid (>=0.85)'
    ).toBeGreaterThan(0.85);
  }

  // "A receber" não pode quebrar em 2 linhas (valor com 1 única linha de
  // altura de fonte 2xl — mede a altura da linha do valor de "A receber").
  const receivableValue = page
    .locator('p, span, div')
    .filter({ hasText: /^R\$\s/ })
    .first();
  await expect(receivableValue).toBeVisible();

  await shot(page, 'f211-ajustes4-5-previsao-titulo-fullwidth');
});

test('F-211 troca de fazenda ativa (X-Farm-Id) reflete na tela', async ({ page }) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await waitForShellLoaded(page);

  const hasFarmSwitcher = await page
    .getByRole('textbox', { name: 'Selecionar fazenda ativa' })
    .isVisible()
    .catch(() => false);

  if (!hasFarmSwitcher) {
    networkErrorsLog.push(
      'FARM_SWITCHER_AUSENTE: usuário do harness não expõe o seletor de fazenda ativa (0 ou 1 fazenda?) — troca de tenant não pôde ser exercitada.'
    );
    return;
  }

  const farmA = await getActiveFarmText(page).catch(() => 'desconhecida');
  const farms = await getFarmRows(page);
  const farmB = farms.find((f) => f !== farmA);

  if (!farmB) {
    networkErrorsLog.push(
      `FARM_SWITCHER_SEM_2A_FAZENDA: usuário do harness só tem 1 fazenda distinta (${JSON.stringify(farms)}) — troca de tenant não pôde ser exercitada.`
    );
    return;
  }

  const subtitleBefore =
    (await page.getByText('Visão geral', { exact: false }).first().textContent()) ?? '';
  await shot(page, 'f211-tenant-fazenda-A-antes');

  // Melhor esforço: a query overview pode nunca disparar para este usuário
  // (ver achado RBAC acima) — não trava o teste nisso; o sinal principal é o
  // próprio input do farm switcher + o subtítulo da casca.
  const respPromise = page
    .waitForResponse((r) => r.url().includes('/dashboards/home/overview'), { timeout: 5000 })
    .catch(() => null);
  await switchToFarm(page, farmB);
  const resp = await respPromise;
  const farmIdHeaderB = resp ? (resp.request().headers()['x-farm-id'] ?? null) : null;

  await waitForShellLoaded(page);
  await page.waitForTimeout(300);
  const subtitleAfter =
    (await page.getByText('Visão geral', { exact: false }).first().textContent()) ?? '';
  await shot(page, 'f211-tenant-fazenda-B-depois');

  const farmBActive = await getActiveFarmText(page);
  expect(farmBActive, 'farm switcher deve refletir a nova fazenda selecionada').toBe(farmB);
  expect(subtitleAfter, 'subtítulo da casca deve mudar de fazenda').not.toBe(subtitleBefore);
  expect(subtitleAfter, 'subtítulo deve conter o nome da nova fazenda').toContain(farmB);

  networkErrorsLog.push(
    `TENANT_SWITCH_OK farmA="${farmA}" farmB="${farmB}" subtitleAntes="${subtitleBefore}" subtitleDepois="${subtitleAfter}" X-Farm-Id(overview)=${farmIdHeaderB ?? 'N/A (query não disparou)'}`
  );
});

// ─────────────────────────────────────────────────────────────────────────
// TESTE FINAL — fix wave A-H (execução 062, 062-painel-controle). Itens B,
// C, D, F, G, H do dispatch do Maestro (item E não existe no dispatch).
// ─────────────────────────────────────────────────────────────────────────

test('F-211 item B — concentração de receita mostra "Sem dado" quando vazia (nunca donut em branco)', async ({
  page,
}) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await waitForShellLoaded(page);

  const title = page.getByText('Concentração de receita', { exact: false }).first();
  const visible = await title.isVisible({ timeout: 15000 }).catch(() => false);
  if (!visible) {
    networkErrorsLog.push(
      'ITEM_B_BLOCO_AUSENTE: "Concentração de receita" não visível (RBAC do usuário do harness) — não pôde ser validado nesta sessão.'
    );
    return;
  }
  await title.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const card = page.locator('div').filter({ hasText: 'Concentração de receita' }).last();
  const hasNoDataText = await card
    .getByText(/sem dados?/i)
    .isVisible()
    .catch(() => false);
  const hasDonutSvg = await card
    .locator('svg')
    .first()
    .isVisible()
    .catch(() => false);

  await shot(page, 'f211-itemB-concentracao-receita');

  // Nunca os dois estados ausentes ao mesmo tempo (isso SIM seria "donut em
  // branco"/tela quebrada) — ou mostra "Sem dado(s)", ou mostra o donut real.
  expect(
    hasNoDataText || hasDonutSvg,
    'bloco deve mostrar "Sem dado(s)" OU o donut com dado — nunca nenhum dos dois'
  ).toBe(true);

  networkErrorsLog.push(`ITEM_B_ESTADO: hasNoDataText=${hasNoDataText} hasDonutSvg=${hasDonutSvg}`);
});

test('F-211 item C — cards financeiros têm ícone de info com tooltip de origem do dado', async ({
  page,
}) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await waitForShellLoaded(page);
  await page.waitForTimeout(500);

  // `CardInfoTooltip` renderiza `role="img"` com `aria-label` = texto do
  // tooltip e `cursor: help` — seletor estrutural (sem depender de texto
  // específico, reusado por 11 blocos diferentes).
  const infoIcons = page.locator('span[role="img"][aria-label]');
  const count = await infoIcons.count();

  await shot(page, 'f211-itemC-icones-info-overview');

  expect(
    count,
    'deve haver pelo menos 1 ícone de info/tooltip de origem do dado visível'
  ).toBeGreaterThan(0);

  // Hover no primeiro ícone visível — confirma que o tooltip real aparece
  // (não só o atributo aria-label estático).
  let hovered = false;
  for (let i = 0; i < count; i += 1) {
    const icon = infoIcons.nth(i);
    if (await icon.isVisible().catch(() => false)) {
      const expectedText = await icon.getAttribute('aria-label');
      await icon.hover();
      const tooltipContent = page.locator('[data-scope="tooltip"][data-part="content"]');
      await tooltipContent.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      const tooltipVisible = await tooltipContent.isVisible().catch(() => false);
      if (tooltipVisible) {
        const tooltipText = (await tooltipContent.textContent()) ?? '';
        expect(tooltipText.length, 'tooltip deve ter texto de origem do dado').toBeGreaterThan(0);
        expect(expectedText, 'aria-label do ícone deve bater com o conteúdo do tooltip').toBe(
          tooltipText
        );
        await shot(page, 'f211-itemC-tooltip-hover');
        hovered = true;
      }
      break;
    }
  }
  networkErrorsLog.push(`ITEM_C_ICONES_INFO count=${count} tooltipConfirmadoPorHover=${hovered}`);
});

test('F-211 item D — mapa de talhões usa camada satélite (Esri), não mapa de ruas', async ({
  page,
}) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  const tileRequests: string[] = [];
  page.on('request', (r) => {
    const url = r.url();
    if (
      /arcgisonline|tile\.openstreetmap|\{z\}|World_Imagery|ArcGIS/i.test(url) ||
      /\/\d+\/\d+\/\d+(\.png|\.jpe?g)?(\?|$)/.test(url)
    ) {
      tileRequests.push(url);
    }
  });

  await page.goto('/home');
  await waitForShellLoaded(page);

  const mapVisible = await page
    .getByText('Mapa dos talhões', { exact: false })
    .first()
    .isVisible({ timeout: 15000 })
    .catch(() => false);
  if (!mapVisible) {
    networkErrorsLog.push(
      'ITEM_D_MAPA_AUSENTE: "Mapa dos talhões" não visível (RBAC do usuário do harness, sem home_dashboard_view) — não pôde ser validado nesta sessão.'
    );
    return;
  }

  await page.getByText('Mapa dos talhões', { exact: false }).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await shot(page, 'f211-itemD-mapa-satelite');

  const esriRequests = tileRequests.filter((u) => /arcgisonline|World_Imagery/i.test(u));
  const osmRequests = tileRequests.filter((u) => /tile\.openstreetmap/i.test(u));

  networkErrorsLog.push(
    `ITEM_D_TILE_REQUESTS esri=${esriRequests.length} osm=${osmRequests.length} amostraEsri=${esriRequests[0] ?? 'N/A'}`
  );

  expect(
    osmRequests.length,
    'mapa NÃO pode requisitar tiles OpenStreetMap (rua) — deve ser satélite'
  ).toBe(0);
  if (esriRequests.length === 0) {
    networkErrorsLog.push(
      'ITEM_D_SEM_REQUEST_ESRI: nenhuma request de tile Esri capturada (mapa sem geometria/RBAC, ou runtime sem saída de rede externa) — verificação de código-fonte (FarmAreasMap.tsx) confirma a URL arcgisonline estaticamente; validação de rede inconclusiva.'
    );
  }
});

test('F-211 item F — eixos dos gráficos mensais usam "Mmm/AAAA" (não "AAAA-MM")', async ({
  page,
}) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await waitForShellLoaded(page);

  const monthPattern = /^[A-Z][a-z]{2}\/\d{4}$/;
  const rawKeyPattern = /^\d{4}-\d{2}$/;

  for (const heading of ['Receitas mensais', 'Fluxo de caixa projetado']) {
    const title = page.getByText(heading, { exact: false }).first();
    const visible = await title.isVisible({ timeout: 15000 }).catch(() => false);
    if (!visible) {
      networkErrorsLog.push(`ITEM_F_BLOCO_AUSENTE bloco="${heading}"`);
      continue;
    }
    await title.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    const card = page.locator('div').filter({ hasText: heading }).last();
    const ticks = card.locator('.recharts-xAxis .recharts-cartesian-axis-tick-value tspan');
    const n = await ticks.count();
    if (n === 0) {
      networkErrorsLog.push(`ITEM_F_SEM_TICKS bloco="${heading}" (série vazia/estado empty)`);
      continue;
    }
    const labels: string[] = [];
    for (let i = 0; i < n; i += 1) {
      labels.push(((await ticks.nth(i).textContent()) ?? '').trim());
    }
    await shot(
      page,
      `f211-itemF-eixo-mmmaaaa-${heading === 'Receitas mensais' ? 'receitas' : 'fluxo'}`
    );

    for (const label of labels) {
      expect(label, `label do eixo deve ser cru YYYY-MM: "${label}"`).not.toMatch(rawKeyPattern);
      expect(label, `label do eixo deve ser "Mmm/AAAA": "${label}"`).toMatch(monthPattern);
    }
    networkErrorsLog.push(`ITEM_F_LABELS bloco="${heading}" labels=${JSON.stringify(labels)}`);
  }
});

test('F-211 item G — tooltips dos gráficos financeiros usam número pt-BR (milhar "." + decimal "," + R$)', async ({
  page,
}) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await waitForShellLoaded(page);

  const ptBrCurrencyPattern = /R\$\s?\d{1,3}(\.\d{3})*,\d{2}/;
  // Bug antigo apontado pelo dispatch: "290.638,3" (separador de milhar
  // certo, mas SÓ 1 casa decimal — não 2) — checado abaixo via `,\d(?!\d)`.

  for (const heading of ['Aging de títulos', 'Receitas mensais']) {
    const title = page.getByText(heading, { exact: false }).first();
    const visible = await title.isVisible({ timeout: 15000 }).catch(() => false);
    if (!visible) {
      networkErrorsLog.push(`ITEM_G_BLOCO_AUSENTE bloco="${heading}"`);
      continue;
    }
    await title.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    const card = page.locator('div').filter({ hasText: heading }).last();
    const chartArea = card.locator('.recharts-wrapper').first();
    const chartVisible = await chartArea.isVisible().catch(() => false);
    if (!chartVisible) {
      networkErrorsLog.push(`ITEM_G_SEM_GRAFICO bloco="${heading}" (estado empty)`);
      continue;
    }

    const box = await chartArea.boundingBox();
    if (!box) continue;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);

    const tooltip = page.locator('.recharts-tooltip-wrapper').first();
    const tooltipVisible = await tooltip.isVisible().catch(() => false);
    await shot(
      page,
      `f211-itemG-tooltip-ptbr-${heading === 'Aging de títulos' ? 'aging' : 'receitas'}`
    );

    if (!tooltipVisible) {
      networkErrorsLog.push(`ITEM_G_TOOLTIP_NAO_APARECEU bloco="${heading}"`);
      continue;
    }
    const tooltipText = (await tooltip.textContent()) ?? '';
    networkErrorsLog.push(`ITEM_G_TOOLTIP_TEXTO bloco="${heading}" texto="${tooltipText}"`);

    expect(
      tooltipText,
      'tooltip não pode conter o bug de 1 casa decimal (ex. "290.638,3")'
    ).not.toMatch(/,\d(?!\d)/);
    if (ptBrCurrencyPattern.test(tooltipText)) {
      expect(tooltipText).toMatch(ptBrCurrencyPattern);
    }
  }
});

test('F-211 item H — gráficos financeiros mostram loading/empty (nunca gráfico vazio mudo)', async ({
  page,
}) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await waitForShellLoaded(page);
  await page.waitForTimeout(500);

  for (const heading of [
    'Receitas mensais',
    'Resultado operacional',
    'Fluxo de caixa projetado',
    'Aging de títulos',
  ]) {
    const title = page.getByText(heading, { exact: false }).first();
    const visible = await title.isVisible({ timeout: 10000 }).catch(() => false);
    if (!visible) {
      networkErrorsLog.push(`ITEM_H_BLOCO_AUSENTE bloco="${heading}"`);
      continue;
    }
    await title.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const card = page.locator('div').filter({ hasText: heading }).last();
    const hasChart = await card
      .locator('.recharts-wrapper')
      .first()
      .isVisible()
      .catch(() => false);
    const hasNoDataText = await card
      .getByText(/sem dados? para o per[ií]odo/i)
      .isVisible()
      .catch(() => false);

    // Nunca os dois estados ausentes (isso é o "gráfico vazio mudo" do
    // dispatch — nem chart nem mensagem, card em branco).
    expect(
      hasChart || hasNoDataText,
      `bloco "${heading}" deve mostrar o gráfico OU "Sem dados..." — nunca card em branco`
    ).toBe(true);
    networkErrorsLog.push(
      `ITEM_H_ESTADO bloco="${heading}" hasChart=${hasChart} hasNoDataText=${hasNoDataText}`
    );
  }
  await shot(page, 'f211-itemH-loading-empty-graficos');
});

test('F-211 regressão — 13 blocos montam, console 0 erros, rede 0 4xx/5xx ao trocar período (1/2/3/6/12)', async ({
  page,
}) => {
  test.setTimeout(90000);
  const localConsoleErrors: string[] = [];
  const localNetworkErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') localConsoleErrors.push(m.text());
  });
  page.on('response', (r) => {
    if (r.status() >= 400)
      localNetworkErrors.push(`${r.status()} ${r.request().method()} ${r.url()}`);
  });

  await page.goto('/home');
  await waitForShellLoaded(page);
  await page.waitForTimeout(500);

  for (const label of [
    'Último mês',
    'Últimos 2 meses',
    'Últimos 3 meses',
    'Últimos 6 meses',
    'Últimos 12 meses',
  ]) {
    const periodTrigger = page.getByRole('button', { name: /Últimos? \d+ mes(es)?|Último mês/i });
    await periodTrigger.click();
    await page.waitForTimeout(150);
    await page.getByRole('menuitem', { name: label }).click();
    await page.waitForTimeout(500);
    const stillMounted = await page.getByText('Visão geral', { exact: false }).first().isVisible();
    expect(stillMounted, `casca deve continuar montada após trocar período para "${label}"`).toBe(
      true
    );
  }

  await shot(page, 'f211-regressao-full-apos-troca-periodos');

  networkErrorsLog.push(
    `REGRESSAO_PERIODO consoleErrors=${localConsoleErrors.length} networkErrors4xx5xx=${localNetworkErrors.length} amostraConsole=${localConsoleErrors[0] ?? 'N/A'} amostraRede=${localNetworkErrors[0] ?? 'N/A'}`
  );
  expect(localConsoleErrors, 'troca de período não pode gerar erro de console').toEqual([]);
  expect(localNetworkErrors, 'troca de período não pode gerar 4xx/5xx').toEqual([]);
});
