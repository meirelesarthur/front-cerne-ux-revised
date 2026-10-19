// src/constants/languages/languageEnUs/languageFeedingPhases.ts
// English translation of the "Feeding Phases" module (FeedingPhase —
// Operational/Livestock/Feedlot, F-034, TASK-FP-FE-01). Structure mirrors
// `languagePtBr/languageFeedingPhases.ts`.

import { ModuleFeedingPhases } from '@/@types/language/module-feeding-phases';

export const languageFeedingPhases: ModuleFeedingPhases = {
  feedingPhase: {
    singularLabel: 'Feeding Phase',
    pluralLabel: 'Feeding Phases',
    list: {
      pageTitle: 'Feeding Phases',
      pageSubtitle: 'Manage the registered feeding phases.',
      deletedToast: 'Feeding phase deleted successfully',
      columns: {
        code: 'Code',
        name: 'Name',
        responsible: 'Responsible Employee',
        createdAt: 'Created',
        updatedAt: 'Updated',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No feeding phase registered.',
        descriptionEmpty: 'Start by adding the first feeding phase.',
        titleFiltered: 'No feeding phase found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add Feeding Phase',
      },
    },
    filter: {
      title: 'Filter feeding phases',
      name: 'Name',
      namePlaceholder: 'Search by name',
      diet: 'Diet',
      dietAll: 'All',
      changeRule: 'Change Rule',
      changeRuleAll: 'All',
    },
    form: {
      title: {
        create: 'New Feeding Phase',
        edit: 'Edit Feeding Phase',
      },
      fields: {
        code: 'Code',
        responsible: 'Responsible Employee',
        date: 'Date',
        name: 'Phase Name',
        observation: 'Observation',
      },
      changeRuleOptions: {
        byDays: 'By Days',
        byWeight: 'By Weight',
      },
      items: {
        title: 'Phase Items',
        sequence: 'Order',
        diet: 'Diet',
        changeRule: 'Change Rule',
        minimumStart: 'Minimum/Start',
        maximumEnd: 'Maximum/End',
        addItem: 'Add Item',
        removeItem: 'Remove',
      },
      validation: {
        dateRequired: 'Enter the date.',
        nameRequired: 'Enter the phase name.',
        nameMax: 'The name must have at most 120 characters.',
        observationMax: 'The observation must have at most 1500 characters.',
        itemsMin: 'Add at least one item.',
        itemDietRequired: 'Select the diet.',
        itemChangeRuleRequired: 'Select the change rule.',
        itemMinimumStartMin: 'Enter an integer value greater than or equal to 1.',
        itemMaximumEndMin: 'Enter an integer value greater than or equal to 1.',
        itemMinimumStartExceedsMaximumEnd:
          'The Minimum/Start cannot be greater than the Maximum/End.',
        itemMinimumStartMustExceedPreviousMaximumEnd:
          'The Minimum/Start must be greater than the Maximum/End of the previous item.',
        itemMaximumEndBelowMinimumStart: 'The Maximum/End cannot be less than the Minimum/Start.',
        itemMaximumEndMustPrecedeNextMinimumStart:
          'The Maximum/End must be less than the Minimum/Start of the next item.',
      },
    },
  },
};
