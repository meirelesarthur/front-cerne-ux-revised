// src/constants/languages/languageEnUs/languageAnimalMovementsReport.ts
// English translation of the "Animal Movements" (Movimentação/Rebanho)
// module — F-224, lote 076, `AnimalMovementReport-contrato.md`. Mirror of
// `languagePtBr/languageAnimalMovementsReport.ts`.

import { ModuleAnimalMovementsReport } from '@/@types/language/module-animal-movements-report';

export const languageAnimalMovementsReport: ModuleAnimalMovementsReport = {
  report: {
    pageTitle: 'Herd Movement',
    pageSubtitle: 'Herd movement report by animal category, over the Harvest period.',
    fields: {
      harvest: 'Harvest',
      month: 'Month',
    },
    harvestPlaceholder: 'Select',
    monthPlaceholder: 'MM/YYYY',
    harvestRequiredHint: 'Select a harvest to generate the report.',
    exportPdfButton: 'Download PDF',
    exportXlsxButton: 'Download Excel',
    successToast: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      harvestRequired: 'Select a harvest or a month.',
    },
  },
};
