// src/@types/language/module-sale-product-report/index.ts
// Interface de tradução do módulo "Vendas/Produto" (relatório comercial —
// F-315, esteira CORE_WORKSPACE/97-Esteiras/051, TASK-315-FE-01). Mirror
// ESTRUTURAL de `module-management-batch-report/index.ts` (fan-out do
// mesmo canário F-298 — relatório PDF/Excel-only, sem grid/prévia).

export interface ModuleSaleProductReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      product: string;
      type: string;
    };
    productPlaceholder: string;
    typeOptions: {
      pdf: string;
      excel: string;
    };
    downloadButton: string;
    downloadError: string;
    downloadSuccess: string;
    periodRequiredHint: string;
    validation: {
      startDateRequired: string;
      endDateRequired: string;
      endDateAfterStartDate: string;
    };
  };
}
