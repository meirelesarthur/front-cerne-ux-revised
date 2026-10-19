// src/@types/language/module-fiscal-difference-report/index.ts
// Interface de tradução do módulo "Fiscal/Não Fiscal" (relatório financeiro —
// F-266, lote 076, `FiscalDifferenceReport-contrato.md`). Módulo top-level
// próprio, mirror `module-cash-flow-by-category-report` — download-only puro
// (SEM prévia, SEM grid), MAS 2 botões PDF/Excel (mirror
// `module-costing-animal-report`) em vez de campo `format` único.

export interface ModuleFiscalDifferenceReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      accounts: string;
      proprietary: string;
      startDate: string;
      endDate: string;
      costCenter: string;
      categories: string;
      isFiscal: string;
      condition: string;
    };
    proprietaryPlaceholder: string;
    costCenterPlaceholder: string;
    isFiscalOptions: {
      both: string;
      yes: string;
      no: string;
    };
    conditionOptions: {
      withoutCategory: string;
      withCategory: string;
    };
    lookupSearchPlaceholder: string;
    selectAll: string;
    deselectAll: string;
    lookupEmptyMessage: string;
    exportPdfButton: string;
    exportXlsxButton: string;
    successToast: string;
    downloadError: string;
    validation: {
      periodRequired: string;
    };
  };
}
