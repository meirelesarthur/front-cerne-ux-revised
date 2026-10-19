// src/constants/languages/languageEsEs/languageMarkingForecastHarvestAreaReport.ts
// Traducción ES-ES del módulo "Previsión Cosecha/Área" (informe de
// Agricultura — F-282, ejecución 059). Mirror estructural del bloque
// `report` de `languageMarkingForecastAreaReport.ts` (F-280).

import { ModuleMarkingForecastHarvestAreaReport } from '@/@types/language/module-marking-forecast-harvest-area-report';

export const languageMarkingForecastHarvestAreaReport: ModuleMarkingForecastHarvestAreaReport = {
  report: {
    pageTitle: 'Previsión Cosecha/Área',
    pageSubtitle: 'Informe de previsión de cosecha por área, ciclo de producción y cultivo.',
    fields: {
      productionCycle: 'Ciclo de Producción',
      areas: 'Áreas',
      startDate: 'Fecha Inicial',
      endDate: 'Fecha Final',
      cultivation: 'Cultivo/Variedad',
      forecast: 'Cosecha',
      week: 'Semana',
      year: 'Año',
    },
    productionCyclePlaceholder: 'Seleccione el ciclo de producción',
    areasPlaceholder: 'Seleccione las áreas',
    cultivationPlaceholder: 'Seleccione el cultivo/variedad',
    forecastPlaceholder: 'Seleccione la cosecha',
    forecastOrderLabel: (order: number) => `${order}ª Cosecha`,
    downloadPdfButton: 'Descargar PDF',
    downloadError: 'No fue posible generar el informe.',
    toasts: {
      success: 'Informe generado con éxito.',
      genericError: 'No fue posible generar el informe.',
    },
    validation: {
      endDateAfterStartDate: 'La Fecha Final debe ser igual o posterior a la Fecha Inicial.',
    },
  },
};
