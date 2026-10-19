// src/constants/languages/languageEsEs/languageStockProviderLotReport.ts
// Traducción ES del módulo "Lote/Proveedor" (dominio Estoque, F-324,
// esteira 97-Esteiras/052, TASK-052-324-FE-01). Mirror de
// `languagePtBr/languageStockProviderLotReport.ts`.

import { ModuleStockProviderLotReport } from '@/@types/language/module-stock-provider-lot-report';

export const languageStockProviderLotReport: ModuleStockProviderLotReport = {
  report: {
    pageTitle: 'Lote/Proveedor',
    pageSubtitle: 'Informe de lote por proveedor de la finca activa.',
    fields: {
      provider: 'Proveedor',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      format: 'Formato',
    },
    providerPlaceholder: 'Seleccione el proveedor',
    downloadButton: 'Generar informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      endDateBeforeStartDate: 'La Fecha Fin debe ser igual o posterior a la Fecha Inicio.',
    },
  },
};
