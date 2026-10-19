import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

/**
 * Config de teste dedicada — separada do `vite.config.ts` (FROZEN, hash
 * 209df2e0f17c7fc0d50baf55e6472d85eab39acdb8cda0cd1d50e66b2a97edef). Quando
 * este arquivo existe, o Vitest o usa no lugar da seção `test` do Vite config,
 * então o comportamento de build/dev não muda.
 *
 * `plugins: [tsconfigPaths()]` é necessário porque o Vitest NÃO herda
 * `plugins` do vite.config.ts quando existe este arquivo dedicado — sem ele,
 * qualquer import `@/...` (direto ou transitivo) quebra em teste com
 * "Failed to resolve import".
 *
 * Ambiente default continua `node` (igual ao comportamento anterior, sem
 * `vitest.config.ts`); só arquivos `*.test.tsx` (Testing Library) rodam em
 * `jsdom`, mantendo o delta mínimo sobre a suíte já existente.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    environmentMatchGlobs: [['**/*.test.tsx', 'jsdom']],
    // Polyfills de jsdom (matchMedia, ResizeObserver, pointer capture) exigidos
    // pelo FloatingPanel do Chakra v3. Guardado por `typeof window`, então é
    // inócuo nos testes de ambiente `node`.
    setupFiles: ['./src/test/vitest.setup.ts'],
  },
});
