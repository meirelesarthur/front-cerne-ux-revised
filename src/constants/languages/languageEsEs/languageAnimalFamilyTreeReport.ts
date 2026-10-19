// src/constants/languages/languageEsEs/languageAnimalFamilyTreeReport.ts
// Traducción ES del módulo "Registro Genealógico" — esteira 055, F-222,
// TASK-055-F222-FE-01. Mirror de
// `languagePtBr/languageAnimalFamilyTreeReport.ts`.

import { ModuleAnimalFamilyTreeReport } from '@/@types/language/module-animal-family-tree-report';

export const languageAnimalFamilyTreeReport: ModuleAnimalFamilyTreeReport = {
  report: {
    pageTitle: 'Registro Genealógico',
    pageSubtitle: 'Informe en PDF del árbol genealógico (pedigrí) del animal seleccionado.',
    filters: {
      animal: 'Animal',
    },
    animalPlaceholder: 'Seleccione un animal',
    submitButton: 'Generar Informe',
    validation: {
      animalRequired: 'Seleccione un animal para generar el informe.',
    },
    hint: {
      animalRequired: 'Campo obligatorio.',
    },
    successToast: 'Informe generado con éxito.',
    errorToast: 'No fue posible generar el informe.',
  },
};
