// src/constants/languages/languageEsEs/languageMovimentacaoEstoqueReport.ts
// Traducción ES del módulo "Movimentação de Estoque" (informe de Estoque —
// F-1f1d23e3, esteira 97-Esteiras/074, TASK-MOV-FE-01). Mirror de
// `languagePtBr/languageMovimentacaoEstoqueReport.ts`.

import { ModuleStockMovementReport } from '@/@types/language/module-stock-movement-report';

export const languageMovimentacaoEstoqueReport: ModuleStockMovementReport = {
  report: {
    pageTitle: 'Movimiento de Estoque',
    pageSubtitle: 'Informe de movimiento de estoque del almacén seleccionado.',
    fields: {
      warehouse: 'Almacén',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      products: 'Producto',
    },
    warehousePlaceholder: 'Seleccione un almacén',
    productsPlaceholder: 'Todos los productos',
    warehouseRequiredHint: 'Seleccione un almacén para generar el informe.',
    downloadPdfButton: 'Descargar PDF',
    downloadExcelButton: 'Descargar Excel',
    downloadError: 'No fue posible generar el informe.',
    toasts: {
      success: 'Informe generado con éxito.',
      genericError: 'No fue posible generar el informe.',
    },
    validation: {
      warehouseRequired: 'El almacén es obligatorio.',
      endDateAfterStartDate: 'La fecha fin debe ser mayor o igual a la fecha inicio.',
    },
  },
};
