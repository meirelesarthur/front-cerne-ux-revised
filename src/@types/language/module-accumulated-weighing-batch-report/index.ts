// src/@types/language/module-accumulated-weighing-batch-report/index.ts
// Interface de tradução do módulo "Pesagem/Lote" (relatório pecuário —
// Tarefa 49, esteira CORE_WORKSPACE/97-Esteiras/014). Mirror ESTRUTURAL de
// `module-management-batch-report/index.ts` (F-279), acrescido do campo
// `onlyActiveBatch` (NOVO nesta tela, mirror `launched` de `DfeReport.tsx`)
// e do seletor `format` (`reportFormatOptions`, compartilhado).

export interface ModuleAccumulatedWeighingBatchReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      batch: string;
      category: string;
      startDate: string;
      endDate: string;
      onlyActiveBatch: string;
      format: string;
    };
    batchPlaceholder: string;
    categoryPlaceholder: string;
    submitButton: string;
    successToast: string;
    errorToast: string;
    periodRequiredHint: string;
    validation: {
      periodRequired: string;
    };
  };
}
