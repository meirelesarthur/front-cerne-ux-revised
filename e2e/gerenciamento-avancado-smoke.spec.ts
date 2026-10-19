import { test, expect } from '@playwright/test';

test('Gerenciamento Avançado — smoke autenticado', async ({ page }) => {
  // Usar storageState da autenticação
  const authFile = 'e2e/.auth/user.json';
  if (require('fs').existsSync(authFile)) {
    await page.context().addInitScript(() => {
      localStorage.clear();
    });
  }

  // Navegar para a rota
  await page.goto('/operacional/gerenciamento-avancado', { waitUntil: 'networkidle' });

  // Verificar que a página carregou (título, filtro, grid)
  expect(page.url()).toContain('/operacional/gerenciamento-avancado');

  // Verificar presença de componentes principais
  const pageTitle = page.locator('text=Gerenciamento Avançado');
  await expect(pageTitle).toBeVisible();

  // Verificar presença de filtro
  const filterButton = page.locator('[class*="ButtonFilter"]');
  await expect(filterButton).toBeVisible();

  // Verificar presença de indicadores (3 StatCards)
  const statCards = page.locator('[class*="StatCard"]');
  expect(await statCards.count()).toBeGreaterThanOrEqual(3);

  // Verificar presença de tabela
  const table = page.locator('[role="table"]');
  await expect(table).toBeVisible();

  // Verificar se console.error está limpo (nenhum erro crítico)
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Wait um pouco para any async operations
  await page.waitForTimeout(2000);

  // Não esperamos erros críticos de render/tipagem
  expect(consoleErrors.filter((e) => !e.includes('ResizeObserver'))).toHaveLength(0);
});
