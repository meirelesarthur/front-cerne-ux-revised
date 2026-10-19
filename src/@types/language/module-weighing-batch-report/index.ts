// src/@types/language/module-weighing-batch-report/index.ts
// Interface de tradução do módulo "Pesagem/Animal" (relatório pecuário —
// feature F-334, `CONTRATO-F334-pesagem-animal.md`). Mirror ESTRUTURAL de
// `module-accumulated-weighing-batch-report/index.ts` (irmão "Pesagem/
// Lote"), acrescido do campo `animal` (NOVO nesta tela, lookup via
// `GET /api/v1/animals/options`) no lugar de `onlyActiveBatch` (ausente
// neste contrato).

export interface ModuleWeighingBatchReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      batch: string;
      category: string;
      animal: string;
      startDate: string;
      endDate: string;
      format: string;
    };
    batchPlaceholder: string;
    categoryPlaceholder: string;
    animalPlaceholder: string;
    submitButton: string;
    successToast: string;
    errorToast: string;
    periodRequiredHint: string;
    validation: {
      periodRequired: string;
    };
  };
}
