// src/@types/language/module-request-purchase-management-report/index.ts
// Interface de tradução do módulo "Gerencial de Solicitações" (relatório de
// Suprimentos — F-310, esteira CORE_WORKSPACE/97-Esteiras/053,
// TASK-053-F310-FE-01). Mirror ESTRUTURAL de
// `module-management-batch-report/index.ts` (tela download-only sem grid)
// + `fields.farm`/`typeRequest`/`status` (mirror `module-cost-center-report`,
// 3 selects independentes) + `downloadPdfButton`/`downloadExcelButton`
// SEPARADOS (mirror `module-cost-center-report`, 2 rotas de download → 2
// botões, SEM campo "formato" único).

export interface ModuleRequestPurchaseManagementReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      farm: string;
      typeRequest: string;
      status: string;
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
