// panda.config.ts
import { defineConfig } from '@pandacss/dev';

import { rawTheme } from './chakra.config';

export default defineConfig({
  preflight: true,
  include: ['./src/**/*.{js,jsx,ts,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'react',

  // Usamos diretamente o seu tema, sem presets e sem 'extend'.
  // Isso garante que apenas seus tokens serão carregados.
  theme: rawTheme as any,
});
