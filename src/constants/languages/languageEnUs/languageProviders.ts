// src/constants/languages/languageEnUs/languageProviders.ts
// EN-US translation of the "Fornecedores" (Provider — Base Registrations)
// module. TASK-PR-FE-01: singular/plural (queryKey), `type` enum options
// (ProviderTypeEnum, DA-PR-09) and Yup schema validation messages.

import { ModuleProviders } from '@/@types/language/module-providers';

export const languageProviders: ModuleProviders = {
  provider: {
    singularLabel: 'Provider',
    pluralLabel: 'Providers',

    typeOptions: {
      fornecedor: 'Supplier',
      funcionario: 'Employee',
      terceirizado: 'Outsourced',
      transportador: 'Carrier',
      comissionado: 'Commissioned',
      inseminador: 'Inseminator',
    },

    pixTypeOptions: {
      cpfCnpj: 'Tax ID',
      email: 'E-mail',
      phone: 'Phone',
      random: 'Random Key',
    },

    accountTypeOptions: {
      checking: 'Checking Account',
      savings: 'Savings Account',
    },

    list: {
      pageTitle: 'Providers',
      pageSubtitle: 'Manage the providers registered in this tenant.',
      table: {
        document: 'Tax ID',
        name: 'Provider',
        city: 'City',
        type: 'Type',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        deactivate: 'Deactivate',
        activate: 'Activate',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No providers registered',
        descriptionEmpty: 'Register the first provider to get started.',
        titleFiltered: 'No providers found',
        descriptionFiltered: 'Adjust the applied filters and try again.',
        cta: 'New Provider',
      },
      deactivatedToast: 'Provider deactivated successfully.',
      activatedToast: 'Provider activated successfully.',
      deletedToast: 'Provider deleted successfully.',
      deactivateDialog: {
        title: 'Deactivate Provider',
        description: 'Are you sure you want to deactivate the provider',
        warning:
          'The provider will stop showing up in the default listing, but can be reactivated later.',
        confirm: 'Deactivate',
      },
      activateDialog: {
        title: 'Activate Provider',
        description: 'Are you sure you want to activate the provider',
        warning: 'The provider will be active again and can be deactivated later if needed.',
        confirm: 'Activate',
      },
      deleteDialog: {
        title: 'Delete Provider',
        description: 'Are you sure you want to delete the provider',
        warning:
          'This action cannot be undone. A provider with linked records cannot be deleted; deactivate it instead.',
        confirm: 'Delete',
      },
    },

    filter: {
      title: 'Filters',
      search: 'Search',
      searchPlaceholder: 'Search by name, nickname or Tax ID',
      type: 'Type',
      typeAll: 'All types',
      city: 'City',
      cityAll: 'All cities',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
    },

    form: {
      title: {
        create: 'New Provider',
        edit: 'Edit Provider',
      },
      subtitle: {
        create: 'Register a new provider.',
        edit: "Update the provider's data.",
      },
      tabs: {
        dados: 'Data',
        conta: 'Account',
        filiais: 'Branches',
        vendedores: 'Sellers',
      },
      comingSoon: 'This tab will be available soon.',
      nifFoundWarning:
        'Person already registered — data loaded. Saving will UPDATE the existing record.',
      nifFoundWarningEditing:
        'Another Person is already registered with this ID/Tax number — their data replaced what was in this form. Review before saving.',
      nifPermissionDeniedWarning:
        'You do not have permission to look up the people registry — fill in the data manually.',
      savedInactiveNotSelected:
        'Provider saved as inactive: it was not selected in the field, since inactive providers are not available for selection.',
      enabledOptions: {
        yes: 'Yes',
        no: 'No',
      },
      placeholders: {
        defaultCostCenter: 'Select the default cost center',
      },
      fields: {
        nif: 'Tax ID',
        nickname: 'Nickname',
        name: 'Legal Name',
        stateRegistration: 'IE of the provider',
        cityRegistration: 'IM of the provider',
        type: 'Type',
        commission: 'Commission',
        hourValue: 'Hourly Rate',
        email: 'E-mail',
        phone: 'Phone',
        zipCode: 'ZIP Code',
        address: 'Address',
        number: 'Number',
        district: 'District',
        city: 'City',
        contact: 'Contact',
        contactPhone: 'Contact Phone',
        cellphone: 'Cell Phone',
        isEnabled: 'Active',
        defaultCostCenter: 'Default Cost Center',
        bankId: 'Bank',
        accountType: 'Account Type',
        agency: 'Branch',
        account: 'Account',
        pixType: 'PIX Key Type',
        pix: 'PIX Key',
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
      branches: {
        empty: 'No branches registered.',
        add: 'Add Branch',
        removeAria: 'Remove branch',
        fields: {
          name: 'Name',
          nif: 'Tax ID',
          stateRegistration: 'IE',
          zipCode: 'ZIP Code',
          city: 'City',
          address: 'Address',
        },
        cnpjAutofill: {
          loading: 'Looking up the Tax ID data...',
          notFound: {
            title: 'Could not automatically look up the Tax ID data',
            description: 'Fill in the branch fields manually.',
          },
          cityNotResolved: {
            title: 'Branch city not resolved',
            description: 'Select the branch city manually.',
          },
        },
      },
      sellers: {
        empty: 'No sellers registered.',
        add: 'Add Seller',
        removeAria: 'Remove seller',
        fields: {
          name: 'Name',
          email: 'E-mail',
          phone: 'Phone',
        },
      },
      validation: {
        nifRequired: 'Tax ID is required.',
        nifInvalid: 'Invalid Tax ID — check the digits.',
        nameRequired: 'Required field.',
        nameMaxLength: 'Maximum 120 characters.',
        nicknameRequired: 'Required field.',
        nicknameMaxLength: 'Maximum 60 characters.',
        emailInvalid: 'Invalid e-mail.',
        emailMaxLength: 'Maximum 89 characters.',
        addressRequired: 'Required field.',
        addressMaxLength: 'Maximum 120 characters.',
        numberRequired: 'Required field.',
        numberMaxLength: 'Maximum 10 characters.',
        districtRequired: 'Required field.',
        districtMaxLength: 'Maximum 60 characters.',
        cityRequired: 'Select a city.',
        typeRequired: 'Select the provider type.',
        commissionRequiredForType: 'Commission is required for the Commissioned type.',
        hourValueRequiredForType: 'Hourly rate is required for the Outsourced type.',
        contactMaxLength: 'Maximum of 120 characters.',
        cellphoneMaxLength: 'Maximum of 15 characters.',
        defaultCostCenterInvalid: 'Invalid cost center.',
        isEnabledRequired: 'Required field.',
        branchNifRequired: "Branch's Tax ID is required.",
        branchCityRequired: "Select the branch's city.",
        branchAddressRequired: "Branch's address is required.",
        sellerNameRequired: "Seller's name is required.",
        sellerEmailInvalid: 'Invalid e-mail.',
      },
    },
  },
};
