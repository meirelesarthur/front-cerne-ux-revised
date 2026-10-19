// src/constants/languages/languageEsEs/languageMarkingForecastAreaReport.ts
// Traducción ES del módulo "Prev. Área/Receita" (informe de Agricultura —
// F-280, esteira 97-Esteiras/075, TASK-MFA-FE-01). Mirror de
// `languagePtBr/languageMarkingForecastAreaReport.ts`.

import { ModuleMarkingForecastAreaReport } from '@/@types/language/module-marking-forecast-area-report';

export const languageMarkingForecastAreaReport: ModuleMarkingForecastAreaReport = {
  report: {
    pageTitle: 'Prev. Área/Ingreso',
    pageSubtitle: 'Informe de previsión de área e ingreso por ciclo de producción.',
    fields: {
      productionCycle: 'Ciclo de Producción',
      areas: 'Área',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      variety: 'Variedad',
      order: 'Cosecha',
      week: 'Semana Año',
      year: 'Año',
    },
    productionCyclePlaceholder: 'Seleccione un ciclo de producción',
    areasPlaceholder: 'Seleccione una o más áreas',
    varietyPlaceholder: 'Seleccione una variedad',
    harvestOrderLabel: (order: number) => `${order}ª Cosecha`,
    downloadPdfButton: 'Descargar PDF',
    downloadError: 'No fue posible generar el informe.',
    toasts: {
      success: 'Informe generado con éxito.',
      genericError: 'No fue posible generar el informe.',
    },
    validation: {
      endDateAfterStartDate: 'La fecha fin debe ser mayor o igual a la fecha inicio.',
    },
  },
};
