// src/constants/languages/languageEsEs/languageAnsReport.ts
// Traducción ES-ES del módulo "ANS" (informe de Suprimentos — F-229, lote 076).
// Mirror de `languagePtBr/languageAnsReport.ts`.

import { ModuleAnsReport } from '@/@types/language/module-ans-report';

export const languageAnsReport: ModuleAnsReport = {
  report: {
    pageTitle: 'ANS',
    pageSubtitle:
      'Informe de Acuerdo de Nivel de Servicio de las solicitudes de compra, filtrable por período.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
    },
    exportPdfButton: 'Descargar PDF',
    exportXlsxButton: 'Descargar Excel',
    successToast: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    periodRequiredHint:
      'Seleccione el período (Fecha Inicio y Fecha Fin) para habilitar la descarga.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
    },
  },
};
