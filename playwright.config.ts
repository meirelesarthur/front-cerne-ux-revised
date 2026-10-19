import { defineConfig, devices } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────
// Harness Playwright de autenticação E2E (TAREFA-00 — infraestrutura de
// teste, GB.Cerne.FrontEnd). Isolado da produção: só dirige a UI já
// existente (tela de login real) contra o dev server local.
//
// baseURL: configurável via E2E_BASE_URL, default http://localhost:5173
// (porta fixa do dev server, ver vite.config.ts:58 — corrigido pelo Tester
// v2/esteira 053: o valor antigo, 5181, estava DESSINCRONIZADO do vite.config.ts
// atual e derrubava `--project=setup` com ERR_CONNECTION_REFUSED sempre que
// nenhum override de `E2E_BASE_URL` era passado na linha de comando; arquivo de
// harness de teste, não produto).
//
// Projeto `setup` roda e2e/auth.setup.ts primeiro e grava storageState em
// e2e/.auth/user.json; os projetos de teste dependem dele (`dependencies:
// ['setup']`) e reutilizam essa sessão, sem repetir login por teste.
// ─────────────────────────────────────────────────────────────────────────

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const AUTH_FILE = 'e2e/.auth/user.json';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
  },

  // `webServer` — orquestra o dev server (`npm run dev`, vite --host, porta
  // 5173) dentro do MESMO comando síncrono `npx playwright test`: harness
  // sobe o processo, espera a URL responder e derruba tudo ao final da
  // execução, sem exigir um passo manual de background separado
  // (`reuseExistingServer`: se já houver um dev server rodando em 5173, ele
  // é reaproveitado em vez de subir um segundo). Aditivo — não substitui o
  // fluxo hoje usado por `run-authenticated.sh` quando o dev server já está
  // de pé.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'authenticated',
      testMatch: /.*\.authenticated\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
    },
  ],
});
