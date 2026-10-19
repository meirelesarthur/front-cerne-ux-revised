// src/constants/languages/languageEnUs/languageClientes.ts
// EN-US translation of the "Clientes" (Client — Base Registrations) module.
//
// SCAFFOLD ADVANCED BY MIRRORING (TASK-CL-FE-01/02/03) — written BEFORE
// `Client-contrato.md`/backend exist, structural mirror of
// `languageProprietarios.ts`. The `form.client` block labels are a literal
// copy of `languagePeople.ts` (client.* block of the People wizard), already
// in production.

import { ModuleClients } from '@/@types/language/module-clients';

export const languageClientes: ModuleClients = {
  client: {
    singularLabel: 'Client',
    pluralLabel: 'Clients',

    list: {
      pageTitle: 'Clients',
      pageSubtitle: 'Manage the clients registered in this tenant.',
      table: {
        document: 'Tax ID',
        name: 'Client',
        nickname: 'Trade Name',
        city: 'City',
        cellphone: 'Mobile',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No clients registered',
        descriptionEmpty: 'Register the first client to get started.',
        titleFiltered: 'No clients found',
        descriptionFiltered: 'Adjust the applied filters and try again.',
        cta: 'New Client',
      },
      deleteDialog: {
        title: 'Delete Client',
        description: 'Are you sure you want to delete the client',
        warning: 'This action is permanent and cannot be undone.',
        confirm: 'Delete',
      },
      deletedToast: 'Client deleted successfully.',
      error: {
        message: 'Unable to load the clients.',
        retry: 'Try again',
      },
    },

    filter: {
      title: 'Filters',
      search: 'Search',
      searchPlaceholder: 'Search by name, trade name or Tax ID',
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
        'There are records linked to this client. Remove or reassign the links below before deleting',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        budgets: 'Linked budget(s)',
        charges: 'Linked charge(s)',
        ctes: 'Linked CT-e(s)',
        harvestProducts: 'Linked harvest product(s)',
        incomes: 'Linked income(s)',
        moduleWeighings: 'Linked weighing(s)',
        movementSales: 'Linked sale movement(s)',
        movements: 'Linked financial movement(s)',
        nves: 'Linked invoice(s) (NF-e)',
        orders: 'Linked order(s)',
        saleContracts: 'Linked sale contract(s)',
        sales: 'Linked sale(s)',
        transferAbcBatches: 'Linked transfer batch(es) (ABC)',
        transfers: 'Linked transfer(s)',
      },
    },

    form: {
      title: {
        create: 'New Client',
        edit: 'Edit Client',
      },
      subtitle: {
        create: 'Register a new client.',
        edit: "Update the client's data.",
      },
      fields: {
        nif: 'Tax ID',
        nickname: 'Trade Name',
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
        partialData: {
          title: 'ZIP code without detailed address',
          description: 'This ZIP code has no registered street/district. Fill in manually.',
        },
      },
      nifFoundWarning:
        'Person already registered — data loaded. Saving will UPDATE the existing record.',
      nifFoundWarningEditing:
        'Another Person is already registered with this ID/Tax number — their data replaced what was in this form. Review before saving.',
      client: {
        cellphone: 'Mobile',
        contact: 'Contact',
        contactPhone: 'Contact Phone',
        cityRegistration: 'IM (Client)',
        farmName: 'Farm Name',
        isEnabled: 'Active',
        finalCustomer: 'Final Customer',
        finalCustomerHint: 'Affects taxation when issuing invoices.',
        taxpayer: 'Taxpayer',
        taxpayerHint: 'Defines whether the client is a tax (ICMS) payer.',
        country: 'Country',
        idAbroad: 'Foreign ID',
      },
      stateRegistrations: {
        title: 'IE (Client)',
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
        stateRegistrationInvalid: 'Invalid state registration: enter 2 to 14 digits or ISENTO.',
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
        countryRequired: 'Select a country.',
      },
    },

    detail: {
      sections: {
        generalData: 'General Data',
        address: 'Address',
        client: 'Client Data',
        stateRegistrations: 'IE (Client)',
      },
      fields: {
        nif: 'Tax ID',
        name: 'Legal Name',
        nickname: 'Trade Name',
        email: 'E-mail',
        phone: 'Phone',
        address: 'Address',
        number: 'Number',
        district: 'District',
        zipCode: 'ZIP Code',
        city: 'City',
        cellphone: 'Mobile',
        contact: 'Contact',
        contactPhone: 'Contact Phone',
        cityRegistration: 'IM (Client)',
        farmName: 'Farm Name',
        finalCustomer: 'Final Customer',
        taxpayer: 'Taxpayer',
        country: 'Country',
        idAbroad: 'Foreign ID',
      },
      stateRegistrationsEmpty: 'No state registrations added.',
      actions: {
        edit: 'Edit',
      },
      notFound: {
        title: 'Client not found',
        description: 'The requested client does not exist or was removed.',
        back: 'Back',
      },
    },
  },
};
