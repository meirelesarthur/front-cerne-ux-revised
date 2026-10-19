// src/constants/languages/languageEnUs/languageDiscountTables.ts
// English translation of the "Discounts/Classification" module
// (DiscountTable — Operational/Agriculture, F-032, TASK-DT-FE-01).
// Structure mirrors `languagePtBr/languageDiscountTables.ts`.

import { ModuleDiscountTables } from '@/@types/language/module-discount-tables';

export const languageDiscountTables: ModuleDiscountTables = {
  discountTable: {
    titleModule: 'Discounts/Classification',
    singularLabel: 'Discount Table',
    pluralLabel: 'Discount Tables',
    list: {
      pageTitle: 'Discounts/Classification',
      pageSubtitle: 'Manage the registered discount tables.',
      deletedToast: 'Discount table deleted successfully',
      columns: {
        code: 'Code',
        name: 'Name',
        calculationBase: 'Calculation Type',
        products: 'Products',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No discount table registered.',
        descriptionEmpty: 'Start by adding the first discount table.',
        titleFiltered: 'No discount table found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add Discount Table',
      },
    },
    filter: {
      title: 'Filter discount tables',
      search: 'Search',
      searchPlaceholder: 'Search by code or name',
    },
    form: {
      title: {
        create: 'New Discount Table',
        edit: 'Edit Discount Table',
        view: 'View Discount Table',
      },
      fields: {
        code: 'Code',
        name: 'Name',
        namePlaceholder: 'Standard Commercial Discount',
        calculationBase: 'Calculation Base',
        status: 'Status',
      },
      calculationBaseOptions: {
        grossWeight: 'Gross Weight',
        cumulative: 'Gross Weight - Previous Discount',
      },
      statusOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
      products: {
        title: 'Products',
        addProduct: 'Add Product',
        removeProduct: 'Remove product',
        emptyState: 'No product added',
      },
      picker: {
        title: 'Add Product',
        searchPlaceholder: 'Search by description or code',
        emptyState: 'No eligible product',
        alreadyAddedToast: 'Product already added',
      },
      ruleTypes: {
        impureza: 'Impurity',
        umidade: 'Moisture',
        quebrado: 'Broken',
        esverdeado: 'Green',
        avariado: 'Damaged/Spoiled',
        taxa_recepcao: 'Reception Fee',
      },
      rules: {
        initialLimitPercent: 'Initial Limit (%)',
        finalLimitPercent: 'Final Limit (%)',
        discountPercent: 'Discount (%)',
        addRule: 'Add Rule',
        removeRule: 'Remove',
        emptyState: 'No rule added in this tab',
      },
      validation: {
        nameRequired: 'Enter the name.',
        nameMax: 'The name must have at most 181 characters.',
        calculationBaseRequired: 'Select the calculation base.',
        statusRequired: 'Select the status.',
        productsMin: 'Add at least one product.',
        productUuidRequired: 'Select the product.',
        rulePercentRequired: 'Enter a value between 0 and 100.',
        rulePercentRange: 'The value must be between 0 and 100.',
      },
    },
  },
};
