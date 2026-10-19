import { test as setup, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────
// Setup de autenticação do harness E2E (TAREFA-00). Roda como projeto
// `setup` do Playwright, ANTES dos testes que dependem dele.
//
// Regras de segurança (não negociáveis, ver Tarefa CA-3/CA-6):
//   - lê SOMENTE process.env.LOGIN_EMAIL / process.env.LOGIN_PASSWORD;
//     NUNCA lê o arquivo `.env.login` diretamente (isso é responsabilidade
//     exclusiva de scripts/e2e/run-authenticated.sh, via `source` silencioso);
//   - nenhuma mensagem de erro deste arquivo ecoa o VALOR de email/senha —
//     só os NOMES das variáveis ausentes/pendentes.
//
// Fluxo: dirige a UI real de /login (não chama POST /auth/login direto),
// pois a app encadeia ensureCsrfCookie() + login + GET /auth/me dentro do
// AuthContext; replicar isso via request.post() duplicaria lógica de sessão
// (CSRF, X-XSRF-TOKEN) e quebraria na primeira mudança de contrato.
// ─────────────────────────────────────────────────────────────────────────

const AUTH_FILE = 'e2e/.auth/user.json';

setup('autenticar via UI e persistir sessão', async ({ page }) => {
  const email = process.env.LOGIN_EMAIL;
  const password = process.env.LOGIN_PASSWORD;

  if (!email || !password) {
    const missing = [
      !email ? 'LOGIN_EMAIL' : null,
      !password ? 'LOGIN_PASSWORD' : null,
    ]
      .filter(Boolean)
      .join(', ');
    throw new Error(
      `[e2e] Variável(is) de ambiente ausente(s): ${missing}. ` +
        'Exporte-as antes de rodar o Playwright (ver scripts/e2e/run-authenticated.sh) — ' +
        'este setup nunca lê .env.login diretamente.',
    );
  }

  await page.goto('/login');

  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('form button[type="submit"]').click();

  // Sinal de sucesso: troca de URL para /home (via PublicRoute reagindo a
  // isAuthenticated), NUNCA "o formulário sumiu" — o splash global cobre a
  // tela por um tempo fixo (~4.8s) independente do login já ter terminado.
  try {
    await page.waitForURL('**/home', { timeout: 20_000 });
  } catch {
    // Sinal de erro esperado: [role="alert"] visível no form (credenciais
    // inválidas). Mensagem sanitizada — nunca inclui email/senha, só os
    // NOMES das variáveis usadas para autenticar.
    const alert = page.locator('[role="alert"]');
    const alertVisible = await alert.isVisible().catch(() => false);
    const reason = alertVisible
      ? 'o backend recusou as credenciais informadas via LOGIN_EMAIL/LOGIN_PASSWORD ([role="alert"] visível no formulário).'
      : 'a URL não mudou para /home dentro do timeout — possível runtime indisponível (dev server/API não respondendo em localhost) ou fluxo de login alterado.';
    throw new Error(`[e2e] Falha ao autenticar: ${reason}`);
  }

  await expect(page).toHaveURL(/\/home/);

  await page.context().storageState({ path: AUTH_FILE });
});
