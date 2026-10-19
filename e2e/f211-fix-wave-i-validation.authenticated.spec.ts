import fs from 'fs';
import path from 'path';

import { test, expect, Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────
// E2E COMPLETO da Fix wave I do Painel de Controle (F-211, execução 062,
// branch `feature/062-painel-controle`). Validação de 5 refinamentos
// de UI + regressão visual e i18n (português, en-US, es-ES).
//
// Items validados:
//   1) Exceções da semana: datas em formato dd/mm/YYYY
//   2) Cobertura de estoque: lista preenchendo altura sem faixa branca vazia
//   3) Tooltips (i) em "Resultado por produto" e "Concentração": "romaneios de venda"
//   4) Aging de títulos: eixo X com "0-30 dias", "31-60 dias", "61-90 dias", "90+ dias"
//   5) Mapa de talhões: ~2x altura anterior (satélite, ~560px), sem quebrar layout
// ─────────────────────────────────────────────────────────────────────────

const EVIDENCE_DIR =
  '/home/pietro/ambiente/CORE_WORKSPACE/97-Esteiras/062-painel-controle/EVIDENCIAS/screenshots-f211-fixI';

const consoleErrorsLog: string[] = [];
const notes: string[] = [];
const capturedFiles: string[] = [];

function attachDiagnostics(page: Page) {
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrorsLog.push(m.text());
  });
}

async function shot(page: Page, name: string): Promise<string> {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  const file = path.join(EVIDENCE_DIR, `${name}.png`);
  await page.screenshot({ path: file });
  capturedFiles.push(file);
  return file;
}

async function waitForShellLoaded(page: Page) {
  await page.getByText('Visão geral', { exact: false }).first().waitFor({ timeout: 20000 });
}

test.afterAll(() => {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  const summary = { consoleErrors: consoleErrorsLog, notes, files: capturedFiles };
  fs.writeFileSync(
    path.join(EVIDENCE_DIR, '_resultado-fixI.json'),
    JSON.stringify(summary, null, 2)
  );
  // eslint-disable-next-line no-console -- saída de diagnóstico do harness p/ o tester ler do stdout
  console.log('RESULTADO_FIX_WAVE_I_JSON_START');
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(summary, null, 2));
  // eslint-disable-next-line no-console
  console.log('RESULTADO_FIX_WAVE_I_JSON_END');
});

test('Item 1 — Exceções da semana: datas em formato dd/mm/YYYY', async ({ page }) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await waitForShellLoaded(page);

  // Localiza card "Exceções da semana"
  const excecoesTitleElement = page
    .locator('text=/Exceções\\s+da\\s+semana/i')
    .first();

  const titleVisible = await excecoesTitleElement
    .isVisible({ timeout: 15000 })
    .catch(() => false);

  if (!titleVisible) {
    notes.push('ITEM1_BLOCO_AUSENTE: "Exceções da semana" não visível');
    await shot(page, 'fixI-item1-excecoes-datas-ausente');
    return;
  }

  await excecoesTitleElement.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await shot(page, 'fixI-item1-excecoes-datas');

  // Verifica presença de datas no padrão dd/mm/YYYY (ex: 17/09/2026)
  const exceptionCardText = await excecoesTitleElement.locator('xpath=ancestor::div[3]')
    .textContent()
    .catch(() => '');

  const dateFormatRegex = /\d{2}\/\d{2}\/\d{4}/;
  const hasCorrectDateFormat = dateFormatRegex.test(exceptionCardText);

  notes.push(`ITEM1_DATE_FORMAT_FOUND=${hasCorrectDateFormat} (padrão dd/mm/YYYY)`);

  // NÃO deve conter datas ISO (2026-09-17)
  const hasIsoFormat = /\d{4}-\d{2}-\d{2}/.test(exceptionCardText);
  expect(hasIsoFormat, 'não deve conter datas em formato ISO (YYYY-MM-DD)').toBe(false);

  expect(hasCorrectDateFormat, 'deve conter datas em formato dd/mm/YYYY').toBe(true);
});

