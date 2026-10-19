// src/constants/languages/languageEsEs/languageProfitabilityByCropReport.ts
// Traducción ES-ES del módulo "Rentabilidade/Cultura" (Rentabilidad por
// Cultivo) — F-302, esteira 077. Mirror de
// `languagePtBr/languageProfitabilityByCropReport.ts`.

import { ModuleProfitabilityByCropReport } from '@/@types/language/module-profitability-by-crop-report';

export const languageProfitabilityByCropReport: ModuleProfitabilityByCropReport = {
  report: {
    pageTitle: 'Rentabilidad/Cultivo',
    pageSubtitle: 'Consolidado de rentabilidad por cultivo/variedad, en el período.',
    fields: {
      cultivation: 'Cultivo/Variedad',
      harvest: 'Cosecha',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
    },
    cultivationPlaceholder: 'Seleccione el cultivo/variedad',
    harvestPlaceholder: 'Seleccione la cosecha (opcional)',
    downloadPdfButton: 'Descargar PDF',
    downloadError: 'No fue posible generar el informe.',
    periodRequiredHint: 'Seleccione el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    validation: {
      endDateAfterStartDate: 'La fecha de fin debe ser mayor o igual a la fecha de inicio.',
    },
  },
};
