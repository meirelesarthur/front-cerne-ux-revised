// src/@types/language/module-costing-area-report/index.ts
// Interface de tradução do módulo "Custeio/Área" (relatório agrícola —
// F-252, esteira CORE_WORKSPACE/97-Esteiras/079, TASK-252-FE-01). Mirror
// ESTRUTURAL de `module-production-costing-area-report/index.ts` (F-298,
// relatório PDF-only, sem grid/prévia) — tela NOVA e distinta.

export interface ModuleCostingAreaReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      productionCycle: string;
      areas: string;
      startDate: string;
      endDate: string;
    };
    productionCyclePlaceholder: string;
    areasPlaceholder: string;
    downloadPdfButton: string;
    downloadError: string;
    periodRequiredHint: string;
    validation: {
      periodRequired: string;
    };
  };
}
