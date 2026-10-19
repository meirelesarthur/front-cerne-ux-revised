// src/constants/languages/languageEnUs/languageFindAnimal.ts
// Tradução EN-US do módulo "Localizar Animal" (FindAnimal — Operacional >
// Pecuária > Manejo, F-042, TASK-FA-FE-01). Ver `languagePtBr/languageFindAnimal.ts`
// para a origem/fidelidade dos valores pt-BR (legado); esta coluna é NOVA por
// necessidade da Lei 10 (a SPA é trilíngue), não mudança de comportamento.

import { ModuleFindAnimal } from '@/@types/language/module-find-animal';

export const languageFindAnimal: ModuleFindAnimal = {
  findAnimal: {
    singularLabel: 'Find Animal',
    pluralLabel: 'Find Animal',
    pageTitle: 'Find Animal',
    filter: {
      animalLabel: 'Animal',
      animalPlaceholder: 'Select the animal',
      submit: 'Filter',
    },
    panels: {
      animal: 'Animal',
      reproductive: 'Reproductive',
      batch: 'Batch',
      grazing: 'Module',
      area: 'Area',
      mother: 'Mother',
    },
    fields: {
      identification: 'Identification',
      category: 'Category',
      age: 'Age',
      weight: 'Current Weight',
      father: 'Sire ID',
      categoryMatrix: 'Reproductive Stage',
      reproductiveStatus: 'Reproductive Status',
      lastSemen: 'Last Semen',
      currentBatches: 'Current Batch',
      code: 'Code',
      quantityAnimal: 'Animal Count',
      employeeName: 'Responsible',
      description: 'Description',
      fodder: 'Forage',
      totalArea: 'Total Area',
      recreationArea: 'Recreation Area',
      productiveArea: 'Productive Area',
      unproductiveArea: 'Unproductive Area',
    },
    emptyState: {
      noAnimalSelected: 'No animal selected.',
      noBatchLinked: 'Animal is not linked to any batch!',
    },
    placeholders: {
      notInformed: 'Not Informed',
      dash: '--',
    },
    transfer: {
      label: 'Transfer to Batch',
      placeholder: 'Select',
      submit: 'Save',
      successToast: 'Animal successfully transferred to batch.',
      validation: {
        batchRequired: 'Select a batch for the transfer.',
      },
    },
    error: {
      message: 'Could not load the animal information.',
      notFound: 'Animal not found.',
      retry: 'Try again',
    },
  },
};
