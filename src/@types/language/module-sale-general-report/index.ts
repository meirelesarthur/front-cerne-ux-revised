// src/@types/language/module-sale-general-report/index.ts
// Interface de tradução do módulo "Vendas/Cliente" (relatório comercial —
// F-317, esteira CORE_WORKSPACE/97-Esteiras/077). Mirror ESTRUTURAL de
// `module-sale-client-report/index.ts` (F-313), trocando `type` (typeOptions
// PDF|Excel numérico) por `reportType` (formatOptions PDF|Excel string).

export interface ModuleSaleGeneralReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      client: string;
      product: string;
      reportType: string;
    };
    clientPlaceholder: string;
    productPlaceholder: string;
    formatOptions: {
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
