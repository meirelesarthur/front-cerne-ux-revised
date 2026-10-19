// src/@types/language/module-financial-movement-report/index.ts
// Interface de tradução do módulo "Movimento Bancário" (relatório financeiro
// — F-264, esteira 97-Esteiras/058, TASK-058-F264-FE-01). Módulo top-level
// próprio, mirror `module-cost-center-report` — download-only (PDF/Excel via
// campo `format` único), SEM prévia/grid on-screen (CL-12 do contrato
// legado). Lookup labels (`lookupSearchPlaceholder`/`selectAll`/...) LOCAIS a
// este módulo (D-058: esta tela não pertence ao módulo `accountsReports`).

export interface ModuleFinancialMovementReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      accounts: string;
      proprietary: string;
      types: string;
      centerId: string;
      categories: string;
      farm: string;
      condition: string;
      startDate: string;
      endDate: string;
      format: string;
    };
    proprietaryPlaceholder: string;
    centerIdPlaceholder: string;
    farmPlaceholder: string;
    conditionOptions: {
      withoutCategory: string;
      withCategory: string;
    };
    formatOptions: {
      pdf: string;
      xlsx: string;
    };
    // ROTEIRO-FILT-02 (esteira 060, F-264, achado C-P1-03) — rótulo local do
    // 5º valor `I` (Saldo Inicial) da lista REPORT-SCOPED de `types`
    // (`financialMovementReportTypeOptions`); E/S/T/F continuam vindo de
    // `languageMovements.movement.form.typeCategoryOptions` (reuso, sem
    // duplicar tradução).
    typeOptions: {
      initialBalance: string;
    };
    generateButton: string;
    downloadSuccess: string;
    downloadError: string;
    lookupSearchPlaceholder: string;
    lookupEmptyMessage: string;
    selectAll: string;
    deselectAll: string;
    validation: {
      periodRequired: string;
      invalidDateRange: string;
    };
  };
}
