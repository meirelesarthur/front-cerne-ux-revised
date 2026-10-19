// src/constants/languages/languageEsEs/languageProductionPerWorkerReport.ts
// Traducción ES-ES del módulo "Prod./Colaborador" (Producción/Colaborador)
// — F-300, lote 079, F-300-plano-frontend.md TASK-300-FE-01. Mirror de
// `languagePtBr/languageProductionPerWorkerReport.ts`.

import { ModuleProductionPerWorkerReport } from '@/@types/language/module-production-per-worker-report';

export const languageProductionPerWorkerReport: ModuleProductionPerWorkerReport = {
  report: {
    pageTitle: 'Producción/Colaborador',
    pageSubtitle: 'Informe de producción agrupado por colaborador.',
    fields: {
      teams: 'Equipo',
      productionCycle: 'Ciclo de Producción',
      areas: 'Áreas',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      employees: 'Colaborador',
    },
    teamsPlaceholder: 'Seleccione los equipos',
    productionCyclePlaceholder: 'Seleccione el ciclo de producción',
    areasPlaceholder: 'Seleccione las áreas',
    employeesPlaceholder: 'Seleccione los colaboradores',
    downloadPdfButton: 'Descargar PDF',
    downloadError: 'No fue posible generar el informe.',
    periodRequiredHint: 'Informe el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
    },
  },
};