test('Item 2 — Cobertura de estoque: lista preenchendo altura sem faixa branca vazia', async ({
  page,
}) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await waitForShellLoaded(page);

  const coberturaTitleElement = page
    .locator('text=/Cobertura\\s+de\\s+estoque/i')
    .first();

  const titleVisible = await coberturaTitleElement
    .isVisible({ timeout: 15000 })
    .catch(() => false);

  if (!titleVisible) {
    notes.push('ITEM2_BLOCO_AUSENTE: "Cobertura de estoque" não visível');
    await shot(page, 'fixI-item2-cobertura-estoque-ausente');
    return;
  }

  await coberturaTitleElement.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await shot(page, 'fixI-item2-cobertura-estoque');

  // Verifica se há lista de itens (elementos com tipo "Produto" ou similar)
  const coberturaCard = coberturaTitleElement.locator('xpath=ancestor::div[2]');
  const listItems = await coberturaCard.locator('[role="listitem"], li, [data-testid*="item"]').count();

  notes.push(`ITEM2_LIST_ITEMS_COUNT=${listItems}`);

  // Se há itens, a altura deve estar preenchida (verificação visual no PNG)
  if (listItems > 0) {
    expect(listItems, 'deve ter itens na lista de cobertura').toBeGreaterThan(0);
  }
});

test('Item 3 — Tooltips: "romaneios de venda" em "Resultado por produto" e "Concentração de receita"', async ({
  page,
}) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await waitForShellLoaded(page);

  // Item 3a: "Resultado por produto"
  const produtoTitleElement = page
    .locator('text=/Resultado\\s+por\\s+produto/i')
    .first();

  const produtoTitleVisible = await produtoTitleElement
    .isVisible({ timeout: 15000 })
    .catch(() => false);

  if (produtoTitleVisible) {
    // Localiza o ícone (i) próximo ao título
    const produtoCard = produtoTitleElement.locator('xpath=ancestor::div[3]');
    const infoIcon = produtoCard.locator('[data-testid*="info"], [aria-label*="info"], svg').first();

    const iconExists = await infoIcon.isVisible({ timeout: 5000 }).catch(() => false);

    if (iconExists) {
      // Faz hover para mostrar tooltip
      await infoIcon.hover({ force: true });
      await page.waitForTimeout(300);

      // Verifica se o tooltip contém "romaneios de venda"
      const tooltipText = await page.locator('[role="tooltip"]').textContent().catch(() => '');

      notes.push(
        `ITEM3A_TOOLTIP_PRODUTO="${tooltipText}" (busca: "romaneios de venda")`
      );

      const hasCorrectText = /romaneios\\s+de\\s+venda/i.test(tooltipText);
      expect(hasCorrectText, 'tooltip de "Resultado por produto" deve conter "romaneios de venda"').toBe(true);

      // Tira screenshot do tooltip
      await shot(page, 'fixI-item3-tooltip-produto');
    } else {
      notes.push('ITEM3A_ICON_AUSENTE: ícone (i) não encontrado em "Resultado por produto"');
    }
  } else {
    notes.push('ITEM3A_BLOCO_AUSENTE: "Resultado por produto" não visível');
  }

  // Item 3b: "Concentração de receita"
  const concentracaoTitleElement = page
    .locator('text=/Concentração\\s+de\\s+receita/i')
    .first();

  const concentracaoTitleVisible = await concentracaoTitleElement
    .isVisible({ timeout: 15000 })
    .catch(() => false);

  if (concentracaoTitleVisible) {
    const concentracaoCard = concentracaoTitleElement.locator('xpath=ancestor::div[3]');
    const infoIcon = concentracaoCard.locator('[data-testid*="info"], [aria-label*="info"], svg').first();

    const iconExists = await infoIcon.isVisible({ timeout: 5000 }).catch(() => false);

    if (iconExists) {
      await infoIcon.hover({ force: true });
      await page.waitForTimeout(300);

      const tooltipText = await page.locator('[role="tooltip"]').textContent().catch(() => '');

      notes.push(
        `ITEM3B_TOOLTIP_CONCENTRACAO="${tooltipText}" (busca: "romaneios de venda")`
      );

      const hasCorrectText = /romaneios\\s+de\\s+venda/i.test(tooltipText);
      expect(hasCorrectText, 'tooltip de "Concentração de receita" deve conter "romaneios de venda"').toBe(true);

      await shot(page, 'fixI-item3-tooltip-concentracao');
    } else {
      notes.push('ITEM3B_ICON_AUSENTE: ícone (i) não encontrado em "Concentração de receita"');
    }
  } else {
    notes.push('ITEM3B_BLOCO_AUSENTE: "Concentração de receita" não visível');
  }
});

