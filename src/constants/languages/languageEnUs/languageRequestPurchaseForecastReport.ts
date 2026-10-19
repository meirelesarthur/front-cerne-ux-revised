// src/constants/languages/languageEnUs/languageRequestPurchaseForecastReport.ts
// English translation of the "Products x Delivery Forecast" (Produtos x
// Prev. Entrega) module — F-309, esteira 058, TASK-058-F309-FE-01. Mirror of
// `languagePtBr/languageRequestPurchaseForecastReport.ts`.

import { ModuleRequestPurchaseForecastReport } from '@/@types/language/module-request-purchase-forecast-report';

export const languageRequestPurchaseForecastReport: ModuleRequestPurchaseForecastReport = {
  report: {
    pageTitle: 'Products x Delivery Forecast',
    pageSubtitle: 'Products x delivery forecast report by period.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      farm: 'Farm',
      user: 'Requester',
      status: 'Status',
      priority: 'Priority',
      authorizer: 'Authorizer',
      number: 'Number',
      product: 'Product',
      service: 'Description/Service',
    },
    downloadPdfButton: 'Download PDF',
    downloadExcelButton: 'Download Excel',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
      invalidDateRange: 'End Date must be greater than or equal to Start Date.',
    },
  },
};
