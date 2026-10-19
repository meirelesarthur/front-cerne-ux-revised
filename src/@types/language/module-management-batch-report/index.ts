// src/@types/language/module-management-batch-report/index.ts
// Interface de tradução do módulo "Manejo/Lote" (relatório pecuário — F-279,
// esteira CORE_WORKSPACE/97-Esteiras/051, TASK-279-FE-01). Mirror ESTRUTURAL
// de `module-production-costing-area-report/index.ts` (canário F-298 do
// mesmo fan-out — relatório PDF-only, sem grid/prévia).

export interface ModuleManagementBatchReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      category: string;
      batch: string;
      startDate: string;
      endDate: string;
    };
    categoryPlaceholder: string;
    batchPlaceholder: string;
    downloadPdfButton: string;
    downloadError: string;
    periodRequiredHint: string;
    validation: {
      periodRequired: string;
    };
  };
}
