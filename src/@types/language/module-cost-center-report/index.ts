// src/@types/language/module-cost-center-report/index.ts
// Interface de tradução do módulo "Centro de Custo" (relatório financeiro —
// F-247, esteira 97-Esteiras/052, TASK-052-247-FE-01). Módulo top-level
// próprio, mirror `module-cost-calculation-report` — download-only (PDF +
// Excel) COM prévia JSON renderizada em tabela (`{title,subtitle,columns,
// rows,kpis,filters}`), 2 botões de download (SEM "Tipo de Relatório"
// client-side — diferente da tela-irmã `ApuracaoCusto`).

export interface ModuleCostCenterReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      regime: string;
      startDate: string;
      endDate: string;
      accounts: string;
      proprietary: string;
      costCenter: string;
      farm: string;
    };
    regimePlaceholder: string;
    proprietaryPlaceholder: string;
    costCenterPlaceholder: string;
    farmPlaceholder: string;
    regimeOptions: {
      cash: string;
      accrual: string;
    };
    downloadPdfButton: string;
    downloadExcelButton: string;
    downloadSuccess: string;
    downloadError: string;
    previewError: string;
    retryButton: string;
    emptyBeforeFilter: string;
    emptyReport: string;
    validation: {
      periodRequired: string;
    };
  };
}
