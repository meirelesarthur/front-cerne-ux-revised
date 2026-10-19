// src/theme.ts
import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

import { rawTheme } from '../chakra.config';

const config = defineConfig({
  theme: {
    ...rawTheme,
    semanticTokens: {
      ...rawTheme.semanticTokens,
      colors: { ...rawTheme.semanticTokens.colors },
    },
  },
});

export const system = createSystem(defaultConfig, config);
