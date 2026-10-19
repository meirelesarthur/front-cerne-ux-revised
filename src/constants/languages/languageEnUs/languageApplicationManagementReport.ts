// src/constants/languages/languageEnUs/languageApplicationManagementReport.ts
// English translation of the "Aplicação/Manejo" (Application/Management)
// module — F-230, esteira 97-Esteiras/077, F-230-plano-front.md §5. Mirror
// of `languagePtBr/languageApplicationManagementReport.ts`.

import { ModuleApplicationManagementReport } from '@/@types/language/module-application-management-report';

export const languageApplicationManagementReport: ModuleApplicationManagementReport = {
  report: {
    pageTitle: 'Application/Management',
    pageSubtitle: 'Inputs applied and labor/services per active farm area, over the period.',
    fields: {
      productionCycle: 'Production Cycle',
      areas: 'Areas',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    productionCyclePlaceholder: 'All cycles',
    areasPlaceholder: 'All areas',
    downloadPdfButton: 'Download PDF',
    downloadError: 'Could not generate the report.',
    periodRequiredHint: 'Select the period (Start Date and End Date) to generate the report.',
    validation: {
      periodRequired: 'Enter the Start Date and End Date.',
    },
  },
};
