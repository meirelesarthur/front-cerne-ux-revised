// src/constants/languages/languageEnUs/languageContracts.ts
// EN-US translation of the "Contract Management" module (Contract —
// Financial, pipeline 97-Esteiras/023, TASK-CTR-FE-02). See
// `@/@types/language/module-contracts` for the full contract.

import { ModuleContracts } from '@/@types/language/module-contracts';

export const languageContracts: ModuleContracts = {
  contract: {
    singularLabel: 'Contract',
    pluralLabel: 'Contracts',
    titleModule: 'Contracts',

    list: {
      pageTitle: 'Contracts',
      pageSubtitle: 'Manage the farm contracts.',
      table: {
        code: 'Code',
        number: 'Number',
        provider: 'Provider',
        employee: 'Responsible',
        date: 'Date',
        expirationDate: 'Expiration Date',
        installments: 'Installments',
        quantity: 'Quantity',
        amount: 'Amount',
        actions: {
          edit: 'Edit',
          delete: 'Delete',
        },
      },
      emptyState: {
        titleEmpty: 'No contracts registered',
        titleFiltered: 'No contracts found',
        descriptionEmpty: 'Register the first Contract.',
        descriptionFiltered: 'Adjust the filters to find what you are looking for.',
        cta: 'New Contract',
      },
      deletedToast: 'Contract deleted successfully.',
    },

    filter: {
      title: 'Filter Contracts',
      search: 'Search',
      searchPlaceholder: 'Search by number',
      provider: 'Provider',
      employee: 'Responsible',
    },

    form: {
      title: {
        create: 'New Contract',
        edit: 'Edit Contract',
      },
      subtitle: {
        create: 'Register a new contract.',
        edit: 'Update the contract data.',
      },
      fields: {
        provider: 'Provider',
        employee: 'Responsible',
        number: 'Number',
        date: 'Date',
        expirationDate: 'Expiration Date',
        installments: 'Installments',
        quantity: 'Quantity',
        unitValueSc: 'Unit Value (sc)',
        amount: 'Amount',
      },
      placeholders: {
        provider: 'Search a provider',
        employee: 'Search a responsible person',
        number: 'Contract number',
      },
      validation: {
        providerRequired: 'Provider is required',
        employeeRequired: 'Responsible is required',
        numberRequired: 'Number is required',
        numberMaxLength: 'Number must have at most 50 characters',
        dateRequired: 'Date is required',
        expirationDateRequired: 'Expiration Date is required',
        installmentsRequired: 'Installments is required',
        installmentsMin: 'Installments must be greater than zero',
        quantityRequired: 'Quantity is required',
        quantityMin: 'Quantity must be greater than zero',
        unitValueScRequired: 'Unit Value (sc) is required',
        unitValueScMin: 'Unit Value (sc) must be greater than zero',
        itemsMinOne: 'Add at least one item',
        itemWarehouseRequired: 'Warehouse is required',
        itemProductRequired: 'Product is required',
        itemQuantityRequired: 'Quantity is required',
        itemQuantityMin: 'Quantity must be greater than zero',
      },
      itemsSection: {
        title: 'Inputs',
        addButton: '+ Add Input',
        emptyState: 'No inputs added',
        fields: {
          warehouse: 'Warehouse',
          product: 'Product',
          quantity: 'Quantity',
        },
        removeButton: 'Remove',
      },
    },
  },
};
