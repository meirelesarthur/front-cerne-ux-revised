// src/@types/language/module-cashflow-product-report/index.ts
// Interface de tradução do módulo "Estoque Financeiro" (relatório financeiro
// — F-241, esteira 97-Esteiras/013, TASK-013-241-FE-01). Módulo top-level
// próprio, mirror `module-cash-flow-by-category-report` REDUZIDO a 3 campos
// — download-only puro (PDF+Excel via campo `format` único, SEM prévia),
// SEM grid. `formatOptions` reusa `accountsReports.shared.formatOptions`
// (fábrica `reportFormatOptions`) — não duplicado aqui.

export interface ModuleCashflowProductReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      format: string;
    };
    generateButton: string;
    downloadSuccess: string;
    downloadError: string;
    validation: {
      periodRequired: string;
    };
  };
}
