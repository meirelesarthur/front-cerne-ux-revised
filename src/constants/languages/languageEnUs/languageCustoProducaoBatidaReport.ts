// src/constants/languages/languageEnUs/languageCustoProducaoBatidaReport.ts
// English translation of the "Custo Produção Batida" (Feed Beat aggregate
// cost report) module — F-267, esteira 97-Esteiras/073, TASK-267-FE-01.
// Mirror of `languagePtBr/languageCustoProducaoBatidaReport.ts`.

import { ModuleFoodBeatAggregateReport } from '@/@types/language/module-food-beat-aggregate-report';

export const languageCustoProducaoBatidaReport: ModuleFoodBeatAggregateReport = {
  report: {
    pageTitle: 'Feed Batch Production Cost',
    pageSubtitle: 'Aggregated Feed Batch production cost report by period.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      food: 'Feed',
    },
    foodPlaceholder: 'All feeds',
    periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
    downloadPdfButton: 'Download PDF',
    downloadError: 'Could not generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
    },
  },
};
