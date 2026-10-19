// src/constants/languages/languageEsEs/languageStockConsolidatedReport.ts
// Traducción ES del módulo "Estoque Consolidado" (dominio Estoque, F-323,
// feature_id e70b8cad, esteira 97-Esteiras/079). Mirror de
// `languagePtBr/languageStockConsolidatedReport.ts`.

import { ModuleStockConsolidatedReport } from '@/@types/language/module-stock-consolidated-report';

export const languageStockConsolidatedReport: ModuleStockConsolidatedReport = {
  report: {
    pageTitle: 'Estoque Consolidado',
    pageSubtitle: 'Saldo consolidado de estoque de la finca activa, por almacén y producto.',
    fields: {
      warehouses: 'Almacenes',
      group: 'Grupo',
      category: 'Categoría',
      kind: 'Tipo',
      search: 'Buscar',
      product: 'Producto',
      date: 'Fecha',
      format: 'Formato',
    },
    placeholders: {
      warehouses: 'Seleccione los almacenes',
      group: 'Seleccione el grupo',
      category: 'Seleccione la categoría',
      categoryDisabledHint: 'Seleccione primero el grupo',
      kind: 'Seleccione el tipo',
      kindDisabledHint: 'Seleccione primero la categoría',
      product: 'Busque un producto',
    },
    formatOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Descargar Informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    warehousesRequiredHint: 'Seleccione al menos un almacén para generar el informe.',
    validation: {
      warehousesRequired: 'Seleccione al menos un almacén.',
    },
  },
};