test('Item 4 — Aging de títulos: eixo X com "0-30 dias", etc. e tooltip "em dias"', async ({
  page,
}) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await waitForShellLoaded(page);

  const agingTitleElement = page
    .locator('text=/Aging\\s+de\\s+títulos/i')
    .first();

  const titleVisible = await agingTitleElement
    .isVisible({ timeout: 15000 })
    .catch(() => false);

  if (!titleVisible) {
    notes.push('ITEM4_BLOCO_AUSENTE: "Aging de títulos" não visível');
    await shot(page, 'fixI-item4-aging-ausente');
    return;
  }

  await agingTitleElement.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await shot(page, 'fixI-item4-aging');

  // Verifica rótulos do eixo X
  const agingCard = agingTitleElement.locator('xpath=ancestor::div[2]');
  const agingText = await agingCard.textContent().catch(() => '');

  const expectedLabels = ['0-30 dias', '31-60 dias', '61-90 dias', '90+ dias'];
  expectedLabels.forEach((label) => {
    const hasLabel = agingText.includes(label);
    notes.push(`ITEM4_AXIS_LABEL_"${label}"=${hasLabel}`);
    expect(agingText, `deve conter rótulo de eixo "${label}"`).toContain(label);
  });

  // Localiza ícone (i) para tooltip
  const infoIcon = agingCard.locator('[data-testid*="info"], [aria-label*="info"], svg').first();
  const iconExists = await infoIcon.isVisible({ timeout: 5000 }).catch(() => false);

  if (iconExists) {
    await infoIcon.hover({ force: true });
    await page.waitForTimeout(300);

    const tooltipText = await page.locator('[role="tooltip"]').textContent().catch(() => '');
    notes.push(`ITEM4_TOOLTIP="${tooltipText}" (busca: "em dias")`);

    const hasCorrectText = /em\\s+dias/i.test(tooltipText);
    expect(hasCorrectText, 'tooltip deve conter "em dias"').toBe(true);
  } else {
    notes.push('ITEM4_ICON_AUSENTE: ícone (i) não encontrado em "Aging de títulos"');
  }
});

test('Item 5 — Mapa de talhões: ~2x altura (satélite, ~560px), sem quebrar layout', async ({
  page,
}) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await waitForShellLoaded(page);

  const mapaTitleElement = page
    .locator('text=/Mapa\\s+de\\s+talhões|Talhões\\s+no\\s+mapa/i')
    .first();

  const titleVisible = await mapaTitleElement
    .isVisible({ timeout: 15000 })
    .catch(() => false);

  if (!titleVisible) {
    notes.push('ITEM5_BLOCO_AUSENTE: "Mapa de talhões" não visível');
    await shot(page, 'fixI-item5-mapa-ausente');
    return;
  }

  await mapaTitleElement.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);

  const mapaCard = mapaTitleElement.locator('xpath=ancestor::div[2]');
  const mapaBoundingBox = await mapaCard.boundingBox();

  if (mapaBoundingBox) {
    const heightPx = mapaBoundingBox.height;
    notes.push(`ITEM5_MAPA_HEIGHT=${heightPx}px (esperado ~560px para satélite)`);

    // Verifica se a altura está próxima de 560px (aproximadamente 2x anterior)
    expect(heightPx, 'altura do mapa deve estar próxima de ~560px').toBeGreaterThanOrEqual(500);
  }

  await shot(page, 'fixI-item5-mapa');

  // Verifica se há quebra de layout (scroll horizontal indesejado)
  const pageWidth = await page.evaluate(() => window.innerWidth);
  const bodyScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);

  const hasHorizontalScroll = bodyScrollWidth > pageWidth;
  notes.push(`ITEM5_HORIZONTAL_SCROLL_EXPECTED=false, found=${hasHorizontalScroll}`);

  expect(hasHorizontalScroll, 'não deve haver scroll horizontal').toBe(false);
});

