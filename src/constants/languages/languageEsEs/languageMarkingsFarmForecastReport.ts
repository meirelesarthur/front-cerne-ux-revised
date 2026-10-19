// src/constants/languages/languageEsEs/languageMarkingsFarmForecastReport.ts
// Traducción ES del módulo "Previsión Finca/Ingreso" (informe de
// Agricultura, F-281, esteira 055, TASK-055-F281-FRONT-01). Mirror de
// `languagePtBr/languageMarkingsFarmForecastReport.ts`. Corrige la pantalla
// legado, que mostraba `harvestOrderOptions` en español sin importar el
// idioma activo (FID-G3F CL-016/RN-13).

import { ModuleMarkingsFarmForecastReport } from '@/@types/language/module-markings-farm-forecast-report';

export const languageMarkingsFarmForecastReport: ModuleMarkingsFarmForecastReport = {
  report: {
    pageTitle: 'Previsión Finca/Ingreso',
    pageSubtitle: 'Informe de previsión de cosecha e ingreso de la finca activa.',
    fields: {
      startDate: 'Fecha Inicial',
      endDate: 'Fecha Final',
      cultivation: 'Variedad',
      forecast: 'Orden de la Cosecha',
      week: 'Semana',
      year: 'Año',
    },
    cultivationPlaceholder: 'Todas las variedades',
    forecastPlaceholder: 'Todas las cosechas',
    downloadButton: 'Generar PDF',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    harvestOrderOptions: {
      first: '1ª Cosecha',
      second: '2ª Cosecha',
      third: '3ª Cosecha',
    },
    validation: {
      periodInvalidRange: 'La Fecha Final debe ser mayor o igual que la Fecha Inicial.',
      weekInvalid: 'Informe una semana válida (1 a 53).',
      yearInvalid: 'Informe un año válido (4 dígitos).',
    },
  },
};
