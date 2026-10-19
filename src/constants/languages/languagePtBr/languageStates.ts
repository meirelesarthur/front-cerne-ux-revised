// src/constants/languages/languagePtBr/languageStates.ts
// Tradução PT-BR do módulo de ESTADOS (Cadastros Base / Geografia).
// TASK-FE-022: list (menor módulo i18n da família — sem filter/form).

import { ModuleStates } from '@/@types/language/module-states';

export const languageStates: ModuleStates = {
  state: {
    singularLabel: 'Estado',
    list: {
      pageTitle: 'Estados',
      pageSubtitle: 'Catálogo geográfico de estados utilizado nos cadastros do sistema.',
      table: {
        title: 'Nome',
        letter: 'Sigla',
      },
      emptyState: {
        titleEmpty: 'Nenhum estado cadastrado.',
        descriptionEmpty: 'Nenhum registro encontrado neste catálogo.',
      },
    },
  },
};
