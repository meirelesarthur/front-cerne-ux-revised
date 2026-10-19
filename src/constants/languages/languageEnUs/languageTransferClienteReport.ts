// src/constants/languages/languageEnUs/languageTransferClienteReport.ts
// English translation of the "Client Transfer Slip" module (Agriculture
// report, F-332, esteira 058, TASK-058-F332-FE-01). Mirror of
// `languagePtBr/languageTransferClienteReport.ts`.

import { ModuleTransferClienteReport } from '@/@types/language/module-transfer-cliente-report';

export const languageTransferClienteReport: ModuleTransferClienteReport = {
  report: {
    pageTitle: 'Client Transfer Slip',
    pageSubtitle: 'Transfer report by client.',
    fields: {
      client: 'Client',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    validation: {
      periodRequired: 'Enter the period (Start Date and End Date).',
    },
    downloadButton: 'Generate Report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
  },
};
