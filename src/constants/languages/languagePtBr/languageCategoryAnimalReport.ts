// src/constants/languages/languagePtBr/languageCategoryAnimalReport.ts
// Tradução PT-BR do módulo "Estq. Animais/Categoria" (domínio Pecuária,
// F-242, esteira 97-Esteiras/077). Mirror estrutural de
// `languageStockAbcReport.ts`.

import { ModuleCategoryAnimalReport } from '@/@types/language/module-category-animal-report';

export const languageCategoryAnimalReport: ModuleCategoryAnimalReport = {
  report: {
    pageTitle: 'Estq. Animais/Categoria',
    pageSubtitle: 'Estoque de animais ativos agrupado por categoria da fazenda ativa.',
    fields: {
      category: 'Categoria',
      batch: 'Lote',
      harvest: 'Safra',
      format: 'Formato',
    },
    categoryPlaceholder: 'Todas as categorias',
    batchPlaceholder: 'Todos os lotes',
    harvestPlaceholder: 'Todas as safras',
    formatOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Gerar relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
  },
};
