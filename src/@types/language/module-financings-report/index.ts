// src/@types/language/module-financings-report/index.ts
// Interface de tradução do módulo "Financiamentos" (relatório de Financeiro
// — F-265, execução 97-Esteiras/078, TASK-F265-F01), chave TOP-LEVEL, mirror
// `module-products-exit-cost-center-report` — tela de filtro + 2 downloads
// (PDF/Excel) independentes, sem grid/prévia, SEM selects. `periodRequired`/
// `endDateAfterStartDate` cobrem `start_date`/`end_date` (ambas
// obrigatórias, fiéis ao legado).

export interface ModuleFinancingsReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
    };
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
