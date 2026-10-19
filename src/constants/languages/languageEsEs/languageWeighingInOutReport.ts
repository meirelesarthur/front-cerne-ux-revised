// src/constants/languages/languageEsEs/languageWeighingInOutReport.ts
// Traducción ES del módulo "Pesaje Entrada/Salida" (informe de Agricultura,
// F-336, esteira 058, FRONT-F336-plano.md). Mirror de
// `languagePtBr/languageWeighingInOutReport.ts`.

import { ModuleWeighingInOutReport } from '@/@types/language/module-weighing-in-out-report';

export const languageWeighingInOutReport: ModuleWeighingInOutReport = {
  report: {
    pageTitle: 'Pesaje Entrada/Salida',
    pageSubtitle: 'Informe de saldo de pesaje por cliente (entrada/salida).',
    fields: {
      startDate: 'Fecha Inicial',
      endDate: 'Fecha Final',
      product: 'Producto',
      client: 'Cliente',
      warehouse: 'Almacén',
      format: 'Formato',
    },
    formatOptions: {
      pdf: 'PDF',
      xlsx: 'Excel',
    },
    downloadButton: 'Generar Informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      periodRequired: 'Informe el período (Fecha Inicial y Fecha Final).',
      productRequired: 'Seleccione el producto.',
    },
  },
};
