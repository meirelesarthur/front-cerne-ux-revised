// src/constants/languages/languageEnUs/languageBullSeedSeason.ts
// EN-US translation of the "Bull Seed Season" module (BullSeedSeason —
// Operational / Reproduction, 97-Esteiras/005, Task 24).

import { ModuleBullSeedSeason } from '@/@types/language/module-bull-seed-season';

export const languageBullSeedSeason: ModuleBullSeedSeason = {
  bullSeedSeason: {
    singularLabel: 'Bulls/Semen/Embryo',
    pluralLabel: 'Bulls/Semen/Embryo',
    titleModule: 'Bulls/Semen/Embryo',
    list: {
      pageTitle: 'Bulls/Semen/Embryo',
      pageSubtitle: 'Manage the registered bull, semen and embryo records.',
      deletedToast: 'Record deleted successfully',
      newButton: 'New',
      table: {
        code: 'Code',
        date: 'Date',
        breedingSeason: 'Breeding Season',
        responsible: 'Responsible',
        description: 'Description',
        actions: 'Actions',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No record registered.',
        descriptionEmpty: 'Start by registering a new record.',
        titleFiltered: 'No record found.',
        descriptionFiltered: 'Try adjusting the period.',
        cta: 'New',
      },
      filter: {
        title: 'Filter Bulls/Semen/Embryo',
        startDate: 'Start date',
        endDate: 'End date',
      },
      deleteDialog: {
        title: 'Delete this Bulls/Semen/Embryo record?',
        description: 'will be permanently deleted.',
        warning: 'This action cannot be undone.',
      },
    },
    detail: {
      title: 'Bulls/Semen/Embryo',
      backButton: 'Back',
      editButton: 'Edit',
      deleteButton: 'Delete',
      sections: {
        generalData: 'General Data',
        animals: 'Animals',
        products: 'Products',
      },
      fields: {
        code: 'Code',
        date: 'Date',
        description: 'Description',
        breedingSeason: 'Breeding Season',
        createdAt: 'Created At',
        updatedAt: 'Updated At',
      },
      animalsEmpty: 'No animal linked.',
      productsEmpty: 'No product linked.',
      productsTable: {
        product: 'Product',
        warehouse: 'Warehouse',
        quantity: 'Quantity',
        measurement: 'Unit',
        noWarehouse: '—',
      },
      notFound: {
        title: 'Record not found.',
        description: 'The record may have been deleted or the link is incorrect.',
      },
      invalidParamsToast: {
        title: 'Bulls/Semen/Embryo',
        description: 'Invalid parameters to display the details.',
      },
    },
    form: {
      title: {
        create: 'New Bulls/Semen/Embryo',
        edit: 'Edit Bulls/Semen/Embryo',
      },
      fields: {
        code: 'Code',
        date: 'Date',
        description: 'Description',
        breedingSeason: 'Breeding Season',
      },
      animals: {
        sectionTitle: 'Animals',
        animalLabel: 'Animal',
        addButton: 'Add Animal',
        removeButton: 'Remove',
        emptyState: 'No animal added.',
      },
      products: {
        sectionTitle: 'Products',
        warehouseLabel: 'Warehouse',
        productLabel: 'Product',
        quantityLabel: 'Quantity',
        measurementLabel: 'Unit',
        stockLabel: 'Stock',
        addButton: 'Add Product',
        removeButton: 'Remove',
        emptyState: 'No product added.',
      },
      validation: {
        dateRequired: 'Enter the date',
        descriptionRequired: 'Enter the description',
        breedingSeasonRequired: 'Select the Breeding Season',
        animalRequired: 'Select an animal',
        productRequired: 'Select a product',
        quantityRequired: 'Enter the quantity',
        quantityMin: 'Quantity cannot be negative',
      },
      unsavedChangesDialog: {
        title: 'Exit without saving?',
        description: 'There are unsaved changes in this form that will be lost',
        confirmButton: 'Exit without saving',
      },
    },
  },
};
