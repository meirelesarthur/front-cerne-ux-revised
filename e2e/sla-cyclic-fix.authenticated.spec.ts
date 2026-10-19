import { test, expect } from '@playwright/test';

test.describe('SLA Report Filter — Bug Fix: Cyclic Dependency', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
  });

  test('Preencher datas e clicar "Gerar" NÃO lança "Cyclic dependency"', async ({
    page,
  }) => {
    // Navegar para Relatório SLA
    await page.goto('/relatorios/suprimentos');
    await expect(page).not.toHaveURL(/\/login/);

    // Aguardar que o formulário renderize
    const pageTitle = page.locator('text=/Relatório SLA|Suprimentos/i');
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    // Localizar inputs de data (data-testid ou placeholder)
    const startDateInput = page
      .locator('input[placeholder*="data inicial" i], input[data-testid*="start_date"]')
      .first();
    const endDateInput = page
      .locator('input[placeholder*="data final" i], input[data-testid*="end_date"]')
      .first();

    // Preencher com datas válidas (diferença de 5 dias)
    await startDateInput.fill('08/01/2026');
    await endDateInput.fill('08/05/2026');

    // Localizar e clicar no botão "Gerar"
    const generateButton = page.locator('button:has-text("Gerar"), button[data-action="generate"]');
    if (await generateButton.isVisible()) {
      await generateButton.click();

      // Aguardar um pouco para a validação do form ocorrer
      await page.waitForTimeout(2000);

      // Verificar que NÃO há erro de "Cyclic dependency" no console
      const hasCyclicError = consoleErrors.some((err) =>
        err.includes('Cyclic dependency')
      );
      expect(hasCyclicError).toBe(false);

      // Erro 422/500 do backend é aceitável (negócio). Cyclic é proibido (bug).
    }

    expect(consoleErrors.length).toBe(0);
  });
});
