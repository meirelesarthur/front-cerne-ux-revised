// src/@types/language/module-nutrition-consumption-report/index.ts
// Interface de tradução do módulo "Nutrição/Lote" (relatório pecuário —
// F-288, esteira CORE_WORKSPACE/97-Esteiras/053, TASK-288-FE-01). Mirror
// ESTRUTURAL de `module-management-batch-report/index.ts` (F-279) +
// `fields.format` acrescentado (mirror `module-stock-provider-lot-report`,
// F-324) — as OPÇÕES pdf/xlsx continuam vindo de `reportFormatOptions`/
// `languageGB.accountsReports.shared.formatOptions`, não duplicadas aqui.

export interface ModuleNutritionConsumptionReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      category: string;
      batch: string;
      startDate: string;
      endDate: string;
      format: string;
    };
    categoryPlaceholder: string;
    batchPlaceholder: string;
    downloadButton: string;
    downloadSuccess: string;
    downloadError: string;
    periodRequiredHint: string;
    validation: {
      periodRequired: string;
    };
  };
}
