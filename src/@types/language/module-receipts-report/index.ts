// src/@types/language/module-receipts-report/index.ts
// Interface de tradução do módulo "Recebimentos" (relatório de Estoque —
// F-305, esteira 97-Esteiras/074, TASK-RCB-FE-01). Módulo TOP-LEVEL próprio
// (mirror `module-food-beat-aggregate-report`), tela de filtro + download de
// PDF/Excel, SEM grid/prévia — mesma forma reduzida do `report` das módulos
// irmãos de Relatório.

export interface ModuleReceiptsReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      product: string;
      center: string;
      category: string;
      startDate: string;
      endDate: string;
      reportType: string;
    };
    productPlaceholder: string;
    centerPlaceholder: string;
    categoryPlaceholder: string;
    reportTypeOptions: { pdf: string; excel: string };
    periodRequiredHint: string;
    submitButton: string;
    successToast: string;
    downloadError: string;
    validation: {
      periodRequired: string;
      periodOrder: string;
    };
  };
}
