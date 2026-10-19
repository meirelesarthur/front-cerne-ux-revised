// src/@types/language/module-ledger-category-report/index.ts
// Interface de tradução do módulo "Razão Categoria" (relatório financeiro —
// F-273, execução 059, `CONTRATO-F273-razao-categoria.md`, TASK-273-FE-01).
// Módulo TOP-LEVEL próprio, mirror ESTRUTURAL de
// `module-cash-flow-by-category-report` — download-only puro (PDF+Excel via
// campo `format` único, SEM prévia/grid, `group`/`accounts`/`last_balance`/
// `report_type` NÃO existem neste contrato), MAIS o campo `categories`
// (`CheckboxListField` remoto sobre Categorias Financeiras, mirror técnica
// `accounts` dos irmãos `CashFlowByCategoryReport`/`CentroCusto`).
export interface ModuleLedgerCategoryReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      farm: string;
      proprietary: string;
      costCenter: string;
      categories: string;
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
      periodOrder: string;
    };
  };
}
