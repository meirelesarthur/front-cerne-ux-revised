// src/constants/languages/languageEsEs/languageProductionCostingAreaReport.ts
// Traducción ES-ES del módulo "Produção/Custeio/Área" (Producción/Costeo/Área)
// — F-298, esteira 051, TASK-298-FE-01. Mirror de
// `languagePtBr/languageProductionCostingAreaReport.ts`.

import { ModuleProductionCostingAreaReport } from '@/@types/language/module-production-costing-area-report';

export const languageProductionCostingAreaReport: ModuleProductionCostingAreaReport = {
  report: {
    pageTitle: 'Producción/Costeo/Área',
    pageSubtitle: 'Informe de producción y costeo agrupado por área.',
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
