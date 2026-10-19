// src/constants/languages/languageEsEs/languageDepreciationForecast.ts
// Traducción ES-ES del módulo de PREVISIÓN DE DEPRECIACIÓN (Registros Base /
// Bienes-Activos). TASK-FE-230: pantalla única de lectura/simulación, sin
// list/filter.

import { ModuleDepreciationForecast } from '@/@types/language/module-depreciation-forecast';

export const languageDepreciationForecast: ModuleDepreciationForecast = {
  form: {
    title: 'Previsión de Depreciación',
    fields: {
      equipment: 'Bien inmovilizado',
      forecastTime: 'Horizonte de Previsión',
    },
    placeholders: {
      select: 'Seleccione',
    },
    forecastOptions: [
      '3 meses',
      '6 meses',
      '9 meses',
      '12 meses',
      '15 meses',
      '18 meses',
      '21 meses',
      '24 meses',
      '27 meses',
      '30 meses',
      '33 meses',
      '36 meses',
      '39 meses',
      '42 meses',
      '45 meses',
      '48 meses',
    ],
  },
  result: {
    table: {
      month: 'Mes/Año',
      valueToDepreciate: 'Vl. a depreciar',
      monthlyDepreciation: 'Vl. Dep. Mes',
      remainingBalance: 'Sd. a Depreciar',
      monthAbbreviations: [
        'Ene',
        'Feb',
        'Mar',
        'Abr',
        'May',
        'Jun',
        'Jul',
        'Ago',
        'Sep',
        'Oct',
        'Nov',
        'Dic',
      ],
    },
    empty: {
      selectPrompt: 'Seleccione un equipo y el horizonte para simular la previsión.',
      noDepreciation: 'El equipo seleccionado no posee depreciación.',
    },
    error: {
      title: 'No fue posible calcular la previsión',
      description:
        'Ocurrió un error al consultar la previsión de depreciación. Intente nuevamente.',
      retry: 'Intentar nuevamente',
    },
  },
};
