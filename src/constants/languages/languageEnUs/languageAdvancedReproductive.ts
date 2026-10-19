// src/constants/languages/languageEnUs/languageAdvancedReproductive.ts
// EN-US translation of the "Advanced Reproductive Management" module
// (AdvancedReproductive — Operational / Reproduction, F-011,
// 97-Esteiras/056, TASK-AR-FE-01).

import { ModuleAdvancedReproductive } from '@/@types/language/module-advanced-reproductive';

export const languageAdvancedReproductive: ModuleAdvancedReproductive = {
  advancedReproductive: {
    singularLabel: 'Advanced Reproductive Management',
    pluralLabel: 'Advanced Reproductive Management',
    titleModule: 'Advanced Reproductive Management',
    list: {
      pageTitle: 'Advanced Reproductive Management',
      pageSubtitle: 'Track the reproductive status of animals under breeding.',
      indicators: {
        animalsCount: 'Animals',
        pregnancyRate: 'Pregnancy Rate',
        birthAnimalsCount: 'Births',
      },
      table: {
        identification: 'Animal',
        category: 'Category',
        breedingMatingType: 'Mating Type',
        lastUpdate: 'Last Update',
        reproductiveStatus: 'Status',
        actions: 'Actions',
      },
      actions: {
        viewAnimalRecord: 'Animal Record',
        viewAnimalRecordSuccessToast: 'Record generated successfully.',
        viewAnimalRecordErrorToast: 'Could not generate the animal record.',
        viewBreedingMating: 'View Mating',
        editBreedingMating: 'Edit Mating',
        advanceProtocolStep: 'Next Step',
        finishBreedingMating: 'Finish',
        viewPregnancyDiagnosis: 'Pregnancy Diagnosis',
        deleteBreedingMating: 'Delete',
        disabledReason: 'Available once this feature is migrated to the new platform',
        deleteDialog: {
          title: 'Delete mating?',
        },
      },
      filter: {
        title: 'Filter Advanced Reproductive Management',
        search: 'Search',
        reproductiveStatus: 'Reproductive Status',
        breedingBatch: 'Breeding Batch',
        breedingSeason: 'Breeding Season',
        protocol: 'Protocol',
        bullSeedSeason: 'Bull/Semen/Embryo',
      },
      emptyState: {
        titleEmpty: 'No records found.',
        descriptionEmpty: 'There are no animals under breeding to display.',
        titleFiltered: 'No records found.',
        descriptionFiltered: 'Try adjusting the filters.',
        clearFiltersCta: 'Clear filters',
      },
    },
    reproductiveStatusOptions: {
      pregnant: 'Pregnant',
      empty: 'Empty',
      calved: 'Calved',
    },
  },
};
