// src/constants/languages/languageEnUs/languageMonthlyCalculationReport.ts
// English translation of the "Apuração Mensal" (Monthly Calculation Report)
// module (Reports > Personnel Management, F-285, `97-Esteiras/007`,
// TASK-07-57). Mirror of `languagePtBr/languageMonthlyCalculationReport.ts`.

import { ModuleMonthlyCalculationReport } from '@/@types/language/module-monthly-calculation-report';

export const languageMonthlyCalculationReport: ModuleMonthlyCalculationReport = {
  report: {
    pageTitle: 'Monthly Calculation Report',
    pageSubtitle: 'Generate the monthly calculation report in PDF.',
    filters: {
      month: 'Month',
      year: 'Year',
      reportType: 'Report Type',
      type: 'Type',
      employees: 'Employees',
    },
    reportTypeOptions: {
      1: 'Synthetic',
      2: 'Analytical',
      3: 'Payroll Remittance',
      4: 'Check Remittance',
    },
    typeOptions: {
      N: 'Regular Payroll',
      A: '13th Salary Advance',
      D: '13th Salary',
    },
    submitButton: 'Generate Report',
    successToast: 'Report generated successfully.',
    errorToast: 'Could not generate the report.',
    hint: {
      requiredFieldsMissing: 'Fill in month, year and report type to generate the report.',
    },
  },
};
