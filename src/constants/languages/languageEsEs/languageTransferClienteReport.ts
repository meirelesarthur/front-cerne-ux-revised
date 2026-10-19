// src/constants/languages/languageEsEs/languageTransferClienteReport.ts
// Traducción ES del módulo "Romaneo Cliente" (informe de Agricultura, F-332,
// esteira 058, TASK-058-F332-FE-01). Mirror de
// `languagePtBr/languageTransferClienteReport.ts`.

import { ModuleTransferClienteReport } from '@/@types/language/module-transfer-cliente-report';

export const languageTransferClienteReport: ModuleTransferClienteReport = {
  report: {
    pageTitle: 'Romaneo Cliente',
    pageSubtitle: 'Informe de transferencias por cliente.',
    fields: {
      client: 'Cliente',
      startDate: 'Fecha Inicial',
      endDate: 'Fecha Final',
    },
    validation: {
      periodRequired: 'Informe el período (Fecha Inicial y Fecha Final).',
    },
    downloadButton: 'Generar Informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
  },
};
