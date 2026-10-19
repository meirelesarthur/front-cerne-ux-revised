// src/constants/languages/languageEsEs/languageSaleClientReport.ts
// Traducción ES-ES del módulo "Cliente/Produto" (Cliente/Producto) — F-313,
// esteira 054. Mirror de `languagePtBr/languageSaleClientReport.ts`.

import { ModuleSaleClientReport } from '@/@types/language/module-sale-client-report';

export const languageSaleClientReport: ModuleSaleClientReport = {
  report: {
    pageTitle: 'Cliente/Producto',
    pageSubtitle: 'Informe de ventas agrupado por cliente y producto.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      client: 'Cliente',
      product: 'Producto',
      type: 'Tipo',
    },
    clientPlaceholder: 'Seleccione el cliente',
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
