import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────
// Smoke reutilizável autenticado (TAREFA-00). Roda no projeto
// `authenticated`, que já injeta o storageState gerado por e2e/auth.setup.ts
// — não recria login aqui.
//
// Rota alvo configurável via E2E_TARGET_ROUTE (default /home). Qualquer
// outro smoke autenticado pode reusar este spec apontando outra rota, sem
// duplicar a lógica de sessão.
// ─────────────────────────────────────────────────────────────────────────

const targetRoute = process.env.E2E_TARGET_ROUTE || '/home';

test.describe('smoke autenticado', () => {
  test(`sessão persistida acessa ${targetRoute} sem redirecionar para /login`, async ({
    page,
  }) => {
    await page.goto(targetRoute);

    // Confirma que a sessão é válida: a rota NÃO deve ter sido redirecionada
    // de volta para /login (PrivateRoute redirecionaria se isAuthenticated
    // fosse false). Assert de URL, não de "elemento existe".
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(new RegExp(targetRoute.replace(/\//g, '\\/')));
  });
});
