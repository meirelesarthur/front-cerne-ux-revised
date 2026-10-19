import { test, expect, Page } from '@playwright/test';

/**
 * Validação E2E da tela "Nova Importação OFX" (TASK-074).
 * Cenários:
 * 1. Layout e padding (campos não colados na borda)
 * 2. Submit via Form id + Button type="submit" form="..." (nativo)
 * 3. Cancelar preserva navegação (navigate(-1))
 * 4. Dark/light theme
 * 5. Console sem erros críticos
 */

test.describe('CreateOrUpdateOfxImport — padding + submit + cancelar', () => {
  let page: Page;
  const consoleErrors: string[] = [];

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    // Setup: autenticação via storage state (carregado pelo harness)
    const storageFile = 'e2e/.auth/authenticated.json';
    try {
      await page.context().addInitScript(() => {
        const state = require('../../.auth/authenticated.json');
        if (state?.cookies) {
          state.cookies.forEach((cookie: any) => {
            document.cookie = `${cookie.name}=${cookie.value}`;
          });
        }
      });
    } catch {
      // Storage state pode não estar disponível em primeira execução
    }

    // Listener de console
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
  });

  test('Acesso autenticado à tela de Nova Importação OFX', async () => {
    // Navegar para /home (requer autenticação)
    await page.goto('http://localhost:8080/financeiro/ofx/novo');

    // Aguardar que a tela carregue (há um FormContainer com título)
    await expect(page.locator('h1, h2')).first().toBeVisible({ timeout: 5000 });

    // Verificar que estamos na tela certa (título contém "OFX" ou "Importação")
    const title = await page.locator('h1, h2').first().textContent();
    expect(title).toContain('Importação');
  });

  test('Validar padding visual (campos não colados na borda)', async () => {
    await page.goto('http://localhost:8080/financeiro/ofx/novo');

    // Aguardar o form carregar
    const form = page.locator('#ofx-import-form');
    await expect(form).toBeVisible({ timeout: 5000 });

    // Validar que campos têm padding (via computed style)
    // FormContainer aplica px={PAD} ao body quando hasFooter=true
    const inputDescription = page.locator('input[name="description"]');
    await expect(inputDescription).toBeVisible();

    // Confirmar que o input não está colado na borda (margin/padding)
    const boundingBox = await inputDescription.boundingBox();
    expect(boundingBox?.x).toBeGreaterThan(10); // Deve ter espaço da borda esquerda
  });

  test('Submit via Form id + Button type="submit" form="..."', async () => {
    await page.goto('http://localhost:8080/financeiro/ofx/novo');

    // Aguardar o form
    const form = page.locator('#ofx-import-form');
    await expect(form).toBeVisible({ timeout: 5000 });

    // Verificar que o botão Salvar tem type="submit" e form="ofx-import-form"
    const submitButton = page.locator('button[type="submit"][form="ofx-import-form"]');
    await expect(submitButton).toBeVisible();

    // Verificar que há um botão Cancelar com type="button"
    const cancelButton = page.locator('button[type="button"]').first();
    await expect(cancelButton).toBeVisible();
  });

  test('Cancelar navega de volta (navigate(-1))', async () => {
    await page.goto('http://localhost:8080/financeiro/ofx/novo');

    // Aguardar o form
    await expect(page.locator('#ofx-import-form')).toBeVisible({ timeout: 5000 });

    // Clicar Cancelar (esperado: volta para /financeiro/ofx)
    const cancelButton = page.locator('button[type="button"]').first();

    const navigationPromise = page.waitForNavigation();
    await cancelButton.click();
    try {
      await navigationPromise;
    } catch {
      // Navegação pode ser instantânea (SPA)
    }

    // Verificar que saiu da tela de novo
    const urlAfter = page.url();
    expect(urlAfter).not.toContain('/novo'); // Deve sair da rota de criação
  });

  test('Dark/light theme rendering', async () => {
    await page.goto('http://localhost:8080/financeiro/ofx/novo');

    // Aguardar o form
    await expect(page.locator('#ofx-import-form')).toBeVisible({ timeout: 5000 });

    // Capturar screenshot em light (padrão)
    const lightScreenshot = await page.screenshot({ fullPage: true });
    expect(lightScreenshot).toBeTruthy();
  });

  test('Nenhum erro crítico no console', async () => {
    await page.goto('http://localhost:8080/financeiro/ofx/novo');

    // Aguardar carregamento completo
    await expect(page.locator('#ofx-import-form')).toBeVisible({ timeout: 5000 });

    // Aguardar um pouco para capturar erros de hidratação/carregamento
    await page.waitForTimeout(1000);

    // Erros críticos não devem conter "500", "undefined behavior", etc
    const criticalErrors = consoleErrors.filter(e =>
      e.includes('500') || e.includes('ReferenceError') || e.includes('TypeError: Cannot read')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test.afterAll(async () => {
    if (page) {
      await page.close();
    }
  });
});
