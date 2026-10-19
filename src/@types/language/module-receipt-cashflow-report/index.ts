// src/@types/language/module-receipt-cashflow-report/index.ts
// Interface de tradução do módulo "Fluxo Mensal de Recebimento" (relatório
// financeiro — F-303, esteira 97-Esteiras/059, TASK-303-API-03,
// `CONTRATO-F303-fluxo-mensal-recebimento.md`). Módulo TOP-LEVEL próprio,
// mirror ESTRUTURAL de `module-cash-flow-by-category-report` (irmã direta,
// mesmo tipo de fluxo: download-only puro, PDF+Excel via campo `format`
// único, SEM grid/prévia, SEM seletor de colunas — 11 colunas fixas
// server-side), MENOS `regime`/`lastBalance`/`reportType` (F-303 não tem
// regime nem saldo anterior) MAIS `categories` (mirror `IncomeReportFilterForm`/
// `ReceiptScheduleReportParams` — categorias tipo `type_id=2`/"Entradas").

export interface ModuleReceiptCashflowReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      accounts: string;
      startDate: string;
      endDate: string;
      proprietary: string;
      costCenter: string;
      categories: string;
      farm: string;
      format: string;
    };
    proprietaryPlaceholder: string;
    costCenterPlaceholder: string;
    farmPlaceholder: string;
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
