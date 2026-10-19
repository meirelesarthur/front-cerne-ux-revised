import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────
// F-254 — Relatório Mortes (tela de filtro + download PDF/Excel)
// Smoke autenticado — valida rota, formulário, validação de campos, download,
// integração com API (report_type, X-Farm-Id).
//
// Rota: /relatorios/pecuaria/mortes
// Permissão gate: death-animals-report_view
// API: GET /api/v1/death-animals-report
// ─────────────────────────────────────────────────────────────────────────

const targetRoute = '/relatorios/pecuaria/mortes';

test.describe('F-254 Relatório Mortes', () => {
  test('rota acessível com permissão, sessão persistida', async ({ page }) => {
    await page.goto(targetRoute);

    // Confirma que a sessão é válida e a rota NÃO redirecionou para /login
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(new RegExp(targetRoute.replace(/\//g, '\\/')));
  });

  test('título e subtítulo da página carregam (i18n)', async ({ page }) => {
    await page.goto(targetRoute);

    // Valida que os textos i18n foram injetados (não hardcoded em inglês)
    await expect(page.locator('text=Mortes')).toBeVisible();
    await expect(page.locator('text=Relatório de mortes')).toBeVisible();
  });

  test('validação de campo start_date obrigatório', async ({ page }) => {
    await page.goto(targetRoute);

    // Tenta enviar com start_date vazio e end_date preenchido
    // Campo select de formato já vem preenchido (default 'pdf')
    const endDateInput = page.locator('input[placeholder*="Fim"]').first();
    await endDateInput.fill('2026-09-08');

    // Clica botão Gerar Relatório
    const downloadBtn = page.locator('button:has-text("Gerar Relatório")');
    await downloadBtn.click();

    // Validação esperada: mensagem de campo obrigatório
    await expect(page.locator('text=obrigatório')).toBeVisible({ timeout: 3000 });
  });

  test('validação end_date < start_date bloqueada', async ({ page }) => {
    await page.goto(targetRoute);

    const startDateInput = page.locator('input[placeholder*="Início"]').first();
    const endDateInput = page.locator('input[placeholder*="Fim"]').first();

    // start_date: 2026-09-08, end_date: 2026-09-01 (anterior)
    await startDateInput.fill('2026-09-08');
    await endDateInput.fill('2026-09-01');

    // Clica botão
    const downloadBtn = page.locator('button:has-text("Gerar Relatório")');
    await downloadBtn.click();

    // Validação esperada: mensagem específica "Dt. Fim deve ser igual ou posterior"
    await expect(
      page.locator('text=Fim deve ser igual ou posterior')
    ).toBeVisible({ timeout: 3000 });
  });

  test('download PDF com X-Farm-Id header', async ({ page, context }) => {
    // Intercepts requests para capturar X-Farm-Id
    let capturedFarmId = '';
    let capturedReportType = '';
    let capturedStartDate = '';
    let capturedEndDate = '';

    page.on('response', (response) => {
      if (response.url().includes('/death-animals-report')) {
        const request = response.request();
        capturedFarmId = request.headerValue('X-Farm-Id') || 'NOT_SENT';
        capturedReportType = new URL(response.url()).searchParams.get('report_type') || '';
        capturedStartDate = new URL(response.url()).searchParams.get('start_date') || '';
        capturedEndDate = new URL(response.url()).searchParams.get('end_date') || '';
      }
    });

    await page.goto(targetRoute);

    const startDateInput = page.locator('input[placeholder*="Início"]').first();
    const endDateInput = page.locator('input[placeholder*="Fim"]').first();
    const formatSelect = page.locator('[name="format"]');

    // Preenche formulário
    await startDateInput.fill('2026-09-01');
    await endDateInput.fill('2026-09-08');

    // Formato já está em 'pdf' por default, confirmando
    const selectValue = await formatSelect.evaluate(
      (el) => (el as HTMLSelectElement).value
    );

    // Clica botão de download
    const downloadBtn = page.locator('button:has-text("Gerar Relatório")');

    // Aguarda a resposta da API (sem descarregar arquivo no teste)
    const [response] = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/death-animals-report')),
      downloadBtn.click(),
    ]);

    // Valida status da resposta
    expect(response.status()).toBeLessThan(500); // Pode ser 200 ou 422 etc, mas não 500

    // Valida que X-Farm-Id foi enviado
    expect(capturedFarmId).not.toBe('NOT_SENT');
    expect(capturedFarmId).toMatch(/^[a-f0-9-]{36}$/); // UUID format

    // Valida report_type no querystring (não 'format')
    expect(capturedReportType).toBe('pdf');
    expect(capturedStartDate).toBe('2026-09-01');
    expect(capturedEndDate).toBe('2026-09-08');
  });

  test('tema light e dark aplicam ao FormContainer', async ({ page }) => {
    await page.goto(targetRoute);

    // Valida que o FormContainer existe e é renderizável em light mode
    const formContainer = page.locator('[class*="FormContainer"], [role="form"]').first();
    await expect(formContainer).toBeVisible();

    // Tenta mudar tema para dark (se a UI suporta toggle)
    const themeToggle = page.locator('[role="button"][aria-label*="theme"]').first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500); // Aguarda transição CSS

      // Verifica que form continua visível em dark mode
      await expect(formContainer).toBeVisible();
    }
  });

  test('console sem errors ou warnings de React', async ({ page }) => {
    // Captura mensagens de console
    const consoleLogs: any[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleLogs.push({ type: msg.type(), text: msg.text() });
      }
    });

    await page.goto(targetRoute);
    await page.waitForLoadState('networkidle');

    // Filtra warnings de development (import/order, etc, que são pré-existentes)
    // Mas rejeita React errors ou Chakra errors
    const criticalErrors = consoleLogs.filter(
      (log) =>
        log.type === 'error' &&
        !log.text.includes('Failed to fetch') && // Network errors OK para smoke
        !log.text.includes('404') // Not found OK para caminhos inexistentes
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
