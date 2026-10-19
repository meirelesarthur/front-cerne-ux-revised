// src/constants/languages/languagePtBr/languageAnimalsPerBatchReport.ts
// Tradução PT-BR do módulo "Animais por Lote" (relatório pecuário — Tarefa
// 51, esteira CORE_WORKSPACE/97-Esteiras/015).

import { ModuleAnimalsPerBatchReport } from '@/@types/language/module-animals-per-batch-report';

export const languageAnimalsPerBatchReport: ModuleAnimalsPerBatchReport = {
  report: {
    pageTitle: 'Animais por Lote',
    pageSubtitle: 'Relatório de animais agrupados por lote, individual ou agregado.',
    fields: {
      batch: 'Lote',
      viewType: 'Modo de Visualização',
      animal: 'Animal',
      format: 'Formato',
      viewTypeOptions: {
        individual: 'Individual',
        aggregated: 'Agregado',
      },
    },
    batchPlaceholder: 'Selecione o lote',
    animalPlaceholder: 'Selecione o animal',
    submitButton: 'Gerar Relatório',
    successToast: 'Relatório gerado com sucesso.',
    errorToast: 'Não foi possível gerar o relatório.',
    validation: {
      batchRequired: 'O lote é obrigatório.',
      viewTypeRequired: 'O modo de visualização é obrigatório.',
    },
  },
};
