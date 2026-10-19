// src/constants/languages/languagePtBr/languageAnimalBatchHistoryReport.ts
// Tradução PT-BR do módulo "Histórico de Animais/Lote" (relatório de
// Pecuária, F-221, esteira 058, TASK-058-F221-FE-01). Mirror estrutural de
// `languageWeighingHarvestReport.ts`.

import { ModuleAnimalBatchHistoryReport } from '@/@types/language/module-animal-batch-history-report';

export const languageAnimalBatchHistoryReport: ModuleAnimalBatchHistoryReport = {
  report: {
    pageTitle: 'Histórico de Animais/Lote',
    pageSubtitle: 'Relatório de histórico de animais por lote.',
    fields: {
      startDate: 'Data Início',
      endDate: 'Data Fim',
      batch: 'Lote',
      status: 'Status',
      type: 'Tipo de Relatório',
    },
    outputTypeOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    requiredFieldsHint: 'Informe a Data Início e o Lote para gerar o relatório.',
    downloadButton: 'Gerar Relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
  },
};
