// src/@types/language/module-requisitions-report/index.ts
// Interface de tradução do módulo "Requisição/Saída" (relatório de Estoque —
// F-312, execução 97-Esteiras/078, TASK-F312-F01), chave TOP-LEVEL, mirror
// `module-products-exit-cost-center-report` MENOS o campo `center` — tela de
// filtro + 2 downloads (PDF/Excel) independentes, sem grid/prévia.
// `periodRequired`/`endDateAfterStartDate` cobrem `start_date`/`end_date`
// (ambas obrigatórias, fiéis ao legado).

export interface ModuleRequisitionsReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      warehouse: string;
      product: string;
    };
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
