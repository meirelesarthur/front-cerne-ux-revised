// src/constants/languages/languageEsEs/languageSavingsReport.ts
// Traducción ES-ES del módulo "Savings" (informe de Suministros — F-319,
// esteira 97-Esteiras/013, TASK-013-F319-FE-01/02). Mirror de
// `languagePtBr/languageSavingsReport.ts`.

import { ModuleSavingsReport } from '@/@types/language/module-savings-report';

export const languageSavingsReport: ModuleSavingsReport = {
  report: {
    pageTitle: 'Savings',
    pageSubtitle: 'Informe de savings aplicados en cotizaciones de compra.',
    fields: {
      farmUuid: 'Finca',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      status: 'Estado',
      userId: 'Comprador Responsable',
    },
    statusPlaceholder: 'Seleccione',
    userIdPlaceholder: 'Seleccione',
    selectAll: 'Marcar todos',
    deselectAll: 'Desmarcar todos',
    farmSearchPlaceholder: 'Buscar finca...',
    farmEmptyLabel: 'Ninguna finca encontrada.',
    downloadPdfButton: 'Generar PDF',
    downloadExcelButton: 'Generar Excel',
    downloadError: 'No fue posible generar el informe.',
    popupBlocked: 'No fue posible abrir la nueva pestaña. Verifique el bloqueador de pop-ups.',
    exportFileName: 'savings',
    toasts: {
      success: 'Informe generado con éxito.',
      genericError: 'No fue posible generar el informe.',
    },
    validation: {
      farmRequired: 'Seleccione al menos una finca.',
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
      endDateAfterStartDate: 'La Fecha Fin debe ser igual o posterior a la Fecha Inicio.',
    },
  },
};
