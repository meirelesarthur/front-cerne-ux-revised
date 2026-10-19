// src/constants/languages/languageEnUs/languageCategoriasProduto.ts
// EN-US translation of the PRODUCT CATEGORIES module (Base Registrations).

import { ModuleCategoryProducts } from '@/@types/language/module-category-products';

export const languageCategoriasProduto: ModuleCategoryProducts = {
  categoryProduct: {
    singularLabel: 'Product Category',
    list: {
      pageTitle: 'Product Categories',
      pageSubtitle: 'Manage the categories used to classify stock products.',
      deletedToast: 'Product category deleted successfully',
      table: {
        description: 'Description',
        type: 'Type',
        group: 'Group',
        financialCategory: 'Financial Category',
        active: 'Active',
        activeLabel: 'Active',
        inactiveLabel: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No product categories registered.',
        descriptionEmpty: 'Start by adding your first product category.',
        titleEmptyNoCreate: 'No product categories available.',
        descriptionEmptyNoCreate:
          'There are no product categories registered yet. Contact the platform administrator.',
        titleFiltered: 'No product categories found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Product Category',
      },
      deleteConfirm: {
        title: 'Delete product category',
        description: 'Are you sure you want to delete the product category',
        warning:
          'This deletion may be blocked if the category is in use by linked Kinds or Products.',
      },
    },
    filter: {
      title: 'Filter product categories',
      search: 'Search',
      searchPlaceholder: 'Search by description',
      group: 'Product Group',
      groupAll: 'All',
      type: 'Type',
      typeAll: 'All',
      typeOptions: {
        input: 'Inputs',
        equipment: 'Equipment',
        production: 'Production',
      },
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
    },
    form: {
      title: {
        create: 'New Product Category',
        edit: 'Edit Product Category',
      },
      subtitle: {
        create: 'Register a new category to classify stock products.',
        edit: 'Update the product category data.',
      },
      fields: {
        description: 'Description',
        isEnabled: 'Status',
        type: 'Type',
        group: 'Product Group',
        financialCategory: 'Financial Category',
        typeOptions: {
          input: 'Inputs',
          equipment: 'Equipment',
          production: 'Production',
        },
      },
      placeholders: {
        description: 'E.g.: Nitrogen Fertilizers',
        group: 'Select the product group',
        financialCategory: 'Select the financial category',
      },
      isEnabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
      hints: {
        groupRequired: 'Select the product group this category belongs to.',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
        isEnabledRequired: 'Select the status',
        typeRequired: 'Select the type',
        groupRequired: 'Select the product group',
        financialCategoryRequired: 'Select the financial category',
      },
    },
  },
};
