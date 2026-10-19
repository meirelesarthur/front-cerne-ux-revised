// src/constants/languages/languageEsEs/languageStockAbcReport.ts
// Traducción ES del módulo "Curva ABC/Estoque" (dominio Estoque, F-322,
// esteira 97-Esteiras/077). Mirror de
// `languagePtBr/languageStockAbcReport.ts`.

import { ModuleStockAbcReport } from '@/@types/language/module-stock-abc-report';

export const languageStockAbcReport: ModuleStockAbcReport = {
  report: {
    pageTitle: 'Curva ABC/Estoque',
    pageSubtitle: 'Clasificación ABC del estoque de la finca activa por valor total.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      format: 'Formato',
    },
    formatOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Generar informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      endDateBeforeStartDate: 'La Fecha Fin debe ser igual o posterior a la Fecha Inicio.',
    },
  },
};
