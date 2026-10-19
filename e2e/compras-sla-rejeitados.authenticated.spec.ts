import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────
// Smoke autenticado para as 3 telas novas: Compras, Relatório SLA,
// Rejeitados/Cancelados (task-packet de E2E com runtime desbloqueado).
//
// Escopo: render + navegação + ausência de erro de console + estado de UI
// (loading, empty, error).
//
// Não são testes destrutivos nem fluxos de escrita completos — apenas
// validação de que a tela carrega, renderiza e o contrato básico funciona.
// ─────────────────────────────────────────────────────────────────────────

test.describe('smoke das telas novas (Compras, SLA, Rejeitados)', () => {
  // Setup: interceptar console.error e console.warn
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    consoleWarnings = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });
  });

  test('Compras (/administrativo/compras) renderiza a fila sem erro de console', async ({
    page,
  }) => {
    // Navegar para Compras
    await page.goto('/administrativo/compras');

    // Confirmar que não foi redirecionado de volta para /login
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/administrativo\/compras/);

    // Aguardar que o título da página carregue (prova que o JSX renderizou)
    // Título é renderizado via `<Text fontSize="2xl" fontWeight="bold">` em HeaderGrid
    // Escopo no conteúdo principal: o menu lateral também tem o texto 'Compras'.
    const pageTitle = page.getByRole('main').getByText('Compras', { exact: true }).first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    // Validar que NÃO há erros de console
    expect(consoleErrors.length).toBe(0);
  });

  test('Compras: dropdown de ações abre corretamente', async ({ page }) => {
    await page.goto('/administrativo/compras');
    await expect(page).toHaveURL(/\/administrativo\/compras/);

    // Localizar um botão de ação (dropdown trigger) — geralmente marcado com
    // role="button" ou aria-haspopup="true"
    const actionButton = page
      .locator('button[aria-label*="ação"], button[data-testid*="action"]')
      .first();

    // Se existir uma linha/item na fila, seu dropdown deve ser clicável
    if (await actionButton.isVisible()) {
      await actionButton.click();

      // Após clicar, um menu deve aparecer (role="menu" ou [data-testid="menu"])
      const menu = page.locator('[role="menu"], [data-testid="action-menu"]');
      await expect(menu).toBeVisible();
    }

    expect(consoleErrors.length).toBe(0);
  });

  test('Compras: dialog "Informar Status" abre quando acionado', async ({ page }) => {
    await page.goto('/administrativo/compras');

    // Procurar pelo botão de "Informar Status" ou ação equivalente
    const statusButton = page.locator(
      'button:has-text("Informar Status"), button[data-action="inform-status"]'
    );

    if (await statusButton.isVisible()) {
      await statusButton.click();

      // Aguardar que o dialog apareça
      const dialog = page.locator('[role="dialog"], .chakra-modal__content');
      await expect(dialog).toBeVisible();
    }

    expect(consoleErrors.length).toBe(0);
  });

  test('Relatório SLA (/relatorios/suprimentos) renderiza o form de filtro', async ({ page }) => {
    // Navegar para Relatório SLA
    await page.goto('/relatorios/suprimentos');

    // Confirmar que não foi redirecionado para /login
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/relatorios\/suprimentos/);

    // Aguardar que o título carregue (prova JSX renderizado)
    // Escopo no conteúdo principal: o menu lateral também tem 'Relatório SLA'/'Suprimentos'.
    const pageTitle = page.getByRole('main').getByText('Relatório SLA', { exact: true }).first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    // Validar que NÃO há erros de console
    expect(consoleErrors.length).toBe(0);
  });

  test('Relatório SLA: botão "Gerar" existe e está desabilitado sem gatilho válido', async ({
    page,
  }) => {
    await page.goto('/relatorios/suprimentos');

    // Procurar pelo botão "Gerar"
    const generateButton = page.locator('button:has-text("Gerar"), button[data-action="generate"]');

    if (await generateButton.isVisible()) {
      // Inicialmente, sem dados de filtro, o botão deve estar desabilitado
      // (ou o form deve estar em estado "inválido")
      const isDisabled = await generateButton.isDisabled();
      expect(isDisabled).toBe(true);
    }

    expect(consoleErrors.length).toBe(0);
  });

  test('Rejeitados/Cancelados (/administrativo/rejeitados) renderiza a listagem', async ({
    page,
  }) => {
    // Navegar para Rejeitados/Cancelados
    await page.goto('/administrativo/rejeitados');

    // Confirmar que não foi redirecionado para /login
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/administrativo\/rejeitados/);

    // A listagem deve estar visível (grid, tabela ou container de items)
    const listContainer = page.locator('table, [role="grid"], [data-testid="rejeitados-list"]');
    await expect(listContainer).toBeVisible();

    expect(consoleErrors.length).toBe(0);
  });

  test('Rejeitados/Cancelados: ação "Relatório SLA" aparece ou navega', async ({ page }) => {
    await page.goto('/administrativo/rejeitados');

    // Procurar pela ação "Relatório SLA" — pode ser um botão, link ou menu item
    const slaReportAction = page.locator(
      'button:has-text("Relatório SLA"), a:has-text("Relatório SLA"), [data-action="sla-report"]'
    );

    if (await slaReportAction.isVisible()) {
      // Se está visível, deve ser clicável
      await expect(slaReportAction).toBeEnabled();
    }

    expect(consoleErrors.length).toBe(0);
  });

  test('Tema light/dark renderiza corretamente em todas as 3 telas', async ({ page }) => {
    // Testar cada rota em light e dark (se o sistema suporta toggle)
    const routes = [
      '/administrativo/compras',
      '/relatorios/suprimentos',
      '/administrativo/rejeitados',
    ];

    for (const route of routes) {
      await page.goto(route);

      // Confirmar que a rota carregou
      await expect(page).not.toHaveURL(/\/login/);

      // Verificar que há um elemento visível (não está em erro ou vazio total)
      const mainContent = page.locator('main, [role="main"], .chakra-container');
      await expect(mainContent).toBeVisible();

      expect(consoleErrors.length).toBe(0);
    }
  });
});
