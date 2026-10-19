// src/constants/languages/languageEsEs/languageAppropriationOccurrenceReport.ts
// Traducción ES-ES del módulo "Ocorrências Talhões" (Ocurrencias Parcelas) —
// F-232, Tarea 50, esteira CORE_WORKSPACE/97-Esteiras/015. Mirror de
// `languagePtBr/languageAppropriationOccurrenceReport.ts`.

import { ModuleAppropriationOccurrenceReport } from '@/@types/language/module-appropriation-occurrence-report';

export const languageAppropriationOccurrenceReport: ModuleAppropriationOccurrenceReport = {
  report: {
    pageTitle: 'Ocurrencias Parcelas',
    pageSubtitle: 'Informe de ocurrencias fitosanitarias registradas en Apropiación.',
    fields: {
      productionCycle: 'Ciclo de Producción',
      areas: 'Áreas',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
    },
    productionCyclePlaceholder: 'Seleccione el ciclo de producción',
    areasPlaceholder: 'Seleccione las áreas',
    submitButton: 'Generar Informe',
    successToast: 'Informe generado con éxito.',
    errorToast: 'No fue posible generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
      periodOrder: 'La fecha fin debe ser mayor o igual a la fecha inicio.',
    },
  },
};
