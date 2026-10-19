// src/constants/languages/languageEnUs/languageApuracaoCusto.ts
// English translation of the "Apuração de Custo" (Cost Calculation) module —
// F-245, esteira 97-Esteiras/073, TASK-245-FE-02. Mirror of
// `languagePtBr/languageApuracaoCusto.ts`.

import { ModuleCostCalculationReport } from '@/@types/language/module-cost-calculation-report';

export const languageApuracaoCusto: ModuleCostCalculationReport = {
  report: {
    pageTitle: 'Cost Calculation',
    pageSubtitle: 'Cost calculation report for the active farm.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      farm: 'Farm',
      costCenters: 'Cost Center',
      accounts: 'Bank Account',
      orderBy: 'Order by',
      reportType: 'Report Type',
    },
    farmPlaceholder: 'All',
    costCentersPlaceholder: 'All cost centers',
    accountsPlaceholder: 'All bank accounts',
    // The legacy screen only exists in PT-BR ("+ Antigo"/"+ Recente") —
    // translated keeping the "oldest first"/"most recent first" meaning.
    orderByOptions: {
      asc: '+ Oldest',
      desc: '+ Recent',
    },
    reportTypeOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
    filterButton: 'Filter',
    printButton: 'Print',
    downloadError: 'Could not generate the report.',
    previewError: 'Could not load the report preview.',
    retryButton: 'Try again',
    emptyBeforeFilter: 'Fill in the filters and click Filter.',
    emptyReport: 'No information found.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
    },
  },
};
