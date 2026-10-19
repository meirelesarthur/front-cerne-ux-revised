// src/@types/language/module-income-statement-report/index.ts
// Interface de tradução do módulo "Custo de Produção" (relatório financeiro —
// F-272, esteira 97-Esteiras/073, TASK-272-FE-01). Mirror ESTRUTURAL de
// `module-cost-calculation-report/index.ts`, ampliado com a tabela de prévia
// hierárquica + os 3 drill-downs (TASK-272-FE-03) — sem equivalente nas
// telas-irmãs `costCalculationReport`/`paidInterestReport`.
//
// `drilldown.category/depreciation/apportionment.title` — extensão ADITIVA
// (TASK-272-FE-03 §"drillDownTitleFor"): título do `CustomDialog` por tipo de
// drill-down, incluído já nesta rodada (não uma correção posterior).

export interface ModuleIncomeStatementReport {
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
      costCenters: string;
      reportType: string;
    };
    groupOptions: { cash: string; accrual: string };
    typeOptions: { synthetic: string; analytical: string };
    calculationModuleOptions: { financial: string; appropriation: string };
    calculationModuleTooltip: string;
    hasStockOptions: { no: string; yes: string };
    hasStockTooltip: string;
    /** Opções do select "Tipo de Relatório" (correção pós-homologação, PDF/Excel
     *  ambos FUNCIONAIS — decisão do dono, esteira 073). */
    reportTypeOptions: { pdf: string; excel: string };
    farmPlaceholder: string;
    proprietaryPlaceholder: string;
    harvestPlaceholder: string;
    costCentersPlaceholder: string;
    periodRequiredHint: string;
    filterButton: string;
    /** Rótulo genérico do botão de download (PDF OU Excel, conforme `report_type`
     *  selecionado) — substitui o antigo `downloadPdfButton` (PDF-only). */
    downloadButton: string;
    downloadError: string;
    previewError: string;
    retryButton: string;
    emptyBeforeFilter: string;
    emptyReport: string;
    table: {
      descriptionColumn: string;
      valueColumn: string;
      percentColumn: string;
    };
    drilldown: {
      totalRowLabel: string;
      category: {
        title: string;
        dateColumn: string;
        personColumn: string;
        categoryColumn: string;
        noteColumn: string;
        valueColumn: string;
      };
      depreciation: {
        title: string;
        yearMonthColumn: string;
        familyColumn: string;
        equipmentColumn: string;
        valueColumn: string;
      };
      apportionment: {
        title: string;
        dateColumn: string;
        personColumn: string;
        centerColumn: string;
        noteColumn: string;
        originalValueColumn: string;
        percentageColumn: string;
        apportionedValueColumn: string;
      };
    };
    validation: {
      groupRequired: string;
      typeRequired: string;
      periodRequired: string;
      calculationModuleRequired: string;
    };
  };
}
