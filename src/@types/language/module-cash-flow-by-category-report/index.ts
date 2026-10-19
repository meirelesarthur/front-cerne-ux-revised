// src/@types/language/module-cash-flow-by-category-report/index.ts
// Interface de tradução do módulo "Fluxo de Caixa Mensal" (relatório
// financeiro — F-240, esteira 97-Esteiras/053, TASK-053-240-FE-01). Módulo
// top-level próprio, mirror `module-cost-center-report` — download-only puro
// (PDF+Excel via campo `format` único, SEM prévia, mirror
// `module-accounts-payable-receivable-report`), SEM grid.

export interface ModuleCashFlowByCategoryReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      regime: string;
      startDate: string;
      endDate: string;
      accounts: string;
      lastBalance: string;
      proprietary: string;
      costCenter: string;
      farm: string;
      reportType: string;
      format: string;
    };
    regimePlaceholder: string;
    proprietaryPlaceholder: string;
    costCenterPlaceholder: string;
    farmPlaceholder: string;
    regimeOptions: {
      cash: string;
      accrual: string;
    };
    lastBalanceOptions: {
      yes: string;
      no: string;
    };
    reportTypeOptions: {
      analytic: string;
      synthetic: string;
    };
    lookupSearchPlaceholder: string;
    selectAll: string;
    deselectAll: string;
    lookupEmptyMessage: string;
    generateButton: string;
    downloadSuccess: string;
    downloadError: string;
    validation: {
      periodRequired: string;
    };
  };
}
