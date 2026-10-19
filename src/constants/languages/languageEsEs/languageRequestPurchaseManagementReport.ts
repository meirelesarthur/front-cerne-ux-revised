// src/constants/languages/languageEsEs/languageRequestPurchaseManagementReport.ts
// Traducción ES-ES del módulo "Gerencial de Solicitudes" (Gerencial de
// Solicitações) — F-310, esteira 053, TASK-053-F310-FE-01. Mirror de
// `languagePtBr/languageRequestPurchaseManagementReport.ts`.

import { ModuleRequestPurchaseManagementReport } from '@/@types/language/module-request-purchase-management-report';

export const languageRequestPurchaseManagementReport: ModuleRequestPurchaseManagementReport = {
  report: {
    pageTitle: 'Gerencial de Solicitudes',
    pageSubtitle: 'Informe gerencial de solicitudes de compra por período.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      farm: 'Finca',
      typeRequest: 'Tipo',
      status: 'Estado',
    },
    downloadPdfButton: 'Descargar PDF',
    downloadExcelButton: 'Descargar Excel',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
      invalidDateRange: 'La Fecha Fin debe ser mayor o igual a la Fecha Inicio.',
    },
  },
};
