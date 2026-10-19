// src/constants/languages/languageEsEs/languageSaleProductReport.ts
// Traducción ES-ES del módulo "Vendas/Produto" (Ventas/Producto) — F-315,
// esteira 051, TASK-315-FE-01. Mirror de
// `languagePtBr/languageSaleProductReport.ts`.

import { ModuleSaleProductReport } from '@/@types/language/module-sale-product-report';

export const languageSaleProductReport: ModuleSaleProductReport = {
  report: {
    pageTitle: 'Ventas/Producto',
    pageSubtitle: 'Informe de ventas agrupado por producto.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      product: 'Producto',
      type: 'Tipo',
    },
    productPlaceholder: 'Seleccione el producto',
    typeOptions: {
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
