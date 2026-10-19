// src/@types/language/module-sale-employee-report/index.ts
// Interface de tradução do módulo "Vendas/Funcionário" (relatório comercial —
// F-314, esteira CORE_WORKSPACE/97-Esteiras/079). Mirror ESTRUTURAL de
// `module-sale-product-report/index.ts` (F-315) — mesmo fan-out do canário
// "Dre-style" (relatório PDF/Excel-only, sem grid/prévia).

export interface ModuleSaleEmployeeReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      user: string;
      type: string;
    };
    userPlaceholder: string;
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
