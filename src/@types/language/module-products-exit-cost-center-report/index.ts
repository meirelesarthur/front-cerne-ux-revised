// src/@types/language/module-products-exit-cost-center-report/index.ts
// Interface de tradução do módulo "Saídas x Centro Custo" (relatório de
// Estoque — F-301, execução 97-Esteiras/078, TASK-F301-F01), chave TOP-LEVEL,
// mirror `module-savings-report` — tela de filtro + 2 downloads (PDF/Excel)
// independentes, sem grid/prévia. `periodRequired`/`endDateAfterStartDate`
// cobrem `start_date`/`end_date` (ambas obrigatórias, fiéis ao legado).

export interface ModuleProductsExitCostCenterReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      center: string;
      warehouse: string;
      product: string;
    };
    centerPlaceholder: string;
    warehousePlaceholder: string;
    productPlaceholder: string;
    downloadPdfButton: string;
    downloadExcelButton: string;
    exportFileName: string;
    popupBlocked: string;
    toasts: {
      success: string;
      genericError: string;
    };
    validation: {
      periodRequired: string;
      endDateAfterStartDate: string;
    };
  };
}