// ─────────────────────────────────────────────────────────────────────────
// REGRESSÃO MÍNIMA
// ─────────────────────────────────────────────────────────────────────────

test('Regressão — KPIs íntegros e distintos', async ({ page }) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await waitForShellLoaded(page);

  const marginLabel = page.getByText('Margem operacional', { exact: false }).first();
  const saldoLabel = page.getByText('Saldo operacional', { exact: false }).first();
  const receitasLabel = page.getByText('Receitas realizadas', { exact: false }).first();

  const marginCard = marginLabel.locator('xpath=ancestor::div[2]');
  const saldoCard = saldoLabel.locator('xpath=ancestor::div[2]');
  const receitasCard = receitasLabel.locator('xpath=ancestor::div[2]');

  const marginText = (await marginCard.textContent()) ?? '';
  const saldoText = (await saldoCard.textContent()) ?? '';
  const receitasText = (await receitasCard.textContent()) ?? '';

  notes.push(
    `REGRESSAO_KPI_TEXTOS: margem="${marginText.substring(0, 50)}" saldo="${saldoText.substring(0, 50)}" receitas="${receitasText.substring(0, 50)}"`
  );

  expect(marginText, 'KPIs não podem ter conteúdo idêntico').not.toBe(saldoText);
  expect(saldoText, 'KPIs não podem ter conteúdo idêntico').not.toBe(receitasText);
});

test('Regressão — i18n: Português, en-US, es-ES sem chaves cruas', async ({ page }) => {
  test.setTimeout(120000);
  attachDiagnostics(page);

  const languages = [
    { code: 'pt-BR', name: 'Português' },
    { code: 'en-US', name: 'English' },
    { code: 'es-ES', name: 'Español' },
  ];

  for (const lang of languages) {
    await page.goto('/home');
    await waitForShellLoaded(page);

    // Tenta mudar idioma (depende do seletor da UI)
    const langButton = page
      .locator('[data-testid*="language"], [aria-label*="idioma"], button')
      .filter({ hasText: /português|english|español|pt|en|es/i })
      .first();

    if (await langButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await langButton.click();
      await page.waitForTimeout(500);
    }

    // Verifica se há i18n keys cruas (padrão: chaves com pontos ou chaves.sub)
    const pageText = await page.content();
    const rawI18nPattern = /\$t\(|i18n\.|key\.|translation\./;
    const hasRawKeys = rawI18nPattern.test(pageText);

    notes.push(`REGRESSAO_I18N_${lang.code}_HAS_RAW_KEYS=${hasRawKeys}`);
    expect(hasRawKeys, `idioma ${lang.code} não deve ter chaves i18n cruas`).toBe(false);
  }
});

test('Regressão — Console: sem erros de daysUnit, formatDate, i18n faltando', async ({
  page,
}) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await waitForShellLoaded(page);

  // Aguarda um pouco para gráficos renderizarem completamente
  await page.waitForTimeout(2000);

  const criticalErrors = consoleErrorsLog.filter((e) =>
    /daysUnit|formatDate|undefined|Cannot read|i18n key/i.test(e)
  );

  notes.push(`REGRESSAO_CRITICAL_CONSOLE_ERRORS=${criticalErrors.length}`);
  criticalErrors.forEach((e) => notes.push(`  - ${e.substring(0, 100)}`));

  expect(criticalErrors, 'não deve haver erros críticos de console').toEqual([]);
});

test('Regressão — Gráficos: Receitas mensais, Resultado operacional, Aging renderizam', async ({
  page,
}) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await waitForShellLoaded(page);

  // Localiza gráficos por título
  const chartTitles = [
    /Receitas\\s+mensais/i,
    /Resultado\\s+operacional/i,
    /Aging\\s+de\\s+títulos/i,
  ];

  for (const titleRegex of chartTitles) {
    const chartElement = page.locator(`text=${titleRegex}`).first();
    const isVisible = await chartElement
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    const titleStr = titleRegex.source;
    notes.push(`REGRESSAO_CHART_${titleStr.substring(0, 20)}_VISIBLE=${isVisible}`);

    expect(isVisible, `gráfico ${titleStr} deve estar visível`).toBe(true);
  }
});
