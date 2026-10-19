// src/contexts/ThemeContext/index.tsx

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';

import { darkTheme } from '../../styles/theme/semantic/dark';

import { lightTheme } from '@/styles/theme/semantic/light';
import { getThemeGB, saveThemeGB } from '@/utils/auth-token';
import { onThemeChange } from '@/utils/themeBus';
import { rawTheme } from '../../../chakra.config';

// --- Definição de Tipos e Contexto ---

export const themeTypes = {
  dark: 'dark',
  light: 'light',
} as const;

export type ThemeTypes = (typeof themeTypes)[keyof typeof themeTypes];

interface ThemeContextProps {
  updateTheme: (theme: ThemeTypes) => void;
  theme: ThemeTypes;
}

export const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const useTheme = () => {
  const ThemeContext2 = useMemo(() => ThemeContext, []);
  const context = useContext(ThemeContext2);
  const value = useMemo(() => context, [context]);

  if (!value) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return value;
};

// --- Componente Provedor ---

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Pega o tema do localStorage ou usa light como padrão
  const savedTheme = getThemeGB();
  const [theme, setTheme] = useState<ThemeTypes>(savedTheme || 'light');

  const updateTheme = (newTheme: ThemeTypes) => {
    saveThemeGB(newTheme);
    setTheme(newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    // Adiciona uma classe/atributo para a troca de tema via CSS se necessário
    root.dataset.theme = theme;
    document.body.className = theme === 'light' ? '' : 'dark';
  }, [theme]);

  // Esta variável agora contém o tema semântico completo (cores E estilos)
  const currentSemanticTheme = theme === 'dark' ? darkTheme : lightTheme;

  const system = useMemo(() => {
    const customTheme = {
      tokens: rawTheme.tokens,
      semanticTokens: {
        colors: currentSemanticTheme.colors,
      },
      recipes: rawTheme.recipes,
      slotRecipes: rawTheme.slotRecipes,
    };

    // O ponto chave: passamos o globalCss dinâmico para o createSystem
    return createSystem(defaultConfig, {
      theme: customTheme as any,
      globalCss: currentSemanticTheme.styles.global,
    });
  }, [currentSemanticTheme, theme]); // Dependências explicitadas

  // Listener para mudanças de tema vindas de outros componentes (se necessário)
  useEffect(() => {
    const unsubscribe = onThemeChange((newTheme) => {
      if (newTheme !== theme) {
        saveThemeGB(newTheme);
        setTheme(newTheme);
      }
    });
    return unsubscribe;
  }, [theme]);

  const value = useMemo(() => ({ updateTheme, theme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      <ChakraProvider value={system}>
        {children}
      </ChakraProvider>
    </ThemeContext.Provider>
  );
};
