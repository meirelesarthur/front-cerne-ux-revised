// src/@types/language/module-profitability-by-crop-report/index.ts
// Interface de tradução do módulo "Rentabilidade/Cultura" (relatório de
// Agricultura — F-302, esteira CORE_WORKSPACE/97-Esteiras/077). Mirror
// ESTRUTURAL de `module-sale-client-report/index.ts` (F-313) SEM
// `fields.client`/`fields.product`/`fields.type`/`typeOptions`/
// `clientPlaceholder`/`productPlaceholder`/`downloadSuccess` (F-302 é
// PDF-only, sem seletor de formato, e o mirror escolhido — `ClienteProduto`
// — não tem toast de sucesso no casco reaproveitado).

export interface ModuleProfitabilityByCropReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      cultivation: string;
      harvest: string;
      startDate: string;
      endDate: string;
    };
    cultivationPlaceholder: string;
    harvestPlaceholder: string;
    downloadPdfButton: string;
    downloadError: string;
    periodRequiredHint: string;
    validation: {
      endDateAfterStartDate: string;
    };
  };
}
