// src/constants/languages/languageEsEs/languageProductsExitCostCenterReport.ts
// Traducción ES-ES del módulo "Salidas x Centro de Costo" (informe de
// Existencias — F-301, esteira 97-Esteiras/078, TASK-F301-F01). Mirror de
// `languagePtBr/languageProductsExitCostCenterReport.ts`.

import { ModuleProductsExitCostCenterReport } from '@/@types/language/module-products-exit-cost-center-report';

export const languageProductsExitCostCenterReport: ModuleProductsExitCostCenterReport = {
  report: {
    pageTitle: 'Salidas x Centro de Costo',
    pageSubtitle: 'Informe de salidas de productos agrupadas por centro de costo.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      center: 'Centro de Costo',
      warehouse: 'Almacén',
      product: 'Producto',
    },
    centerPlaceholder: 'Todos',
    warehousePlaceholder: 'Todos',
    productPlaceholder: 'Seleccione',
    downloadPdfButton: 'Descargar PDF',
    downloadExcelButton: 'Descargar Excel',
    exportFileName: 'relatorio_saida_prod_x_centro_custo',
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
