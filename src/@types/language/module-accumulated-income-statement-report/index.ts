// src/@types/language/module-accumulated-income-statement-report/index.ts
// Interface de tradução do módulo "Custo de Produção Acumulado" (relatório
// financeiro — F-217, esteira 97-Esteiras/058, TASK-058-F217-FE-01). Mirror
// ESTRUTURAL de `module-income-statement-report/index.ts` (irmão
// não-acumulado, F-272) para os campos comuns de filtro — SEM os blocos
// `table`/`drilldown` (D-058-02: esta tela é download-only, sem grid/prévia
// on-screen nem os 3 drill-downs).
//
// Namespace `accumulatedIncomeStatementReport` LIVRE, sem colisão com nenhum
// módulo existente (`incomeStatementReport` já é o irmão F-272).

export interface ModuleAccumulatedIncomeStatementReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      group: string;
      type: string;
      startDate: string;
      endDate: string;
      calculationModule: string;
      farm: string;
      proprietary: string;
      hasStock: string;
      harvest: string;
      costCenter: string;
      format: string;
    };
    groupOptions: { cash: string; accrual: string };
    typeOptions: { synthetic: string; analytical: string };
    calculationModuleOptions: { financial: string; appropriation: string };
    calculationModuleTooltip: string;
    hasStockOptions: { no: string; yes: string };
    hasStockTooltip: string;
    formatOptions: { pdf: string; excel: string };
    farmPlaceholder: string;
    proprietaryPlaceholder: string;
    harvestPlaceholder: string;
    generateButton: string;
    downloadSuccess: string;
    downloadError: string;
    lookupSearchPlaceholder: string;
    lookupEmptyMessage: string;
    selectAll: string;
    deselectAll: string;
    validation: {
      invalidDateRange: string;
      /** Espelha o 422 do servidor (D-058-06/D-217-A, claim CL-02 do
       *  contrato legado) — o período não pode exceder 12 meses. */
      maxTwelveMonths: string;
    };
  };
}
