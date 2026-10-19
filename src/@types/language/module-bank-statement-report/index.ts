// src/@types/language/module-bank-statement-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Extrato Financeiro" (`bankEstatement.report`,
// relatório de Financeiro — F-233, execução 97-Esteiras/079, TASK-F233-FE-01),
// chave TOP-LEVEL, mirror `modulePaymentCashflowReport` (F-293) — tela de
// filtro + 2 downloads (PDF/Excel) independentes, sem grid/prévia, 1 select
// OBRIGATÓRIO (`account`, único), 3 selects opcionais (Proprietários/Centro de
// Custo/Fazenda), 1 `CheckboxListField` opcional (Categorias) e 1 select
// `noClearable` (`condition`, S/C). `accountRequired` cobre `account`;
// `periodRequired`/`endDateAfterStartDate` cobrem `start_date`/`end_date`
// (ambas obrigatórias, fiéis ao legado).
// -----------------------------------------------------------------------------

export interface ModuleBankStatementReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      account: string;
      proprietary: string;
      costCenter: string;
      categories: string;
      farm: string;
      condition: string;
      startDate: string;
      endDate: string;
    };
    accountPlaceholder: string;
    proprietaryPlaceholder: string;
    costCenterPlaceholder: string;
    farmPlaceholder: string;
    condition: {
      semCategoria: string;
      comCategoria: string;
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
      accountRequired: string;
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
