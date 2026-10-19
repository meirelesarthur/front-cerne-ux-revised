// src/constants/languages/languageEnUs/languageProprietarios.ts
// EN-US translation of the "Proprietários" (Proprietary — Base
// Registrations) module. TASK-PY-FE-01: singular/plural (queryKey) +
// validation messages of the Yup schema + skeleton of list/filter/form
// (full copy completed by TASK-PY-FE-02/03, same incremental pattern of
// `languageProviders.ts`).

import { ModuleProprietaries } from '@/@types/language/module-proprietaries';

export const languageProprietarios: ModuleProprietaries = {
  proprietary: {
    singularLabel: 'Proprietary',
    pluralLabel: 'Proprietaries',

    list: {
      pageTitle: 'Proprietaries',
      pageSubtitle: 'Manage the proprietaries registered in this tenant.',
      table: {
        document: 'Tax ID',
        name: 'Proprietary',
        nickname: 'Nickname',
        city: 'City',
        percentage: 'Share',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No proprietaries registered',
        descriptionEmpty: 'Register the first proprietary to get started.',
        titleFiltered: 'No proprietaries found',
        descriptionFiltered: 'Adjust the applied filters and try again.',
        cta: 'New Proprietary',
      },
      deleteDialog: {
        title: 'Delete Proprietary',
        description: 'Are you sure you want to delete the proprietary',
        warning: 'This action is permanent and cannot be undone.',
        confirm: 'Delete',
      },
      deletedToast: 'Proprietary deleted successfully.',
      error: {
        message: 'Unable to load the proprietaries.',
        retry: 'Try again',
      },
    },

    filter: {
      title: 'Filters',
      search: 'Search',
      searchPlaceholder: 'Search by name, nickname or Tax ID',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
    },

    deleteBlocked: {
      title: 'Cannot delete',
      description:
        'There are records linked to this proprietary. Remove or reassign the links below before deleting',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        expenses: 'Linked expense(s)',
        incomes: 'Linked income(s)',
        movements: 'Linked financial movement(s)',
        transfers: 'Linked transfer(s)',
        areas: 'Linked area(s)',
        invoices: 'Linked invoice(s)',
        equipments: 'Linked equipment',
        cashBooks: 'Linked cash book(s)',
        inputEntries: 'Linked input entry(ies)',
        sales: 'Linked sale(s)',
        tickets: 'Linked ticket(s)',
        traceabilityConfigs: 'Linked traceability configuration(s)',
      },
    },

    form: {
      title: {
        create: 'New Proprietary',
        edit: 'Edit Proprietary',
      },
      subtitle: {
        create: 'Register a new proprietary.',
        edit: "Update the proprietary's data.",
      },
      fields: {
        nif: 'Tax ID',
        nickname: 'Nickname',
        name: 'Legal Name',
        email: 'E-mail',
        phone: 'Phone',
        zipCode: 'ZIP Code',
        address: 'Address',
        number: 'Number',
        district: 'District',
        city: 'City',
      },
      cepAutofill: {
        notFound: {
          title: 'ZIP code not found',
          description: 'Fill in the address manually.',
        },
        cityNotResolved: {
          title: 'City not resolved',
          description: 'Select the city manually.',
        },
        networkError: {
          title: 'Failed to look up the ZIP code',
          description: 'Fill in the address manually.',
        },
      },
      nifFoundWarning:
        'Person already registered — data loaded. If they are already a proprietor at another farm, existing farms and state registrations are kept and the active farm is added on save.',
      nifFoundWarningEditing:
        'Another Person is already registered with this ID/Tax number — their data replaced what was in this form. Review before saving.',
      nifAlreadyProprietaryRedirectWarning:
        'Proprietor already registered at this farm. Opening the record for editing.',
      nifPermissionDeniedWarning:
        'You do not have permission to look up the people registry — fill in the data manually.',
      farms: {
        empty: 'No farms linked.',
        add: 'Add Farm',
        removeAria: 'Remove farm',
        fields: {
          farm: 'Farm',
          percentage: 'Share (%)',
        },
      },
      stateRegistrations: {
        title: 'IE (Owner)',
        empty: 'No state registrations added.',
        add: 'Add State Registration',
        removeAria: 'Remove state registration',
        fields: {
          value: 'IE',
        },
      },
      validation: {
        nifRequired: 'Tax ID is required.',
        nifInvalid: 'Invalid Tax ID — check the digits.',
        nameRequired: 'Required field.',
        nameMaxLength: 'Maximum 120 characters.',
        nicknameRequired: 'Required field.',
        nicknameMaxLength: 'Maximum 60 characters.',
        emailRequired: 'E-mail is required.',
        emailInvalid: 'Invalid e-mail.',
        emailMaxLength: 'Maximum 89 characters.',
        addressRequired: 'Required field.',
        addressMaxLength: 'Maximum 120 characters.',
        numberRequired: 'Required field.',
        numberMaxLength: 'Maximum 10 characters.',
        districtRequired: 'Required field.',
        districtMaxLength: 'Maximum 60 characters.',
        cityRequired: 'Select a city.',
        farmRequired: 'Select a farm.',
        farmsMinRequired: 'Add at least one farm.',
        percentageRange: 'Enter a share between 0 and 100.',
      },
    },
  },
};
