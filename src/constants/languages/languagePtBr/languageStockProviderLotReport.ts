// src/constants/languages/languagePtBr/languageStockProviderLotReport.ts
// Tradução PT-BR do módulo "Lote/Fornecedor" (domínio Estoque, F-324,
// esteira 97-Esteiras/052, TASK-052-324-FE-01). Mirror estrutural de
// `languageBirthAnimalSisbovReport.ts`.

import { ModuleStockProviderLotReport } from '@/@types/language/module-stock-provider-lot-report';

export const languageStockProviderLotReport: ModuleStockProviderLotReport = {
  report: {
    pageTitle: 'Lote/Fornecedor',
    pageSubtitle: 'Relatório de lote por fornecedor da fazenda ativa.',
    fields: {
      provider: 'Fornecedor',
      startDate: 'Data Início',
      endDate: 'Data Fim',
      format: 'Formato',
    },
    providerPlaceholder: 'Selecione o fornecedor',
    downloadButton: 'Gerar relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      endDateBeforeStartDate: 'A Data Fim deve ser igual ou posterior à Data Início.',
    },
  },
};
