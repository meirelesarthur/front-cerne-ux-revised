// src/constants/languages/languageEsEs/languageCustoProducaoBatidaReport.ts
// Traducción ES del módulo "Custo Produção Batida" (informe agregado de
// Estoque — F-267, esteira 97-Esteiras/073, TASK-267-FE-01). Mirror de
// `languagePtBr/languageCustoProducaoBatidaReport.ts`.

import { ModuleFoodBeatAggregateReport } from '@/@types/language/module-food-beat-aggregate-report';

export const languageCustoProducaoBatidaReport: ModuleFoodBeatAggregateReport = {
  report: {
    pageTitle: 'Costo Producción Batida',
    pageSubtitle: 'Informe agregado de costo de producción de Batida por período.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      food: 'Ración',
    },
    foodPlaceholder: 'Todas las raciones',
    periodRequiredHint: 'Informe el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    downloadPdfButton: 'Descargar PDF',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
    },
  },
};
