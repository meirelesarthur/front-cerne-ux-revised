// src/@types/language/module-sale-client-report/index.ts
// Interface de tradução do módulo "Cliente/Produto" (relatório comercial —
// F-313, esteira CORE_WORKSPACE/97-Esteiras/054). Mirror ESTRUTURAL de
// `module-sale-product-report/index.ts` (F-315), acrescentando
// `fields.client` + `clientPlaceholder`.

export interface ModuleSaleClientReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      client: string;
      product: string;
      type: string;
    };
    clientPlaceholder: string;
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
