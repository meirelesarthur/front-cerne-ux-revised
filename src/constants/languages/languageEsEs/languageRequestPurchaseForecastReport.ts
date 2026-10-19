// src/constants/languages/languageEsEs/languageRequestPurchaseForecastReport.ts
// Traducción ES-ES del módulo "Productos x Prev. Entrega" (Produtos x Prev.
// Entrega) — F-309, esteira 058, TASK-058-F309-FE-01. Mirror de
// `languagePtBr/languageRequestPurchaseForecastReport.ts`.

import { ModuleRequestPurchaseForecastReport } from '@/@types/language/module-request-purchase-forecast-report';

export const languageRequestPurchaseForecastReport: ModuleRequestPurchaseForecastReport = {
  report: {
    pageTitle: 'Productos x Prev. Entrega',
    pageSubtitle: 'Informe de productos x previsión de entrega por período.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      farm: 'Finca',
      user: 'Solicitante',
      status: 'Estado',
      priority: 'Prioridad',
      authorizer: 'Autorizador',
      number: 'Número',
      product: 'Producto',
      service: 'Descripción/Servicio',
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
