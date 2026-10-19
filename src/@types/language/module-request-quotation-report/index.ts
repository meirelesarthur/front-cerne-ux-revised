// src/@types/language/module-request-quotation-report/index.ts
// Interface de tradução do módulo "Orçamentos" (`request-quotation.report`,
// relatório de Suprimentos — F-311, execução 97-Esteiras/078,
// TASK-F311-F01), chave TOP-LEVEL, mirror `module-products-exit-cost-center-
// report` — tela de filtro + 2 downloads (PDF/Excel) independentes, sem
// grid/prévia. `periodRequired`/`endDateAfterStartDate` cobrem
// `start_date`/`end_date` (ambas obrigatórias, fiéis ao legado).

export interface ModuleRequestQuotationReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      provider: string;
      farm: string;
    };
    providerPlaceholder: string;
    farmPlaceholder: string;
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
