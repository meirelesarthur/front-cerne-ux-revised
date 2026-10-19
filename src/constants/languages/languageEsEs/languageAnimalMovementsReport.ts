// src/constants/languages/languageEsEs/languageAnimalMovementsReport.ts
// Traducción ES-ES del módulo "Movimentação/Rebanho" (Movimiento del
// Rebaño) — F-224, lote 076, `AnimalMovementReport-contrato.md`. Mirror de
// `languagePtBr/languageAnimalMovementsReport.ts`.

import { ModuleAnimalMovementsReport } from '@/@types/language/module-animal-movements-report';

export const languageAnimalMovementsReport: ModuleAnimalMovementsReport = {
  report: {
    pageTitle: 'Movimiento del Rebaño',
    pageSubtitle:
      'Informe de movimiento del rebaño por categoría animal, en el período de la Zafra.',
    fields: {
      harvest: 'Zafra',
      month: 'Mes',
    },
    harvestPlaceholder: 'Seleccione',
    monthPlaceholder: 'MM/AAAA',
    harvestRequiredHint: 'Seleccione una zafra para generar el informe.',
    exportPdfButton: 'Descargar PDF',
    exportXlsxButton: 'Descargar Excel',
    successToast: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      harvestRequired: 'Seleccione una zafra o un mes.',
    },
  },
};
