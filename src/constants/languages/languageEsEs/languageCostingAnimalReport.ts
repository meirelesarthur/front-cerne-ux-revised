// src/constants/languages/languageEsEs/languageCostingAnimalReport.ts
// Traducción ES del módulo "Custeio/Animal" (informe de costeo de Animal —
// F-248, esteira 97-Esteiras/075, TASK-CA-FE-01). Mirror de
// `languagePtBr/languageCostingAnimalReport.ts`.

import { ModuleCostingAnimalReport } from '@/@types/language/module-costing-animal-report';

export const languageCostingAnimalReport: ModuleCostingAnimalReport = {
  report: {
    pageTitle: 'Costeo/Animal',
    pageSubtitle: 'Informe de costeo de un animal por período.',
    fields: {
      animal: 'Animal',
      startDate: 'Fecha Inicial',
      endDate: 'Fecha Final',
    },
    animalPlaceholder: 'Seleccione el animal',
    periodRequiredHint:
      'Informe el animal y el período (Fecha Inicial y Fecha Final) para generar el informe.',
    exportPdfButton: 'Descargar PDF',
    exportXlsxButton: 'Descargar Excel',
    successToast: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicial y Fecha Final) es obligatorio.',
      animalRequired: 'El animal es obligatorio.',
    },
  },
};
