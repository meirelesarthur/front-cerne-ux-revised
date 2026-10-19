// src/@types/language/module-discards-report/index.ts
// Interface de tradução do módulo "Descarte Romaneio" (relatório de
// Agricultura — F-256, execução 97-Esteiras/078, TASK-F256-F01), chave
// TOP-LEVEL, mirror `module-products-exit-cost-center-report` — tela de
// filtro + 2 downloads (PDF/Excel) independentes, sem grid/prévia.
// `periodRequired`/`endDateAfterStartDate` cobrem `start_date`/`end_date`
// (ambas obrigatórias, fiéis ao legado).

export interface ModuleDiscardsReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      area: string;
    };
    areaPlaceholder: string;
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
