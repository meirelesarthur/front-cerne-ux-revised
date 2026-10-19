// src/constants/languages/languageEnUs/languageCausaMortePerda.ts
// EN-US translation of the DEATH LOSS module (Base Registrations / Livestock).

import { ModuleDeathLosses } from '@/@types/language/module-death-losses';

export const languageCausaMortePerda: ModuleDeathLosses = {
  deathLoss: {
    singularLabel: 'Death/Loss Cause',
    list: {
      pageTitle: 'Death/Loss Cause',
      pageSubtitle: 'Manage the death and loss causes linked to the registered species.',
      deletedToast: 'Death/loss cause deleted successfully',
      table: {
        description: 'Description',
        cause: 'Cause',
        specie: 'Species',
        active: 'Active',
        activeLabel: 'Active',
        inactiveLabel: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No death/loss causes registered.',
        descriptionEmpty: 'Start by adding your first death/loss cause.',
        titleEmptyNoCreate: 'No death/loss causes available.',
        descriptionEmptyNoCreate:
          'There are no death/loss causes registered yet. Contact the platform administrator.',
        cta: 'New Death/Loss Cause',
      },
      deleteConfirm: {
        title: 'Delete death/loss cause',
        description: 'Are you sure you want to delete the death/loss cause',
        warning:
          'This action cannot be undone. A death/loss cause with linked records cannot be deleted; deactivate it instead.',
      },
    },
    form: {
      title: {
        create: 'New Death/Loss Cause',
        edit: 'Edit Death/Loss Cause',
      },
      subtitle: {
        create: 'Register a new death/loss cause linked to a species.',
        edit: 'Update the death/loss cause data.',
      },
      fields: {
        description: 'Description',
        cause: 'Cause',
        isEnabled: 'Active',
        specie: 'Species',
        causeOptions: {
          death: 'Death',
          loss: 'Loss',
        },
      },
      placeholders: {
        description: 'E.g.: Rabies',
        cause: 'Select the cause',
        specie: 'Search by description',
      },
      hints: {
        specieRequired: 'The species is required.',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 191 characters',
        specieRequired: 'Select a species',
        causeRequired: 'Select a cause',
      },
    },
  },
};
