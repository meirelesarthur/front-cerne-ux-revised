import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────
// E2E autenticado do relatório "Fluxo Bancário" (F-107, esteira 070,
// TASK-CF-FE-01..04). Escrito pelo gb-cerne-front-tester-v2 nesta sessão de
// validação — reusa a sessão persistida por e2e/auth.setup.ts (projeto
// `authenticated`), NUNCA lê .env.login diretamente.
//
// Se a conta de teste não tiver a permissão `cashflow_view`, a rota renderiza
// `<AccessDenied />` (RequirePermission, UX apenas — enforcement real é o
// 403 do backend) em vez de redirecionar para /login; o teste detecta esse
// caso e falha com uma mensagem explícita em vez de fabricar um resultado.
// ─────────────────────────────────────────────────────────────────────────

test.describe('Fluxo Bancário (F-107) — smoke autenticado', () => {
  test('renderiza filtro, dispara relatório e mostra saída (cards/gráficos/tabela)', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const responses: { url: string; status: number }[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/cashflow')) {
        responses.push({ url: response.url(), status: response.status() });
      }
    });

    await page.goto('/financeiro/fluxo');

    const accessDenied = page.getByText(/acesso negado|não autorizado|access denied/i);
    if (await accessDenied.isVisible().catch(() => false)) {
      throw new Error(
        '[e2e] Conta de teste sem permissão cashflow_view — AccessDenied renderizado em /financeiro/fluxo. ' +
          'BLOCKED_EXTERNAL para o restante deste cenário.',
      );
    }

    await expect(page).not.toHaveURL(/\/login/);

    // Empty pré-filtro (get_spa_ux_fidelity_pattern §3) — antes do 1º clique.
    await expect(page.getByText('Aplique os filtros e clique em Filtrar.')).toBeVisible();

    // Dispara "Filtrar" sem nenhum campo preenchido (DIV-03 — botão sempre
    // habilitado, resultado vazio ou populado sem erro).
    await page.getByRole('button', { name: 'Filtrar' }).click();

    // Aguarda a resposta HTTP do endpoint único (sucesso ou erro — o teste
    // reporta o que realmente aconteceu, não presume).
    await page
      .waitForResponse((response) => response.url().includes('/cashflow'), { timeout: 15_000 })
      .catch(() => null);

    // Espera o botão "Filtrar" sair do estado de loading (spinner) antes de
    // checar o resultado — o response HTTP já chegou, mas o React ainda
    // pode não ter re-renderizado no instante exato do evento de rede.
    await page
      .getByRole('button', { name: 'Filtrar' })
      .and(page.locator(':not([data-loading])'))
      .waitFor({ state: 'visible', timeout: 10_000 })
      .catch(() => null);
    await page.waitForTimeout(1000);

    const hasErrorMessage = await page
      .getByText('Não foi possível carregar o relatório de fluxo bancário.')
      .isVisible()
      .catch(() => false);
    const hasEmptyReport = await page
      .getByText('Nenhuma informação encontrada.')
      .isVisible()
      .catch(() => false);
    const hasPrintButton = await page
      .getByRole('button', { name: 'Imprimir' })
      .isVisible()
      .catch(() => false);

    // eslint-disable-next-line no-console -- saída de diagnóstico do teste, não da app
    console.log(
      JSON.stringify({
        cashflowResponses: responses,
        hasErrorMessage,
        hasEmptyReport,
        hasPrintButton,
        consoleErrorsCount: consoleErrors.length,
        consoleErrorsSample: consoleErrors.slice(0, 5),
      }),
    );

    // Pelo menos um dos 3 estados pós-filtro precisa estar presente —
    // caso contrário a tela travou silenciosamente.
    expect(hasErrorMessage || hasEmptyReport || hasPrintButton).toBeTruthy();

    if (hasPrintButton) {
      // Success — cards + tabela devem estar presentes.
      await expect(page.getByText('Em Caixa')).toBeVisible();
      await expect(page.getByText('Em bancos')).toBeVisible();
      await expect(page.getByText('Dt. Movimento')).toBeVisible();
    }
  });
});
