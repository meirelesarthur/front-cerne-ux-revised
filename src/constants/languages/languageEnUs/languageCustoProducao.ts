// src/constants/languages/languageEnUs/languageCustoProducao.ts
// English translation of the "Custo de Produção" (Cost of Production) module —
// F-272, esteira 97-Esteiras/073, TASK-272-FE-02/03. Mirror of
// `languagePtBr/languageCustoProducao.ts`.

import { ModuleIncomeStatementReport } from '@/@types/language/module-income-statement-report';

export const languageCustoProducao: ModuleIncomeStatementReport = {
  report: {
    pageTitle: 'Cost of Production',
    pageSubtitle: 'Income Statement — Cost of Production by Period.',
    fields: {
      group: 'Basis',
      type: 'Type',
      startDate: 'Start Date',
      endDate: 'End Date',
      calculationModule: 'Calculation Module',
      farm: 'Farm',
      proprietary: 'Proprietary',
      hasStock: 'Show Stock?',
      harvest: 'Harvest',
      costCenters: 'Cost Center',
      reportType: 'Report Type',
    },
    groupOptions: {
      cash: 'Cash',
      accrual: 'Accrual',
    },
    typeOptions: {
      synthetic: 'Synthetic',
      analytical: 'Analytical',
    },
    calculationModuleOptions: {
      financial: 'Financial',
      appropriation: 'Appropriation (Stock Consumption)',
    },
    calculationModuleTooltip:
      'Financial considers the financial entries for the period; Appropriation (Stock Consumption) considers the appropriated stock consumption.',
    hasStockOptions: {
      no: 'No',
      yes: 'Yes',
    },
    hasStockTooltip:
      'When checked, includes the input/production stock variation on the end date of the period.',
    reportTypeOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    farmPlaceholder: 'All',
    proprietaryPlaceholder: 'Select the proprietary',
    harvestPlaceholder: 'Select the harvest',
    costCentersPlaceholder: 'All cost centers',
    periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
    filterButton: 'Filter',
    downloadButton: 'Download',
    downloadError: 'Could not generate the report.',
    previewError: 'Could not load the report preview.',
    retryButton: 'Try again',
    emptyBeforeFilter: 'Fill in the filters and click Filter.',
    emptyReport: 'No information found.',
    table: {
      descriptionColumn: 'Description',
      valueColumn: 'Value',
      percentColumn: '%',
    },
    drilldown: {
      totalRowLabel: 'Total',
      category: {
        title: 'Category Details',
        dateColumn: 'Date',
        personColumn: 'Customer/Supplier',
        categoryColumn: 'Category',
        noteColumn: 'Note',
        valueColumn: 'Value',
      },
      depreciation: {
        title: 'Depreciation Details',
        yearMonthColumn: 'Year/Month',
        familyColumn: 'Family',
        equipmentColumn: 'Machine/Equipment',
        valueColumn: 'Value',
      },
      apportionment: {
        title: 'Apportionment Details',
        dateColumn: 'Date',
        personColumn: 'Customer/Supplier',
        centerColumn: 'Cost Center',
        noteColumn: 'Note',
        originalValueColumn: 'Original Value',
        percentageColumn: 'Percentage',
        apportionedValueColumn: 'Apportioned Value',
      },
    },
    validation: {
      groupRequired: 'Basis is required.',
      typeRequired: 'Type is required.',
      periodRequired: 'The period (Start Date and End Date) is required.',
      calculationModuleRequired: 'Calculation Module is required.',
    },
  },
};
