// src/constants/languages/languageEnUs/languageSaleEmployeeReport.ts
// English translation of the "Vendas/Funcionário" (Sales/Employee) module —
// F-314, esteira 079. Mirror of
// `languagePtBr/languageSaleEmployeeReport.ts`.

import { ModuleSaleEmployeeReport } from '@/@types/language/module-sale-employee-report';

export const languageSaleEmployeeReport: ModuleSaleEmployeeReport = {
  report: {
    pageTitle: 'Sales/Employee',
    pageSubtitle: 'Sales report grouped by employee.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      user: 'Employee',
      type: 'Type',
    },
    userPlaceholder: 'Select the employee',
    typeOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Download Report',
    downloadError: 'Could not generate the report.',
    downloadSuccess: 'Report generated successfully.',
    periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
    validation: {
      startDateRequired: 'The start date is required.',
      endDateRequired: 'The end date is required.',
      endDateAfterStartDate: 'The end date must be greater than or equal to the start date.',
    },
  },
};
