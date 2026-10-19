// src/constants/languages/languageEnUs/languageAnimalFamilyTreeReport.ts
// English translation of the "Genealogical Record" module — pipeline 055,
// F-222, TASK-055-F222-FE-01. Mirror of
// `languagePtBr/languageAnimalFamilyTreeReport.ts`.

import { ModuleAnimalFamilyTreeReport } from '@/@types/language/module-animal-family-tree-report';

export const languageAnimalFamilyTreeReport: ModuleAnimalFamilyTreeReport = {
  report: {
    pageTitle: 'Genealogical Record',
    pageSubtitle:
      "PDF report of the selected animal's genealogical tree (pedigree).",
    filters: {
      animal: 'Animal',
    },
    animalPlaceholder: 'Select an animal',
    submitButton: 'Generate Report',
    validation: {
      animalRequired: 'Select an animal to generate the report.',
    },
    hint: {
      animalRequired: 'Required field.',
    },
    successToast: 'Report generated successfully.',
    errorToast: 'Could not generate the report.',
  },
};
