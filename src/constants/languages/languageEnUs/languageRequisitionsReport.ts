// src/constants/languages/languageEnUs/languageRequisitionsReport.ts
// English translation of the "Requisition/Exit" module (Stock report —
// F-312, esteira 97-Esteiras/078, TASK-F312-F01). Mirror of
// `languagePtBr/languageRequisitionsReport.ts`.

import { ModuleRequisitionsReport } from '@/@types/language/module-requisitions-report';

export const languageRequisitionsReport: ModuleRequisitionsReport = {
  report: {
    pageTitle: 'Requisition/Exit',
    pageSubtitle: 'Report of product exit requisitions from stock.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      warehouse: 'Warehouse',
      product: 'Product',
    },
    warehousePlaceholder: 'All',
    productPlaceholder: 'Select',
    downloadPdfButton: 'Download PDF',
    downloadExcelButton: 'Download Excel',
    exportFileName: 'relatorio_requisicao_saida',
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
