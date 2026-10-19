// src/constants/languages/languageEsEs/languageSuppliesReport.ts
// Traducción ES-ES del módulo "Suministros" (informe de Suministros — F-325,
// esteira CORE_WORKSPACE/97-Esteiras/015, Tarefa 52). Mirror de
// `languagePtBr/languageSuppliesReport.ts`.

import { ModuleSuppliesReport } from '@/@types/language/module-supplies-report';

export const languageSuppliesReport: ModuleSuppliesReport = {
  report: {
    pageTitle: 'Suministros',
    pageSubtitle: 'Informe de solicitudes de compra de Suministros.',
    fields: {
      farmUuid: 'Finca',
      userUuid: 'Solicitante',
      authorizerUuid: 'Autorizador',
      status: 'Estado',
      priority: 'Prioridad',
      number: 'Número',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
    },
    statusPlaceholder: 'Seleccione',
    priorityPlaceholder: 'Seleccione',
    downloadPdfButton: 'Generar PDF',
    downloadExcelButton: 'Descargar Excel',
    downloadError: 'No fue posible generar el informe.',
    popupBlocked: 'No fue posible abrir la nueva pestaña. Verifique el bloqueador de pop-ups.',
    toasts: {
      success: 'Informe generado con éxito.',
      genericError: 'No fue posible generar el informe.',
    },
    validation: {
      endDateAfterStartDate: 'La Fecha Fin debe ser igual o posterior a la Fecha Inicio.',
    },
  },
};
