// src/constants/languages/languagePtBr/languageAccumulatedWeighingBatchReport.ts
// Tradução PT-BR do módulo "Pesagem/Lote" (relatório pecuário — Tarefa 49,
// esteira CORE_WORKSPACE/97-Esteiras/014).

import { ModuleAccumulatedWeighingBatchReport } from '@/@types/language/module-accumulated-weighing-batch-report';

export const languageAccumulatedWeighingBatchReport: ModuleAccumulatedWeighingBatchReport = {
  report: {
    pageTitle: 'Pesagem/Lote',
    pageSubtitle: 'Relatório de pesagem acumulada agrupado por lote.',
    fields: {
      batch: 'Lote',
      category: 'Categoria',
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
      onlyActiveBatch: 'Somente lotes ativos',
      format: 'Formato',
    },
    batchPlaceholder: 'Selecione o lote',
    categoryPlaceholder: 'Selecione a categoria',
    submitButton: 'Gerar Relatório',
    successToast: 'Relatório gerado com sucesso.',
    errorToast: 'Não foi possível gerar o relatório.',
    periodRequiredHint: 'Informe o período (Dt. Início e Dt. Fim) para gerar o relatório.',
    validation: {
      periodRequired: 'O período (Dt. Início e Dt. Fim) é obrigatório.',
    },
  },
};
