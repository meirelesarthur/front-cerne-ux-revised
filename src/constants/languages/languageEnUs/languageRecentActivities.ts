// src/constants/languages/languageEnUs/languageRecentActivities.ts
// EN-US translation of the "Recent Activities" module (UT-000690 / F-349 — Administrative).

import { ModuleRecentActivities } from '@/@types/language/module-recent-activities';

export const languageRecentActivities: ModuleRecentActivities = {
  recentActivity: {
    singularLabel: 'Recent activity',
    pluralLabel: 'Recent activities',
    titleModule: 'Recent Activities',
    list: {
      pageTitle: 'Recent Activities',
      pageSubtitle: "Follow the latest records entered across your account's farms.",
      table: { type: 'Type', date: 'Date', status: 'Status', farm: 'Farm', actions: 'Actions' },
      actions: {
        open: 'Open',
        openUnavailable: 'This record type has no view screen.',
        opening: 'Opening...',
      },
      emptyState: {
        titleEmpty: 'No recent activity.',
        descriptionEmpty: 'Records entered in the farms will show up here.',
        titleFiltered: 'No activity found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
      },
      filter: {
        title: 'Filter Activities',
        types: 'Activity type',
        startDate: 'Date (from)',
        endDate: 'Date (to)',
      },
    },
    types: {
      serviceOrder: 'Service order',
      animalBatchTransfer: 'Animal/batch transfer',
      batchAreaTransfer: 'Batch/area transfer',
      separation: 'Separation',
      deathAnimal: 'Deaths',
      lossAnimal: 'Losses',
      birthAnimal: 'Births',
      weaning: 'Weaning',
      weighing: 'Weighings',
      sanitary: 'Sanitary',
      pasture: 'Pastures',
      dietBeat: 'Diet batch',
      feeding: 'Feeding',
      appropriation: 'Agricultural appointment',
      marking: 'Marking',
      breedingMating: 'Mating',
      pregnancyDiagnosis: 'Pregnancy diagnosis',
      supply: 'Fueling',
      maintenance: 'Maintenance',
    },
    status: {
      created: 'Created on {{date}}',
      updated: 'Edited on {{date}}',
      dateFormat: 'MM/dd/yyyy HH:mm',
    },
    domainStatus: {
      service_order: {
        '1': 'Open',
        '2': 'In progress',
        '3': 'Completed',
        '4': 'Evaluated',
        '9': 'Cancelled',
      },
      appropriation: { O: 'Open', F: 'Finished', A: 'Appropriated' },
      maintenance: { O: 'Open', F: 'Finished', A: 'Appropriated' },
      pasture: { O: 'Open', F: 'Finished', A: 'Appropriated' },
      marking: { '1': 'Marked', '2': 'Forecast', '3': 'Done' },
      breeding_mating: { '1': 'In progress', '2': 'Finished' },
    },
    validation: {
      endBeforeStart: 'The end date cannot be earlier than the start date.',
    },
  },
};
