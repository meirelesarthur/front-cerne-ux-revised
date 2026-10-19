// src/@types/language/module-request-purchase-forecast-report/index.ts
// Interface de tradução do módulo "Produtos x Prev. Entrega" (relatório de
// Suprimentos — F-309, esteira CORE_WORKSPACE/97-Esteiras/058,
// TASK-058-F309-FE-01). Mirror ESTRUTURAL de
// `module-request-purchase-management-report/index.ts` (tela download-only
// sem grid, `downloadPdfButton`/`downloadExcelButton` SEPARADOS — 2 rotas de
// download, SEM campo "formato" único) + `fields` com os 10 campos do
// contrato de tela §2.2 (plano front F-309).

export interface ModuleRequestPurchaseForecastReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      farm: string;
      user: string;
      status: string;
      priority: string;
      authorizer: string;
      number: string;
      product: string;
      service: string;
    };
    downloadPdfButton: string;
    downloadExcelButton: string;
    downloadSuccess: string;
    downloadError: string;
    validation: {
      periodRequired: string;
      invalidDateRange: string;
    };
  };
}
