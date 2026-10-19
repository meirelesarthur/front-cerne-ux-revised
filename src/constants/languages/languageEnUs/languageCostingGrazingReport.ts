// src/constants/languages/languageEnUs/languageCostingGrazingReport.ts
// English translation of the "Custeio/Módulo" (Grazing Module Costing
// report) module — F-250, esteira 97-Esteiras/080, TASK-CM-FE-01. Mirror of
// `languagePtBr/languageCostingGrazingReport.ts`.

import { ModuleCostingGrazingReport } from '@/@types/language/module-costing-grazing-report';

export const languageCostingGrazingReport: ModuleCostingGrazingReport = {
  report: {
    pageTitle: 'Grazing Module Costing',
    pageSubtitle: 'Grazing module costing report by period.',
    fields: {
      grazings: 'Module',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    grazingsPlaceholder: 'Select the module(s) (optional)',
    periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
    exportPdfButton: 'Download PDF',
    exportXlsxButton: 'Download Excel',
    successToast: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
      formInvalid: 'Fix the highlighted fields before continuing.',
    },
  },
};
