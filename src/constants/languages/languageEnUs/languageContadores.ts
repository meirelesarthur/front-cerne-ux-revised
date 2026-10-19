// src/constants/languages/languageEnUs/languageContadores.ts
// EN-US translation of the ACCOUNTANT module (accounting office — Base
// Registrations, Tax/Accounting domain).

import { ModuleContadores } from '@/@types/language/module-contadores';

export const languageContadores: ModuleContadores = {
  contador: {
    singularLabel: 'Accountant',
    list: {
      pageTitle: 'Accountant',
      pageSubtitle: 'Manage the accounting offices linked to the farm.',
      deletedToast: 'Accountant removed successfully',
      table: {
        razaoSocial: 'Legal Name',
        nomeFantasia: 'Trade Name',
        cnpj: 'Tax ID',
        city: 'City',
        fone: 'Phone',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No accountant registered.',
        descriptionEmpty: 'Start by adding the first accounting office.',
        titleEmptyNoCreate: 'No accountant available.',
        descriptionEmptyNoCreate:
          'There are no accountants linked to your farm yet. Contact the platform administrator.',
        titleFiltered: 'No accountant found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Accountant',
      },
      error: {
        message: 'Unable to load the accountants.',
        retry: 'Try again',
      },
    },
    filter: {
      title: 'Filter Accountants',
      search: 'Search',
      searchPlaceholder: 'Legal name, trade name or Tax ID',
    },
    deleteBlocked: {
      title: 'Cannot delete',
      description:
        'There are records linked to this accountant. Remove or reassign the links below before deleting',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        contador_issue: 'Linked tax issuer(s)',
        cash_books: 'Linked cash book',
        integration_dominios: 'Linked Domínio integration',
      },
    },
    form: {
      title: { create: 'New Accountant', edit: 'Edit Accountant' },
      subtitle: {
        create: 'Register a new accounting office.',
        edit: 'Update the accounting office data.',
      },
      fields: {
        razaoSocial: 'Legal Name',
        nomeFantasia: 'Trade Name',
        cnpj: 'CPF / CNPJ',
        ie: 'State Registration',
        rua: 'Street',
        numero: 'Number',
        bairro: 'Neighborhood',
        cep: 'Zip Code',
        fone: 'Phone',
        email: 'Email',
        cidadeUuid: 'City',
        issueUuids: 'Tax Issuers',
        autoSend: 'Automatic XML sending',
      },
      placeholders: {
        razaoSocial: 'Legal name of the office',
        nomeFantasia: 'Trade name',
        ie: 'State registration',
        rua: 'Street name',
        numero: 'Number',
        bairro: 'Neighborhood',
        email: 'email@example.com',
        cidadeUuid: 'Search city...',
      },
      issuesField: {
        searchPlaceholder: 'Search tax issuer...',
        selectAllLabel: 'Select all',
        deselectAllLabel: 'Deselect all',
        selectedCountLabel: 'Number of selected records',
        emptyLabel: 'No eligible tax issuer found.',
        errorLabel: 'Error loading tax issuers.',
        retryLabel: 'Try again',
      },
      cepAutofill: {
        notFound: {
          title: 'Zip code not found',
          description: 'We could not find this zip code. Please fill in the address manually.',
        },
        cityNotResolved: {
          title: 'City not resolved automatically',
          description:
            'Address filled in, but the city could not be identified — please select it manually.',
        },
        networkError: {
          title: 'Failed to look up the address',
          description:
            'We could not look up the zip code right now. Fill in the address manually if needed.',
        },
      },
      validation: {
        razaoSocialRequired: 'Legal name is required',
        razaoSocialMaxLength: 'Legal name must be at most 80 characters',
        nomeFantasiaRequired: 'Trade name is required',
        nomeFantasiaMaxLength: 'Trade name must be at most 80 characters',
        cnpjRequired: 'Tax ID is required',
        ieRequired: 'State registration is required',
        invalidFields: 'Review the highlighted fields.',
        ieMaxLength: 'State registration must be at most 20 characters',
        ruaRequired: 'Street is required',
        numeroRequired: 'Number is required',
        bairroRequired: 'Neighborhood is required',
        cepRequired: 'Zip code is required',
        foneRequired: 'Phone is required',
        emailRequired: 'Email is required',
        emailInvalid: 'Enter a valid email',
        cidadeRequired: 'City is required',
        issuesRequired: 'Select at least one Tax Issuer',
      },
    },
  },
};
