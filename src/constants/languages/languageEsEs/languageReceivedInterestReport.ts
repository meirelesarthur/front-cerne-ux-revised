// src/constants/languages/languageEsEs/languageReceivedInterestReport.ts
// Traducción ES del módulo "Intereses Recibidos" (informe Financiero —
// esteira 97-Esteiras/014, Tarefa 49). Mirror de
// `languagePtBr/languageReceivedInterestReport.ts`.

import { ModuleReceivedInterestReport } from '@/@types/language/module-received-interest-report';

export const languageReceivedInterestReport: ModuleReceivedInterestReport = {
  receivedInterestReport: {
    singularLabel: 'Intereses Recibidos',
    pluralLabel: 'Intereses Recibidos',
  },
  report: {
    pageTitle: 'Intereses Recibidos',
    pageSubtitle: 'Informe de intereses recibidos de la finca activa.',
    submitButton: 'Generar informe',
    fields: {
      client: 'Cliente',
      proprietary: 'Propietario',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      farm: 'Finca',
      format: 'Formato',
    },
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
      periodOrder: 'La fecha fin debe ser mayor o igual a la fecha inicio.',
    },
    empty: 'No se encontró ningún elemento.',
    error: 'Error al cargar la lista.',
    retry: 'Intentar de nuevo',
    searchPlaceholder: 'Buscar...',
    selectAll: 'Seleccionar todos',
    deselectAll: 'Deseleccionar todos',
  },
};
