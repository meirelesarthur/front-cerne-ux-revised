// src/constants/languages/languageEsEs/languageCostingAreaReport.ts
// Traducción ES-ES del módulo "Custeio/Área" (Costeo/Área) — F-252, esteira
// 079, TASK-252-FE-01. Mirror de
// `languagePtBr/languageCostingAreaReport.ts`.

import { ModuleCostingAreaReport } from '@/@types/language/module-costing-area-report';

export const languageCostingAreaReport: ModuleCostingAreaReport = {
  report: {
    pageTitle: 'Costeo/Área',
    pageSubtitle: 'Informe de costeo agrupado por área.',
    fields: {
      productionCycle: 'Ciclo de Producción',
      areas: 'Áreas',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
    },
    productionCyclePlaceholder: 'Seleccione el ciclo de producción',
    areasPlaceholder: 'Seleccione las áreas',
    downloadPdfButton: 'Descargar PDF',
    downloadError: 'No fue posible generar el informe.',
    periodRequiredHint: 'Informe el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
    },
  },
};
