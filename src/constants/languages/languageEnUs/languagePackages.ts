// src/constants/languages/languageEnUs/languagePackages.ts
// EN-US translation of the Package module (Package — Base Registrations /
// Structure, execution 025).

import { ModulePackages } from '@/@types/language/module-packages';

export const languagePackages: ModulePackages = {
  package: {
    singularLabel: 'Package',
    form: {
      title: {
        create: 'New Package',
        edit: 'Edit Package',
      },
      subtitle: {
        create: 'Register a new package linked to a unit of measurement.',
        edit: 'Update the package data.',
      },
      fields: {
        description: 'Description',
        size: 'Quantity',
        measurement: 'Unit of Measurement',
      },
      placeholders: {
        description: 'E.g.: 60KG BAG',
        measurement: 'Select...',
      },
      hints: {
        measurementRequired: 'The unit of measurement is required.',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 255 characters',
        sizeRequired: 'Quantity is required',
        sizeMin: 'Quantity must be greater than zero',
        measurementRequired: 'Select a unit of measurement',
      },
      noFarmSelected: {
        title: 'Select a farm',
        description:
          'The Packages catalog is shared across all farms of the tenant, but access requires an active farm to be selected.',
      },
    },
    list: {
      pageTitle: 'Packages',
      pageSubtitle: 'Manage the packages linked to registered units of measurement.',
      columns: {
        description: 'Description',
        size: 'Quantity',
        measurement: 'Unit of Measurement',
        actions: 'Actions',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      deletedToast: 'Package deleted successfully',
      empty: {
        title: 'No packages registered',
        description: 'Start by adding the first package.',
      },
      emptyState: {
        titleEmpty: 'No packages registered.',
        descriptionEmpty: 'Start by adding the first package.',
        titleEmptyNoCreate: 'No packages available.',
        descriptionEmptyNoCreate:
          'There are no packages registered yet. Contact the platform administrator.',
        titleFiltered: 'No packages found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Package',
      },
      deleteConfirm: {
        title: 'Delete package',
        description: 'Are you sure you want to delete the package',
        warning:
          'If there are products linked to this package, deletion will be blocked by the system.',
      },
      noFarmSelected: {
        title: 'Select a farm',
        description:
          'The Packages catalog is shared across all farms of the tenant, but access requires an active farm to be selected.',
      },
    },
    filter: {
      title: 'Filter packages',
      search: 'Search',
      searchPlaceholder: 'Search by description',
      measurement: 'Unit of Measurement',
      measurementAll: 'All',
    },
  },
};
