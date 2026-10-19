// src/constants/languages/languageEnUs/languageAccounts.ts
// EN-US translation of the "Contas Bancárias" (Account — Base Registrations /
// Financial, execution 025, TASK-FE-561) module. Field labels mirror
// `Account-FrontEnd-contrato.md §5` — "Bank Contract Number"/"Bank Agreement
// Number" (columns dropped from the schema in 2025).

import { ModuleAccounts } from '@/@types/language/module-accounts';

export const languageAccounts: ModuleAccounts = {
  account: {
    singularLabel: 'Bank Account',
    pluralLabel: 'Bank Accounts',

    list: {
      pageTitle: 'Bank Accounts',
      pageSubtitle: "Manage the tenant's checking, savings, investment and internal cash accounts.",
      columns: {
        description: 'Description',
        bank: 'Bank',
        agency: 'Branch',
        account: 'Account',
        type: 'Type',
        limit: 'Limit',
        balance: 'Balance',
        isEnabled: 'Status',
        ticket: 'Ticket',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No bank accounts registered',
        descriptionEmpty: 'Register the first bank account to get started.',
        titleFiltered: 'No account found',
        descriptionFiltered: 'Try adjusting the filters or the search.',
        cta: 'Add New',
      },
      noFarmSelected: {
        title: 'Select a farm',
        description: "Choose an active farm to view the tenant's bank accounts.",
      },
      deleteConfirm: {
        title: 'Delete Bank Account',
        description: 'Are you sure you want to delete the bank account',
        warning: 'This action cannot be undone.',
      },
      deletedToast: 'Bank account deleted successfully.',
      deleteBlocked: {
        title: 'Unable to delete',
        balance: 'This account has a non-zero balance.',
        dependents: 'This account has investment accounts linked to it.',
        hint: 'This check only considers accounts already loaded on the current page — links outside it only surface via the server error when deletion is attempted. Settle the balance and unlink dependent accounts before deleting.',
        confirm: 'Got it',
      },
    },

    filter: {
      title: 'Filters',
      search: 'Search',
      searchPlaceholder: 'Search by description, code or bank',
      type: 'Type',
      typeAll: 'All types',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
    },

    form: {
      title: {
        create: 'New Bank Account',
        edit: 'Edit Bank Account',
      },
      subtitle: {
        create: 'Register a new bank account.',
        edit: 'Update the bank account data.',
      },
      sections: {
        general: 'General Information',
        ticket: 'Ticket Issuance',
        farms: 'Linked Farms',
      },
      fields: {
        bank: 'Bank',
        agency: 'Branch',
        account: 'Account',
        type: 'Type',
        code: 'Code',
        description: 'Description',
        limit: 'Limit',
        balance: 'Balance',
        isEnabled: 'Active',
        useCashBook: 'Use in Cash Book',
        provider: 'Provider',
        investmentAccount: 'Linked Investment Account',
        isTicket: 'Issues Ticket',
        bankContract: 'Bank Contract Number',
        bankAgreement: 'Bank Agreement Number',
        typeCnab: 'Ticket Type (CNAB)',
        proprietaries: 'Owners',
        farms: 'Farms',
      },
      placeholders: {
        bank: 'Select the bank',
        agency: 'E.g.: 0001',
        account: 'E.g.: 12345-6',
        type: 'Select the type',
        code: 'E.g.: 0001',
        description: 'E.g.: Main Checking Account',
        provider: 'Select the provider',
        investmentAccount: 'Select the investment account',
        bankContract: 'E.g.: 12345678',
        bankAgreement: 'E.g.: 12345678',
        typeCnab: 'Select the CNAB type',
      },
      typeOptions: {
        current: 'Checking',
        savings: 'Savings',
        investment: 'Investment',
        cashBook: 'Internal Cash Book',
      },
      cnabOptions: {
        cnab240: 'CNAB240',
        cnab400: 'CNAB400',
      },
      hints: {
        balanceReadOnly: 'Balance calculated externally — not editable in this form.',
        investmentAccountFilter: 'Only Investment-type accounts are shown.',
      },
      farms: {
        searchPlaceholder: 'Search farm...',
        selectAllLabel: 'Select all',
        deselectAllLabel: 'Deselect all',
        selectedCountLabel: 'Selected farms',
        emptyLabel: 'No farm found.',
        errorLabel: 'Error loading farms.',
        retryLabel: 'Try again',
      },
      proprietaries: {
        searchPlaceholder: 'Search owner...',
        selectAllLabel: 'Select all',
        deselectAllLabel: 'Deselect all',
        selectedCountLabel: 'Selected owners',
        emptyLabel:
          'No owner linked to the selected farms. Link the owner to the farm in the Owners registry.',
        emptyNoFarmsLabel: 'Select at least one farm above to list the owners linked to it.',
        errorLabel: 'Error loading owners.',
        retryLabel: 'Try again',
      },
      validation: {
        bankRequired: 'Select the bank.',
        agencyRequired: 'Required field.',
        agencyMaxLength: 'Maximum of 6 characters.',
        accountRequired: 'Required field.',
        accountMaxLength: 'Maximum of 20 characters.',
        typeRequired: 'Select the account type.',
        codeRequired: 'Required field.',
        codeMaxLength: 'Maximum of 4 characters.',
        descriptionRequired: 'Required field.',
        descriptionMaxLength: 'Maximum of 40 characters.',
        limitRequired: 'Enter the limit.',
        bankContractRequired: 'Bank Contract Number is required for accounts with ticket issuance.',
        bankContractMaxLength: 'Maximum of 8 characters.',
        bankAgreementRequired:
          'Bank Agreement Number is required for accounts with ticket issuance.',
        bankAgreementMaxLength: 'Maximum of 8 characters.',
        typeCnabRequired: 'Select the CNAB type for accounts with ticket issuance.',
        proprietariesRequired: 'Select at least one owner for accounts with ticket issuance.',
      },
      savedToast: 'Bank account saved successfully.',
    },
  },
};
