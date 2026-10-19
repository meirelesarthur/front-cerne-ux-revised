import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.ts/,
  timeout: 240_000,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:8081', ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true },
});
