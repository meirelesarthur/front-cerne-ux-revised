// src/@types/language/module-accounts-payable-receivable-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Consolidado Pagar/Receber" (relatório
// financeiro — F-214, esteira 97-Esteiras/052, TASK-052-214-FE-01/02).
// Módulo top-level próprio, mirror ESTRUTURAL de `module-accounts-reports`
// (`accountsReports.shared`) — download-only (PDF + Excel via campo `format`
// único, SEM 2 botões separados, mirror `ContasAPagar`), SEM grid/prévia.
//
// 11 filtros EXATOS de `AccountsPayableReceivableReportRequest` (roteiro
// SELADO §"Contrato de tela"): 2 pares de data (emissão OBRIGATÓRIA, baixa
// opcional), 5 lookups uuid (provider/client/center/account/category, todos
// SINGLE-select — diferente do multi-select `providers[]`/`categories[]` de
// `ContasAPagar`), `status[]` (catálogo LOCAL 1-4, `CheckboxListField`) e
// `format` (obrigatório, default `pdf`).
// -----------------------------------------------------------------------------

export interface ModuleAccountsPayableReceivableReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startEmissionDate: string;
      endEmissionDate: string;
      startWriteOffDate: string;
      endWriteOffDate: string;
      provider: string;
      client: string;
      center: string;
      account: string;
      category: string;
      status: string;
      format: string;
    };
    providerPlaceholder: string;
    clientPlaceholder: string;
    centerPlaceholder: string;
    accountPlaceholder: string;
    categoryPlaceholder: string;
    statusOptions: {
      open: string;
      partial: string;
      settled: string;
      advance: string;
    };
    lookupSearchPlaceholder: string;
    selectAll: string;
    deselectAll: string;
    lookupEmptyMessage: string;
    generateButton: string;
    downloadSuccess: string;
    downloadError: string;
    validation: {
      emissionRequired: string;
      invalidEmissionDateRange: string;
      invalidWriteOffDateRange: string;
      formatRequired: string;
    };
  };
}
