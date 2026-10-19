// src/constants/languages/languagePtBr/languageNutritionConsumptionReport.ts
// Tradução PT-BR do módulo "Nutrição/Lote" (relatório pecuário — F-288,
// esteira 053, TASK-288-FE-01).
//
// `fields.batch` = "Lote" (CL-23, contrato legado): o rótulo do campo é a
// string literal do legado, preservado como LABEL — o placeholder
// ("Selecione o lote") é um texto separado, não reaproveitado como rótulo.

import { ModuleNutritionConsumptionReport } from '@/@types/language/module-nutrition-consumption-report';

export const languageNutritionConsumptionReport: ModuleNutritionConsumptionReport = {
  report: {
    pageTitle: 'Nutrição/Lote',
    pageSubtitle: 'Relatório de consumo de nutrição por produto e cocho.',
    fields: {
      category: 'Categoria',
      batch: 'Lote',
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
      format: 'Formato',
    },
    categoryPlaceholder: 'Selecione a categoria',
    batchPlaceholder: 'Selecione o lote',
    downloadButton: 'Baixar relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    periodRequiredHint: 'Informe o período (Dt. Início e Dt. Fim) para gerar o relatório.',
    validation: {
      periodRequired: 'O período (Dt. Início e Dt. Fim) é obrigatório.',
    },
  },
};
