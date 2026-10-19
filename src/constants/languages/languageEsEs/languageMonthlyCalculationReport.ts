// src/constants/languages/languageEsEs/languageMonthlyCalculationReport.ts
// Traducción ES del módulo "Apuração Mensal" (Cálculo Mensual — Informes >
// Gestión Personal, F-285, `97-Esteiras/007`, TASK-07-57). Mirror de
// `languagePtBr/languageMonthlyCalculationReport.ts`.

import { ModuleMonthlyCalculationReport } from '@/@types/language/module-monthly-calculation-report';

export const languageMonthlyCalculationReport: ModuleMonthlyCalculationReport = {
  report: {
    pageTitle: 'Cálculo Mensual',
    pageSubtitle: 'Genere el informe de cálculo mensual en PDF.',
    filters: {
      month: 'Mes',
      year: 'Año',
      reportType: 'Tipo de Informe',
      type: 'Tipo',
      employees: 'Empleados',
    },
    reportTypeOptions: {
      1: 'Sintético',
      2: 'Analítico',
      3: 'Remesa Nómina',
      4: 'Remesa Cheque',
    },
    typeOptions: {
      N: 'Nómina Normal',
      A: 'Anticipo 13º',
      D: '13º Salario',
    },
    submitButton: 'Generar Informe',
    successToast: 'Informe generado con éxito.',
    errorToast: 'No fue posible generar el informe.',
    hint: {
      requiredFieldsMissing: 'Complete mes, año y tipo de informe para generar el informe.',
    },
  },
};
