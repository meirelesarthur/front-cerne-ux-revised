// src/constants/languages/languagePtBr/languageTransferDifferenceReport.ts
// -----------------------------------------------------------------------------
// Tradução PT-BR do módulo "Romaneio/Diferença" (relatório agrícola —
// Tarefa 49, esteira 97-Esteiras/014, feature_id c0b2369d).
// -----------------------------------------------------------------------------

import { ModuleTransferDifferenceReport } from '@/@types/language/module-transfer-difference-report';

export const languageTransferDifferenceReport: ModuleTransferDifferenceReport = {
  report: {
    pageTitle: 'Romaneio/Diferença',
    pageSubtitle: 'Relatório de diferença de romaneio, por cliente e período.',
    fields: {
      client: 'Cliente',
      startDate: 'Data Início',
      endDate: 'Data Fim',
      format: 'Formato',
    },
    clientPlaceholder: 'Todos os clientes',
    generateButton: 'Gerar relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      datesRequired: 'A data é obrigatória.',
      invalidDateRange: 'A data fim deve ser igual ou posterior à data início.',
    },
  },
};
