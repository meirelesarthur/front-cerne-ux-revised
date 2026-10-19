// src/constants/languages/languagePtBr/languageWeighingBatchReport.ts
// Tradução PT-BR do módulo "Pesagem/Animal" (relatório de Pecuária — F-334,
// CONTRATO-F334-pesagem-animal.md). Mirror estrutural do bloco `report` de
// `languageAccumulatedWeighingBatchReport.ts` (irmão "Pesagem/Lote").

import { ModuleWeighingBatchReport } from '@/@types/language/module-weighing-batch-report';

export const languageWeighingBatchReport: ModuleWeighingBatchReport = {
  report: {
    pageTitle: 'Pesagem/Animal',
    pageSubtitle: 'Relatório de pesagem por animal, lote e categoria, no período selecionado.',
    fields: {
      batch: 'Lote',
      category: 'Categoria',
      animal: 'Animal',
      startDate: 'Data Inicial',
      endDate: 'Data Final',
      format: 'Formato',
    },
    batchPlaceholder: 'Selecione o lote',
    categoryPlaceholder: 'Selecione a categoria',
    animalPlaceholder: 'Selecione o animal',
    submitButton: 'Gerar Relatório',
    successToast: 'Relatório gerado com sucesso.',
    errorToast: 'Não foi possível gerar o relatório.',
    periodRequiredHint: 'Selecione a Data Inicial e a Data Final para gerar o relatório.',
    validation: {
      periodRequired: 'A data é obrigatória.',
    },
  },
};
