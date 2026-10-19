// src/constants/languages/languageEnUs/languageTotalCostOfReproductionReport.ts
// English translation of the "Custo Total de Reprodução" (Total Reproduction
// Cost) module — F-328, esteira 97-Esteiras/008, TASK-FE-CTR-01. Mirror of
// `languagePtBr/languageTotalCostOfReproductionReport.ts`.

import { ModuleTotalCostOfReproductionReport } from '@/@types/language/module-total-cost-of-reproduction-report';

export const languageTotalCostOfReproductionReport: ModuleTotalCostOfReproductionReport = {
  report: {
    pageTitle: 'Total Reproduction Cost',
    pageSubtitle: 'Generate the total reproduction cost report in PDF or Excel.',
    filters: {
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    fields: {
      reportType: 'Report Type',
    },
    submitButton: 'Generate Report',
    successToast: 'Report generated successfully.',
    errorToast: 'Unable to generate the report.',
    hint: {
      datesRequired: 'Fill in the start and end date to generate the report.',
    },
  },
};
