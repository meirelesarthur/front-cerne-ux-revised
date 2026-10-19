// chakra.config.ts (na raiz do projeto)
import { defineConfig } from '@chakra-ui/react';

import {
  alertRecipe,
  breadcrumbRecipe,
  buttonRecipe,
  checkboxRecipe,
  inputRecipe,
  menuRecipe,
  modalSlotRecipe,
  numberInputRecipe,
  radioRecipe,
  switchRecipe,
  tableRecipe,
  tabsRecipe,
  // tagsInputRecipe,
  textareaRecipe,
  textRecipe,
  tooltipRecipe,
} from './src/styles/recipes';

import { colorTokens } from './src/styles/theme/color-tokens';
import { lightTheme } from './src/styles/theme/semantic/light';

// 1. Defina o tema em uma constante separada
const rawTheme = {
  tokens: {
    fonts: {
      body: {
        value: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
      heading: {
        value: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
      mono: {
        value: 'JetBrains Mono, Consolas, Monaco, monospace',
      },
    },
    // Escala tipográfica do design system CERNE (px)
    // Escala do DS (tokens.ts font.size): mesmos NOMES e VALORES. Antes os nomes
    // estavam deslocados um degrau (sm=12, base=13, md=14...), o que deixava todo o
    // texto ~1px menor que o desenho oficial.
    fontSizes: {
      "3xs": { value: "10px" },
      "2xs": { value: "11px" },
      xs: { value: "12px" },
      sm: { value: "13px" },
      base: { value: "14px" },
      md: { value: "16px" },
      lg: { value: "18px" },
      xl: { value: "20px" },
      "2xl": { value: "24px" },
      "3xl": { value: "30px" },
      "4xl": { value: "38px" },
    },
    fontWeights: {
      normal: { value: '400' },
      medium: { value: '500' },
      semibold: { value: '600' },
      bold: { value: '700' },
      extrabold: { value: '800' },
    },
    lineHeights: {
      tight: { value: '1.2' },
      snug: { value: '1.35' },
      normal: { value: '1.5' },
      relaxed: { value: '1.625' },
    },
    // Border radius do CERNE (px)
    radii: {
      sm: { value: '4px' },
      md: { value: '6px' },
      base: { value: '8px' },
      lg: { value: '10px' },
      xl: { value: '12px' },
      '2xl': { value: '16px' },
      '3xl': { value: '20px' },
      '4xl': { value: '24px' },
      full: { value: '9999px' },
    },
    colors: colorTokens,
  },
  semanticTokens: {
    colors: lightTheme.colors,
    shadows: {
      // Sombras do design system CERNE
      xs: {
        value: '0 1px 2px rgba(0, 0, 0, 0.05)',
      },
      sm: {
        value: '0 1px 2px rgba(0, 0, 0, 0.05)',
      },
      base: {
        value: '0 1px 4px rgba(0, 0, 0, 0.08)',
      },
      md: {
        value: '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
      lg: {
        value: '0 8px 24px rgba(0, 0, 0, 0.10)',
      },
      xl: {
        value: '0 8px 40px rgba(0, 0, 0, 0.12)',
      },
      '2xl': {
        value: '0 24px 64px rgba(0, 0, 0, 0.14)',
      },
      card: {
        value: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
      },
      cardHover: {
        value: '0 8px 24px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.06)',
      },
      modal: {
        value: '0 8px 40px rgba(0, 0, 0, 0.12)',
      },
      brand: {
        value: '0 4px 16px rgba(5, 150, 105, 0.25)',
      },
      inner: {
        value: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      inset: {
        value: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      overlay: {
        value: '0 0 0 1px rgba(0, 0, 0, 0.1), 0 4px 11px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  recipes: {
    button: buttonRecipe,
    input: inputRecipe,
    alert: alertRecipe,
    text: textRecipe,
    textarea: textareaRecipe,
    tooltip: tooltipRecipe,
    breadcrumb: breadcrumbRecipe,
    checkbox: checkboxRecipe,
    menu: menuRecipe,
    numberInput: numberInputRecipe,
    radio: radioRecipe,
    switch: switchRecipe,
    table: tableRecipe,
    // tagsInput: tagsInputRecipe,
  },
  slotRecipes: {
    modal: modalSlotRecipe,
    tabs: tabsRecipe,
  },
  // Nota: bloco `components.*.defaultProps` (API do Chakra v2 / extendTheme) foi
  // removido por ser INERTE no Chakra v3 (createSystem/defineConfig não lê
  // `components`) — o default efetivo de tamanho vem de `defaultVariants` na
  // recipe (ver `src/styles/recipes/button.ts` e `src/styles/recipes/input.ts`).
};

// 2. Exporte essa constante "crua" para o sistema usar
export { rawTheme };

// 3. Mantenha o export default para o Chakra
export default defineConfig({
  theme: rawTheme as any,
});
