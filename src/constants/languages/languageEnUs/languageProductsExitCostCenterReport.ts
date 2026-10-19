// src/constants/languages/languageEnUs/languageProductsExitCostCenterReport.ts
// English translation of the "Products Exit x Cost Center" module (Stock
// report — F-301, esteira 97-Esteiras/078, TASK-F301-F01). Mirror of
// `languagePtBr/languageProductsExitCostCenterReport.ts`.

import { ModuleProductsExitCostCenterReport } from '@/@types/language/module-products-exit-cost-center-report';

export const languageProductsExitCostCenterReport: ModuleProductsExitCostCenterReport = {
  report: {
    pageTitle: 'Products Exit x Cost Center',
    pageSubtitle: 'Report of product exits grouped by cost center.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      center: 'Cost Center',
      warehouse: 'Warehouse',
      product: 'Product',
    },
    centerPlaceholder: 'All',
    warehousePlaceholder: 'All',
    productPlaceholder: 'Select',
    downloadPdfButton: 'Download PDF',
    downloadExcelButton: 'Download Excel',
    exportFileName: 'relatorio_saida_prod_x_centro_custo',
    popupBlocked: 'Could not open the new tab. Check your pop-up blocker.',
    toasts: {
      success: 'Report generated successfully.',
      genericError: 'Could not generate the report.',
    },
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
      endDateAfterStartDate: 'The end date must be on or after the start date.',
    },
  },
};
