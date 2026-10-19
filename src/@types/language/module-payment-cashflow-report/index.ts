// src/@types/language/module-payment-cashflow-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Fluxo Mensal de Pagamento"
// (`payment-cashflow.report`, relatório de Financeiro — F-293, execução
// 97-Esteiras/078, TASK-F293-F01), chave TOP-LEVEL, mirror `requestQuotationReport`
// (F-311) — tela de filtro + 2 downloads (PDF/Excel) independentes, sem
// grid/prévia, 2 `CheckboxListField` (Contas/Categorias) + 3 selects
// (Proprietários/Centro de Custo/Fazenda) alimentados por UM fetch dedicado
// (`/payment-cashflow-report/options`). `periodRequired`/`endDateAfterStartDate`
// cobrem `start_date`/`end_date` (ambas obrigatórias, fiéis ao legado).
// -----------------------------------------------------------------------------

export interface ModulePaymentCashflowReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      accounts: string;
      categories: string;
      proprietary: string;
      costCenter: string;
      farm: string;
      startDate: string;
      endDate: string;
    };
    proprietaryPlaceholder: string;
    costCenterPlaceholder: string;
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
    checkbox: {
      selectAll: string;
      deselectAll: string;
      selectedCount: string;
      empty: string;
      error: string;
      retry: string;
      searchPlaceholder: string;
    };
  };
}
