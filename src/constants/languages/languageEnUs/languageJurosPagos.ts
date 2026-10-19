// src/constants/languages/languageEnUs/languageJurosPagos.ts
// English translation of the "Juros Pagos" (Interest Paid) module — F-290,
// esteira 97-Esteiras/073, TASK-290-FE-02. Mirror of
// `languagePtBr/languageJurosPagos.ts`.

import { ModulePaidInterestReport } from '@/@types/language/module-paid-interest-report';

export const languageJurosPagos: ModulePaidInterestReport = {
  report: {
    pageTitle: 'Interest Paid',
    pageSubtitle: 'Interest paid report for the active farm.',
    fields: {
      providers: 'Provider',
      proprietary: 'Proprietary',
      startDate: 'Start Date',
      endDate: 'End Date',
      farm: 'Farm',
    },
    providersPlaceholder: 'All providers',
    proprietaryPlaceholder: 'All proprietaries',
    farmPlaceholder: 'All',
    periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
    downloadPdfButton: 'Download PDF',
    downloadError: 'Could not generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
    },
  },
};
