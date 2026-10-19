// src/constants/languages/languageEsEs/languageWeighingStockClientReport.ts
// Traducción ES-ES del módulo "Pesaje/Almacén/Cliente" (informe de
// Inventario — F-337, ejecución 059). Mirror estructural del bloque
// `report` de `languageStockAbcReport.ts`.

import { ModuleWeighingStockClientReport } from '@/@types/language/module-weighing-stock-client-report';

export const languageWeighingStockClientReport: ModuleWeighingStockClientReport = {
  report: {
    pageTitle: 'Pesaje/Almacén/Cliente',
    pageSubtitle: 'Informe de pesaje por almacén y cliente.',
    fields: {
      product: 'Producto',
      client: 'Cliente',
      warehouse: 'Almacén',
      format: 'Formato',
    },
    formatOptions: {
      pdf: 'PDF',
      xlsx: 'Excel',
    },
    downloadButton: 'Descargar Informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
  },
};
