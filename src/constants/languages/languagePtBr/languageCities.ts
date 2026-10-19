// src/constants/languages/languagePtBr/languageCities.ts
// Tradução PT-BR do módulo de CIDADES (Cadastros Base / Geografia).
// TASK-FE-023: list + filter (Estado cascata + busca).

import { ModuleCities } from '@/@types/language/module-cities';

export const languageCities: ModuleCities = {
  city: {
    singularLabel: 'Cidade',
    list: {
      pageTitle: 'Cidades',
      pageSubtitle: 'Catálogo geográfico de cidades utilizado nos cadastros do sistema.',
      table: {
        title: 'Nome',
        state: 'Estado',
      },
      emptyState: {
        titleEmpty: 'Nenhuma cidade cadastrada.',
        descriptionEmpty: 'Nenhum registro encontrado neste catálogo.',
        titleFiltered: 'Nenhuma cidade encontrada.',
        descriptionFiltered: 'Tente ajustar o Estado ou a busca.',
      },
    },
    filter: {
      title: 'Filtrar cidades',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nome',
      state: 'Estado',
      statePlaceholder: 'Todos os estados',
    },
  },
};
