// src/constants/languages/languageEsEs/languageAccumulatedDepreciationReport.ts
// Traducción ES del módulo "Depreciación Acumulada" (informe de Bienes/
// Equipos — F-216, CONTRATO-F216-depreciacao-acumulada.md §6). Mirror de
// `languagePtBr/languageAccumulatedDepreciationReport.ts`.

import { ModuleAccumulatedDepreciationReport } from '@/@types/language/module-accumulated-depreciation-report';

export const languageAccumulatedDepreciationReport: ModuleAccumulatedDepreciationReport = {
  report: {
    pageTitle: 'Depreciación Acumulada',
    pageSubtitle: 'Informe de depreciación acumulada de bienes/equipos por familia, estado y período.',
    fields: {
      family: 'Familia',
      status: 'Estado',
      startDate: 'Fecha Inicial',
      endDate: 'Fecha Final',
    },
    statusOptions: {
      active: 'Activo',
      inactive: 'Inactivo',
    },
    downloadPdfButton: 'Descargar PDF',
    downloadError: 'No fue posible generar el informe.',
    periodRequiredHint: 'Seleccione Familia, Estado y el período para generar el informe.',
    toasts: {
      success: 'Informe generado con éxito.',
      genericError: 'No fue posible generar el informe.',
    },
    validation: {
      familyRequired: 'La Familia es obligatoria.',
      statusRequired: 'El Estado es obligatorio.',
      startDateRequired: 'La Fecha Inicial es obligatoria.',
      endDateRequired: 'La Fecha Final es obligatoria.',
      endDateBeforeStartDate: 'La Fecha Final debe ser igual o posterior a la Fecha Inicial.',
    },
  },
};
