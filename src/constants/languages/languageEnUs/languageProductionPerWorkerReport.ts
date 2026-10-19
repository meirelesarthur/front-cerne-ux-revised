// src/constants/languages/languageEnUs/languageProductionPerWorkerReport.ts
// English translation of the "Prod./Colaborador" (Production/Worker) module
// — F-300, lote 079, F-300-plano-frontend.md TASK-300-FE-01. Mirror of
// `languagePtBr/languageProductionPerWorkerReport.ts`.

import { ModuleProductionPerWorkerReport } from '@/@types/language/module-production-per-worker-report';

export const languageProductionPerWorkerReport: ModuleProductionPerWorkerReport = {
  report: {
    pageTitle: 'Production/Worker',
    pageSubtitle: 'Production report grouped by worker.',
    fields: {
      teams: 'Team',
      productionCycle: 'Production Cycle',
      areas: 'Areas',
      startDate: 'Start Date',
      endDate: 'End Date',
      employees: 'Employee',
    },
    teamsPlaceholder: 'Select the teams',
    productionCyclePlaceholder: 'Select the production cycle',
    areasPlaceholder: 'Select the areas',
    employeesPlaceholder: 'Select the employees',
    downloadPdfButton: 'Download PDF',
    downloadError: 'Could not generate the report.',
    periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
    },
  },
};
