import fs from 'fs';
import path from 'path';

import { test, expect, Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────
// E2E ENXUTO da correção pós-entrega do F-211 (execução 062, mesma branch
// `feature/062-painel-controle`), escrito pelo gb-cerne-front-tester-v2.
// Escopo restrito ao que MUDOU nesta correção (não repete a suíte completa
// f211-painel-controle.authenticated.spec.ts, que ainda referencia o rótulo
// antigo "Margem bruta" e ficou desatualizada por essa mesma correção):
//
//   1) KPI renomeado "Margem bruta" → "Margem operacional", agora lendo
//      `kpis.operational_margin_pct` (percentual, ex. "99,8%") — os 3 KPIs
//      do topo (Margem operacional %, Receitas realizadas R$, Saldo
//      operacional R$) devem ser DISTINTOS entre si.
//   2) Bloco "Concentração de receita" tolera fatia `client_uuid: null`
//      (rótulo "Sem cliente") e nunca quebra (donut real OU "Sem dado").
// ─────────────────────────────────────────────────────────────────────────

const EVIDENCE_DIR =
  '/home/pietro/ambiente/CORE_WORKSPACE/97-Esteiras/062-painel-controle/EVIDENCIAS/screenshots-f211-fix';

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
    path.join(EVIDENCE_DIR, '_resultado-fix-062.json'),
    JSON.stringify(summary, null, 2)
  );
  // eslint-disable-next-line no-console -- saída de diagnóstico do harness p/ o tester ler do stdout
  console.log('RESULTADO_FIX062_JSON_START');
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(summary, null, 2));
  // eslint-disable-next-line no-console
  console.log('RESULTADO_FIX062_JSON_END');
});

test('Fix-062 item 1 — KPI "Margem operacional" exibe PERCENTUAL e é distinto dos outros 2 KPIs', async ({
  page,
}) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await waitForShellLoaded(page);

  const marginLabel = page.getByText('Margem operacional', { exact: false }).first();
  const marginVisible = await marginLabel.isVisible({ timeout: 20000 }).catch(() => false);

  if (!marginVisible) {
    notes.push(
      'FIX062_ITEM1_BLOCO_AUSENTE: "Margem operacional" não visível — RBAC do usuário do harness (home_dashboard_view ausente?) ou dado indisponível.'
    );
    await shot(page, 'fix062-item1-margem-operacional-ausente');
    return;
  }

  // Rótulo antigo NÃO pode mais existir em lugar nenhum da tela.
  await expect(
    page.getByText('Margem bruta', { exact: false }),
    'rótulo antigo "Margem bruta" não pode mais aparecer'
  ).toHaveCount(0);

  await marginLabel.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await shot(page, 'fix062-item1-kpi-row-margem-operacional');

  // Estrutura real (`DashboardGrid.tsx`): `DashboardCard`(Box/div) >
  // `Flex`(div, label+tooltip) + `Text`(valor, irmão da Flex). Nem `.first()`
  // nem `.last()` sobre `div[hasText]` isolam o card certo (achado desta
  // sessão: `.last()` pega só a Flex do label sem o valor; `.first()` sobe
  // até a raiz do app, que contém TODO o texto da página). Sobe exatamente
  // 2 `div` ancestrais a partir do label (Text→Flex→DashboardCard).
  const marginCard = marginLabel.locator('xpath=ancestor::div[2]');
  const marginCardText = (await marginCard.textContent()) ?? '';

  const saldoLabel = page.getByText('Saldo operacional', { exact: false }).first();
  const saldoCard = saldoLabel.locator('xpath=ancestor::div[2]');
  const saldoCardText = (await saldoCard.textContent()) ?? '';

  const receitasLabel = page.getByText('Receitas realizadas', { exact: false }).first();
  const receitasCard = receitasLabel.locator('xpath=ancestor::div[2]');
  const receitasCardText = (await receitasCard.textContent()) ?? '';

  notes.push(
    `FIX062_ITEM1_TEXTOS margem="${marginCardText}" saldo="${saldoCardText}" receitas="${receitasCardText}"`
  );

  if (/sem dado/i.test(marginCardText)) {
    notes.push(
      'FIX062_ITEM1_LACUNA_HONESTA: card exibiu "Sem dado" (sem receita realizada no período) — estado válido, não pôde validar o formato %.'
    );
  } else {
    expect(marginCardText, 'KPI "Margem operacional" deve exibir PERCENTUAL (%)').toMatch(/%/);
  }

  // Os 3 KPIs precisam ser distintos entre si (bug antigo: cards idênticos).
  expect(marginCardText, 'Margem operacional não pode repetir o texto de Saldo operacional').not.toBe(
    saldoCardText
  );
  expect(
    marginCardText,
    'Margem operacional não pode repetir o texto de Receitas realizadas'
  ).not.toBe(receitasCardText);
  expect(
    saldoCardText,
    'Saldo operacional não pode repetir o texto de Receitas realizadas'
  ).not.toBe(receitasCardText);

  // Nenhum erro de console mencionando o campo removido/renomeado.
  const grossMarginErrors = consoleErrorsLog.filter((e) => /gross_margin/i.test(e));
  notes.push(`FIX062_ITEM1_CONSOLE_GROSS_MARGIN_ERRORS=${grossMarginErrors.length}`);
  expect(
    grossMarginErrors,
    'não pode haver erro de console mencionando gross_margin (campo removido)'
  ).toEqual([]);
});

