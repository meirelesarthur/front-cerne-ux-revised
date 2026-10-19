// src/constants/languages/languagePtBr/languageTransferClienteReport.ts
// Tradução PT-BR do módulo "Romaneio Cliente" (relatório de Agricultura,
// F-332, esteira 058, TASK-058-F332-FE-01). Mirror estrutural de
// `languageAnimalBatchHistoryReport.ts`.

import { ModuleTransferClienteReport } from '@/@types/language/module-transfer-cliente-report';

export const languageTransferClienteReport: ModuleTransferClienteReport = {
  report: {
    pageTitle: 'Romaneio Cliente',
    pageSubtitle: 'Relatório de transferências por cliente.',
    fields: {
      client: 'Cliente',
      startDate: 'Data Início',
      endDate: 'Data Fim',
    },
    validation: {
      periodRequired: 'Informe o período (Data Início e Data Fim).',
    },
    downloadButton: 'Gerar Relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
  },
};
