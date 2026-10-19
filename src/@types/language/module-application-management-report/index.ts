// src/@types/language/module-application-management-report/index.ts
// Interface de tradução do módulo "Aplicação/Manejo" (relatório pecuário —
// F-230, esteira 97-Esteiras/077, F-230-plano-front.md §5). Mirror
// ESTRUTURAL de `module-costing-livestock-area-report/index.ts` (relatório
// PDF-only, sem grid/prévia, mesma cascata client-side IG-01), REMOVENDO o
// campo `grazings`/`grazingsPlaceholder` que o irmão F-251 tem.

export interface ModuleApplicationManagementReport {
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
