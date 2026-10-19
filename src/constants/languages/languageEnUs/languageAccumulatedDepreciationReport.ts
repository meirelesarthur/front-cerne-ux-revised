// src/constants/languages/languageEnUs/languageAccumulatedDepreciationReport.ts
// English translation of the "Accumulated Depreciation Report" module (F-216,
// CONTRATO-F216-depreciacao-acumulada.md §6). Mirror of
// `languagePtBr/languageAccumulatedDepreciationReport.ts`.

import { ModuleAccumulatedDepreciationReport } from '@/@types/language/module-accumulated-depreciation-report';

export const languageAccumulatedDepreciationReport: ModuleAccumulatedDepreciationReport = {
  report: {
    pageTitle: 'Accumulated Depreciation',
    pageSubtitle: 'Equipment accumulated depreciation report by family, status and period.',
    fields: {
      family: 'Family',
      status: 'Status',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    statusOptions: {
      active: 'Active',
      inactive: 'Inactive',
    },
    downloadPdfButton: 'Download PDF',
    downloadError: 'Could not generate the report.',
    periodRequiredHint: 'Select Family, Status and the period to generate the report.',
    toasts: {
      success: 'Report generated successfully.',
      genericError: 'Could not generate the report.',
    },
    validation: {
      familyRequired: 'Family is required.',
      statusRequired: 'Status is required.',
      startDateRequired: 'Start Date is required.',
      endDateRequired: 'End Date is required.',
      endDateBeforeStartDate: 'End Date must be on or after Start Date.',
    },
  },
};