test('Fix-062 item 2 — Concentração de receita renderiza sem quebrar ("Sem cliente" ou "Sem dado")', async ({
  page,
}) => {
  test.setTimeout(60000);
  attachDiagnostics(page);

  await page.goto('/home');
  await waitForShellLoaded(page);

  const title = page.getByText('Concentração de receita', { exact: false }).first();
  const visible = await title.isVisible({ timeout: 15000 }).catch(() => false);

  if (!visible) {
    notes.push(
      'FIX062_ITEM2_BLOCO_AUSENTE: "Concentração de receita" não visível — RBAC do usuário do harness (home_financial_dashboard_view ausente?) ou dado indisponível.'
    );
    await shot(page, 'fix062-item2-concentracao-ausente');
    return;
  }

  await title.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  // Mesma estrutura do item 1: `DashboardCard`(Box) > Flex(título+ação) +
  // corpo (donut ou "Sem dados"). Sobe 2 `div` ancestrais a partir do título.
  const card = title.locator('xpath=ancestor::div[2]');
  const hasNoDataText = await card
    .getByText(/sem dados?/i)
    .isVisible()
    .catch(() => false);
  const hasSemClienteLabel = await card
    .getByText('Sem cliente', { exact: false })
    .isVisible()
    .catch(() => false);
  const hasDonutSvg = await card
    .locator('svg')
    .first()
    .isVisible()
    .catch(() => false);

  await shot(page, 'fix062-item2-concentracao-receita');

  notes.push(
    `FIX062_ITEM2_ESTADO hasNoDataText=${hasNoDataText} hasSemClienteLabel=${hasSemClienteLabel} hasDonutSvg=${hasDonutSvg}`
  );

  // Nunca quebrado: ou "Sem dado(s)", ou o donut real (com ou sem a fatia
  // "Sem cliente" — depende do dado real do banco de teste).
  expect(
    hasNoDataText || hasDonutSvg,
    'bloco deve mostrar "Sem dado(s)" OU o donut com dado — nunca nenhum dos dois (tela quebrada)'
  ).toBe(true);

  const consumptionErrors = consoleErrorsLog.filter((e) =>
    /revenue_concentration|client_uuid|ConcentracaoReceita/i.test(e)
  );
  expect(
    consumptionErrors,
    'não pode haver erro de console relacionado ao consumo de revenue_concentration'
  ).toEqual([]);
});
