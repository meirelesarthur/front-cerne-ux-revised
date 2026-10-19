// src/constants/languages/languagePtBr/languageManagementBatchReport.ts
// Tradução PT-BR do módulo "Manejo/Lote" (relatório pecuário — F-279, esteira
// 051, TASK-279-FE-01).
//
// `fields.batch` = "Lote" (CL-23, contrato legado §6 `screen_contract`): o
// rótulo do campo é a string literal do legado, preservado como LABEL — o
// placeholder ("Selecione o lote") é um texto separado, não reaproveitado
// como rótulo.

import { ModuleManagementBatchReport } from '@/@types/language/module-management-batch-report';

export const languageManagementBatchReport: ModuleManagementBatchReport = {
  report: {
    pageTitle: 'Manejo/Lote',
    pageSubtitle: 'Relatório de manejo agrupado por categoria e lote.',
    fields: {
      category: 'Categoria',
      batch: 'Lote',
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
    },
    categoryPlaceholder: 'Selecione a categoria',
    batchPlaceholder: 'Selecione o lote',
    downloadPdfButton: 'Baixar PDF',
    downloadError: 'Não foi possível gerar o relatório.',
    periodRequiredHint: 'Informe o período (Dt. Início e Dt. Fim) para gerar o relatório.',
    validation: {
      periodRequired: 'O período (Dt. Início e Dt. Fim) é obrigatório.',
    },
  },
};
