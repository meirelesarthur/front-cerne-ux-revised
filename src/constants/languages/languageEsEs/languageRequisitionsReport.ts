// src/constants/languages/languageEsEs/languageRequisitionsReport.ts
// Traducción ES-ES del módulo "Requisición/Salida" (informe de Existencias —
// F-312, esteira 97-Esteiras/078, TASK-F312-F01). Mirror de
// `languagePtBr/languageRequisitionsReport.ts`.

import { ModuleRequisitionsReport } from '@/@types/language/module-requisitions-report';

export const languageRequisitionsReport: ModuleRequisitionsReport = {
  report: {
    pageTitle: 'Requisición/Salida',
    pageSubtitle: 'Informe de requisiciones de salida de productos del inventario.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      warehouse: 'Almacén',
      product: 'Producto',
    },
    warehousePlaceholder: 'Todos',
    productPlaceholder: 'Seleccione',
    downloadPdfButton: 'Descargar PDF',
    downloadExcelButton: 'Descargar Excel',
    exportFileName: 'relatorio_requisicao_saida',
    popupBlocked: 'No fue posible abrir la nueva pestaña. Verifique el bloqueador de pop-ups.',
    toasts: {
      success: 'Informe generado con éxito.',
      genericError: 'No fue posible generar el informe.',
    },
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
      endDateAfterStartDate: 'La Fecha Fin debe ser igual o posterior a la Fecha Inicio.',
    },
  },
};
