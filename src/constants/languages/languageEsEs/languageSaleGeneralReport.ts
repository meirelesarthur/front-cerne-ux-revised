// src/constants/languages/languageEsEs/languageSaleGeneralReport.ts
// Traducción ES-ES del módulo "Vendas/Cliente" (Ventas/Cliente) — F-317,
// esteira 077. Mirror de `languagePtBr/languageSaleGeneralReport.ts`.

import { ModuleSaleGeneralReport } from '@/@types/language/module-sale-general-report';

export const languageSaleGeneralReport: ModuleSaleGeneralReport = {
  report: {
    pageTitle: 'Cliente',
    pageSubtitle: 'Informe de ventas por cliente y producto, sin agrupación.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      client: 'Cliente',
      product: 'Producto',
      reportType: 'Formato',
    },
    clientPlaceholder: 'Seleccione el cliente',
    productPlaceholder: 'Seleccione el producto',
    formatOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Descargar Informe',
    downloadError: 'No fue posible generar el informe.',
    downloadSuccess: 'Informe generado con éxito.',
    periodRequiredHint: 'Informe el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    validation: {
      startDateRequired: 'La fecha de inicio es obligatoria.',
      endDateRequired: 'La fecha de fin es obligatoria.',
      endDateAfterStartDate: 'La fecha de fin debe ser mayor o igual a la fecha de inicio.',
    },
  },
};
