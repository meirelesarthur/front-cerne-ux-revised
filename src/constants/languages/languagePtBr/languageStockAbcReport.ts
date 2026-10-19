// src/constants/languages/languagePtBr/languageStockAbcReport.ts
// Tradução PT-BR do módulo "Curva ABC/Estoque" (domínio Estoque, F-322,
// esteira 97-Esteiras/077). Mirror estrutural de
// `languageStockProviderLotReport.ts`.

import { ModuleStockAbcReport } from '@/@types/language/module-stock-abc-report';

export const languageStockAbcReport: ModuleStockAbcReport = {
  report: {
    pageTitle: 'Curva ABC/Estoque',
    pageSubtitle: 'Classificação ABC do estoque da fazenda ativa por valor total.',
    fields: {
      startDate: 'Data Início',
      endDate: 'Data Fim',
      format: 'Formato',
    },
    formatOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Gerar relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      endDateBeforeStartDate: 'A Data Fim deve ser igual ou posterior à Data Início.',
    },
  },
};
