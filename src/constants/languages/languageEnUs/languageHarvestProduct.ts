// src/constants/languages/languageEnUs/languageHarvestProduct.ts
// EN-US translation of the "Fruit Harvest" module (HarvestProduct —
// Operational / Agriculture, F-040, execution 040, TASK-FE-1092..1101).

import { ModuleHarvestProduct } from '@/@types/language/module-harvest-product';

export const languageHarvestProduct: ModuleHarvestProduct = {
  singularLabel: 'Fruit Harvest',
  pluralLabel: 'Fruit Harvest',
  titleModule: 'Fruit Harvest',
  createTitle: 'New Harvest',
  editTitle: 'Edit Harvest',
  list: {
    table: {
      code: 'Code',
      date: 'Date',
      client: 'Client',
      area: 'Area',
      product: 'Product',
      boxesCount: 'Boxes',
      boxTooltipLabel: 'Box {n} - {amount} Kg',
      totalWeight: 'Total Weight (Kg)',
      actions: 'Actions',
    },
    actions: {
      view: 'View',
      edit: 'Edit',
      delete: 'Delete',
    },
    newButton: 'New Harvest',
    emptyState: {
      titleEmpty: 'No harvest registered.',
      descriptionEmpty: 'Start by registering a new fruit harvest.',
      titleFiltered: 'No records found.',
      descriptionFiltered: 'Try adjusting the filters.',
      cta: 'New Harvest',
    },
    deleteDialog: {
      title: 'Delete harvest?',
      warning: 'This action cannot be undone.',
    },
  },
  filter: {
    title: 'Filter Fruit Harvest',
    area: 'Area',
    client: 'Client',
    dateStart: 'Start Date',
    dateEnd: 'End Date',
    clearAllFilters: 'Clear filters',
    applyFilters: 'Apply filters',
  },
  form: {
    code: 'Code',
    codeHelper: 'Automatically generated on save',
    date: 'Date',
    area: 'Area',
    client: 'Client',
    product: 'Product',
    plate: 'License Plate',
    city: 'City',
    driverName: 'Driver Name',
    driverNif: 'Driver Tax ID (CPF/CNPJ)',
    boxesSectionTitle: 'Boxes',
    boxAmount: 'Weight (Kg)',
    addBoxButton: 'Add Box',
    removeBoxButton: 'Remove',
    lookupErrorRetry: 'Could not load options. Try again.',
    lookupNoResults: 'No results for the searched term.',
    lookupTypeToSearch: 'Type at least 3 characters to search.',
  },
  validation: {
    dateRequired: 'Enter the date',
    areaRequired: 'Enter the area',
    clientRequired: 'Enter the client',
    productRequired: 'Enter the product',
    boxAmountRequired: 'Enter a valid weight',
    boxesMinOne: 'Add at least one box before saving.',
  },
  toast: {
    createSuccess: 'Record created successfully.',
    updateSuccess: 'Record updated successfully.',
    deleteSuccess: 'Record deleted successfully.',
    deleteError: 'Could not delete the record.',
  },
  detail: {
    title: 'Fruit Harvest',
    backButton: 'Back',
    editButton: 'Edit',
    sections: {
      generalData: 'General Data',
      boxes: 'Boxes',
    },
    table: {
      amount: 'Weight (Kg)',
    },
    notFound: {
      title: 'Harvest not found.',
      description: 'The record may have been deleted or the link is incorrect.',
    },
    invalidParamsToast: {
      title: 'Fruit Harvest',
      description: 'Invalid parameters to display the detail.',
    },
  },
};
