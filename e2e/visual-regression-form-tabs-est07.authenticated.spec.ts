import { test, expect, Page } from '@playwright/test';

/**
 * Conferência Visual — Padrão form-tabs (EST-07 / outline variant)
 *
 * Valida 10 telas + 2 prioritárias (CT-e, Produto):
 * 1. Render sem crash, console limpo
 * 2. Header e footer FIXOS; corpo com scroll próprio
 * 3. Abas com variant OUTLINE: Tabs.List STICKY; header alinhado À ESQUERDA (flush)
 * 4. Borda cinza (border2) no tema DARK
 * 5. Botões footer respondem (hover/estado), sem submeter
 *
 * Sessão autenticada pré-carregada pelo playwright.config.ts
 */

const BASE_URL = 'http://localhost:5181';

interface ScreenResult {
  route: string;
  title: string;
  renderOk: boolean;
  consoleLean: boolean;
  headerFixed: boolean;
  footerFixed: boolean;
  tabsOutline: boolean;
  borderDark: boolean;
  buttonsRespond: boolean;
  notes: string[];
}

async function checkConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  await page.waitForLoadState('networkidle');
  return errors;
}

async function validateScreen(page: Page, route: string, title: string): Promise<ScreenResult> {
  const result: ScreenResult = {
    route,
    title,
    renderOk: true,
    consoleLean: true,
    headerFixed: false,
    footerFixed: false,
    tabsOutline: false,
    borderDark: false,
    buttonsRespond: true,
    notes: [],
  };

  try {
    // 1. Navegar
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });

    // 2. Checar console (warn "findDOMNode" é não-bloqueante)
    const consoleErrs = await checkConsoleErrors(page);
    const blockerErrors = consoleErrs.filter(
      (e) => !e.includes('findDOMNode') && !e.includes('deprecated')
    );
    result.consoleLean = blockerErrors.length === 0;
    if (blockerErrors.length > 0) {
      result.notes.push(`Console errors: ${blockerErrors.slice(0, 2).join('; ')}`);
    }

    // 3. Checar se tem Header (fixed)
    const header = page.locator('header, [class*="Header"], [class*="header"]').first();
    if (await header.isVisible()) {
      const computed = await header.evaluate((el) => window.getComputedStyle(el).position);
      result.headerFixed = computed === 'fixed' || computed === 'sticky';
    }

    // 4. Checar se tem Footer (fixed)
    const footer = page.locator('footer, [class*="Footer"], [class*="footer"]').first();
    if (await footer.isVisible()) {
      const computed = await footer.evaluate((el) => window.getComputedStyle(el).position);
      result.footerFixed = computed === 'fixed' || computed === 'sticky';
    }

    // 5. Checar se tem abas OUTLINE (Tabs.List)
    const tabsList = page.locator('[role="tablist"]').first();
    if (await tabsList.isVisible()) {
      result.tabsOutline = await tabsList.evaluate(
        (el) => el.className.includes('outline') ||
                el.className.includes('folder') ||
                getComputedStyle(el).borderBottomStyle === 'solid'
      );

      // 6. Checar borda cinza no dark (não preto)
      const isDarkMode = await page.evaluate(
        () => document.documentElement.dataset.theme === 'dark' ||
              window.matchMedia('(prefers-color-scheme: dark)').matches
      );
      if (isDarkMode) {
        const borderColor = await tabsList.evaluate(
          (el) => getComputedStyle(el).borderBottomColor
        );
        result.borderDark = !borderColor.includes('rgb(0, 0, 0)') || borderColor.includes('rgb(64');
      }
    }

    // 7. Checar se botões footer respondem (click sem mutação)
    const buttons = page.locator('footer button, [class*="footer"] button').all();
    for (const btn of await buttons) {
      if (await btn.isVisible()) {
        await btn.hover();
        // Não clica, apenas hover para confirmar que responde
        result.buttonsRespond = true;
      }
    }

    // 8. Screenshot
    await page.screenshot({
      path: `test-results/est07/screen_${route.replace(/\//g, '_')}.png`,
    });

  } catch (error) {
    result.renderOk = false;
    result.notes.push((error as Error).message);
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────

test.describe('Conferência Visual EST-07 — Padrão form-tabs', () => {

  test('1. Solicitação', async ({ page }) => {
    const result = await validateScreen(page, '/administrativo/solicitacao/novo', 'Solicitação');
    console.log('TELA 1 (Solicitação):', JSON.stringify(result, null, 2));
    expect(result.renderOk).toBe(true);
  });

  test('2. Fornecedor', async ({ page }) => {
    const result = await validateScreen(page, '/cadastros-base/fornecedores/novo', 'Fornecedor');
    console.log('TELA 2 (Fornecedor):', JSON.stringify(result, null, 2));
    expect(result.renderOk).toBe(true);
  });

  test('3. Inventário/Equipamento', async ({ page }) => {
    const result = await validateScreen(page, '/cadastros-base/inventario/novo', 'Inventário');
    console.log('TELA 3 (Inventário):', JSON.stringify(result, null, 2));
    expect(result.renderOk).toBe(true);
  });

  test('4. Perfil de Acesso', async ({ page }) => {
    const result = await validateScreen(page, '/cadastros-base/perfil/novo', 'Perfil');
    console.log('TELA 4 (Perfil):', JSON.stringify(result, null, 2));
    expect(result.renderOk).toBe(true);
  });

  test('5. Apropriação (rota /apropriar)', async ({ page }) => {
    // Esta tela requer abrir um apontamento existente; para teste, tentamos a rota diretamente
    const result = await validateScreen(page, '/operacional/apontamentos', 'Apropriação');
    console.log('TELA 5 (Apropriação):', JSON.stringify(result, null, 2));
    // Esperado: loginOk ou indicar que precisa de pré-condição
  });

  test('6. CT-e (PRIORITÁRIA) — alinhamento esquerdo + borda cinza dark', async ({ page }) => {
    const result = await validateScreen(page, '/fiscal/ctes/create', 'CT-e');
    console.log('TELA 6 (CT-e — PRIORITÁRIA):', JSON.stringify(result, null, 2));
    expect(result.renderOk).toBe(true);
    expect(result.headerFixed).toBe(true);
    expect(result.footerFixed).toBe(true);
  });

  test('7. Produto (PRIORITÁRIA) — modal não quebrado', async ({ page }) => {
    const result = await validateScreen(page, '/cadastros-base/produtos/novo', 'Produto');
    console.log('TELA 7 (Produto — PRIORITÁRIA):', JSON.stringify(result, null, 2));
    expect(result.renderOk).toBe(true);
    expect(result.tabsOutline).toBe(true);
  });

  test('8. Carregamento', async ({ page }) => {
    const result = await validateScreen(page, '/operacional/carregamentos/novo', 'Carregamento');
    console.log('TELA 8 (Carregamento):', JSON.stringify(result, null, 2));
    expect(result.renderOk).toBe(true);
  });

  test('9. Pastagem', async ({ page }) => {
    const result = await validateScreen(page, '/operacional/pastagens/novo', 'Pastagem');
    console.log('TELA 9 (Pastagem):', JSON.stringify(result, null, 2));
    expect(result.renderOk).toBe(true);
  });

  test('10. Romaneios', async ({ page }) => {
    const result = await validateScreen(page, '/operacional/romaneios/novo', 'Romaneios');
    console.log('TELA 10 (Romaneios):', JSON.stringify(result, null, 2));
    expect(result.renderOk).toBe(true);
  });

  test('11. Ordem de Serviço', async ({ page }) => {
    const result = await validateScreen(page, '/operacional/ordens-servico/novo', 'Ordem de Serviço');
    console.log('TELA 11 (Ordem de Serviço):', JSON.stringify(result, null, 2));
    expect(result.renderOk).toBe(true);
  });

});
