// src/constants/languages/languageEsEs/languageTotalCostOfReproductionReport.ts
// Traducción ES-ES del módulo "Custo Total de Reprodução" (Costo Total de
// Reproducción) — F-328, esteira 97-Esteiras/008, TASK-FE-CTR-01. Mirror de
// `languagePtBr/languageTotalCostOfReproductionReport.ts`.

import { ModuleTotalCostOfReproductionReport } from '@/@types/language/module-total-cost-of-reproduction-report';

export const languageTotalCostOfReproductionReport: ModuleTotalCostOfReproductionReport = {
  report: {
    pageTitle: 'Costo Total de Reproducción',
    pageSubtitle: 'Genere el informe de costo total de reproducción en PDF o Excel.',
    filters: {
      startDate: 'Fecha Inicial',
      endDate: 'Fecha Final',
    },
    fields: {
      reportType: 'Tipo de Informe',
    },
    submitButton: 'Generar Informe',
    successToast: 'Informe generado con éxito.',
    errorToast: 'No fue posible generar el informe.',
    hint: {
      datesRequired: 'Complete la fecha inicial y final para generar el informe.',
    },
  },
};
