// src/constants/languages/languageEnUs/languagePlanAccounts.ts
// EN-US translation of the CHART OF ACCOUNTS module (Base Registrations).

import { ModulePlanAccounts } from '@/@types/language/module-plan-accounts';

export const languagePlanAccounts: ModulePlanAccounts = {
  planAccount: {
    singularLabel: 'Ledger Account',
    list: {
      pageTitle: 'Chart of Accounts',
      pageSubtitle: 'Manage the account tree used in financial entries.',
      deletedToast: 'Account removed successfully',
      statusUpdatedToast: 'Status updated successfully',
      table: {
        code: 'Code',
        class: 'Class',
        condition: 'Condition',
        description: 'Description',
        type: 'Type',
        active: 'Active',
        activeLabel: 'Active',
        inactiveLabel: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        viewSubaccounts: 'View subaccounts',
        createDescendant: 'Create descendant',
        deactivate: 'Deactivate',
        activate: 'Activate',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'Your farm does not have its own chart of accounts yet.',
        descriptionEmpty:
          'No account has been registered for this tenant yet. Start by adding the first one.',
        titleEmptyNoCreate: 'No accounts available.',
        descriptionEmptyNoCreate:
          'There are no accounts linked to your farm yet. Contact the platform administrator.',
        titleFiltered: 'No account found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Account',
      },
      helpButton: 'Learn more',
      helpTitle: 'Chart of Accounts',
      helpIntro:
        'The chart of accounts organizes the farm financial entries in a hierarchical structure. Learn about the main concepts of this screen:',
      helpItems: {
        synthetic: {
          term: 'Synthetic Account:',
          description:
            'groups other accounts (has subaccounts) and is used to total values — it does not receive entries directly.',
        },
        analytical: {
          term: 'Analytical Account:',
          description:
            'is the final account in the hierarchy (no subaccounts) — it is where financial entries are recorded.',
        },
        condition: {
          term: 'Condition:',
          description:
            'defines the accounting nature of the account — Debtor, Creditor or Both, used in financial reports.',
        },
        deactivate: {
          term: 'Deactivate:',
          description:
            'hides the account from new entries without deleting it — the existing history remains intact and the account can be reactivated at any time.',
        },
      },
      helpUnderstood: 'Got it',
    },
    filter: {
      title: 'Filter chart of accounts',
      search: 'Search',
      searchPlaceholder: 'Search by code or description',
      condition: 'Condition',
      conditionAll: 'All',
      conditionOptions: {
        debtor: 'Debtor',
        creditor: 'Creditor',
        both: 'Both',
      },
      class: 'Class',
      classAll: 'All',
      classOptions: {
        synthetic: 'Synthetic',
        analytical: 'Analytical',
      },
      type: 'Type',
      typeAll: 'All',
      typeOptions: {
        capex: 'CAPEX',
        opex: 'OPEX',
      },
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
      parentUuid: 'Parent account',
      parentUuidPlaceholder: 'Search by code or description',
    },
    form: {
      title: {
        create: 'New Ledger Account',
        edit: 'Edit Ledger Account',
        createDescendant: 'New Subaccount',
      },
      subtitle: {
        create: 'Register a new account in the chart of accounts.',
        edit: 'Update the ledger account data.',
        createDescendant: 'The new account will be linked as a subaccount of the selected account.',
      },
      fields: {
        description: 'Description',
        condition: 'Condition',
        isEnabled: 'Active',
        type: 'Type',
        parentUuid: 'Parent account',
        code: 'Code',
        class: 'Class',
        categories: 'Financial Categories',
      },
      placeholders: {
        description: 'Enter the account description',
        parentUuid: 'Search by code or description',
        categoriesSearch: 'Search financial category by code or description',
      },
      hints: {
        parentUuidImmutable: 'The parent account cannot be changed after creation.',
        parentUuidCreate:
          'This account will be created as a root account. To create subaccounts, use "Create descendant" in the list.',
        parentUuidFixedDescendant:
          'Parent account fixed — this account will be created as its subaccount.',
        codeGenerated: 'Automatically generated',
        classPreviewBadge: 'preview',
      },
      classLabels: {
        synthetic: 'Synthetic',
        analytical: 'Analytical',
      },
      categories: {
        empty: 'No financial category linked.',
        removeLabel: 'Remove category',
      },
      categoriesTree: {
        expandAll: 'Expand All',
        collapseAll: 'Collapse All',
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        emptyGroup: 'No categories in this group',
        noCategories: 'No financial categories available.',
      },
      parentPreview: {
        loading: 'Loading parent account...',
        errorTitle: 'Could not load the parent account.',
        errorDescription: 'Check whether the record still exists and try again.',
      },
      validation: {
        descriptionRequired: 'Description is required.',
        descriptionMaxLength: 'Description must be at most 150 characters.',
        conditionRequired: 'Condition is required.',
      },
    },
    excel: {
      downloadTemplate: 'Download template',
      export: 'Export',
      downloadTemplateError: 'Could not download the template. Please try again.',
      exportError: 'Could not export the data. Please try again.',
      import: {
        menuLabel: 'Import',
        title: 'Import Chart of Accounts',
        subtitle:
          'Download the template, fill it in, and upload the spreadsheet to sync the chart of accounts.',
        instructions:
          'The Code, Description, Condition and Class columns are required in every row. The hierarchy is defined by the segments of the Code itself (e.g., 1.1 is a sub-account of 1) — the parent account must already exist or appear in an earlier row of the same spreadsheet.',
        warning: {
          title: 'Safe deletion of missing accounts',
          description:
            'Accounts missing from this spreadsheet will be deleted — except those that already have entries, categories, or sub-accounts linked to them, which will be preserved and listed at the end of the import.',
        },
        downloadShortcut: 'Download template',
        fileUpload: {
          label: 'Filled spreadsheet',
          hint: 'Upload the .xlsx file filled in from the downloaded template.',
          dropzoneTitle: 'Drag the spreadsheet or click to select',
          dropzoneDraggingTitle: 'Drop the spreadsheet here',
          changeLabel: 'Change file',
          removeLabel: 'Remove file',
          errorTypeMessage: 'Format not accepted. Upload a .xlsx file.',
          errorSizeMessage: 'File exceeds the maximum size of 10MB.',
        },
        cancelButton: 'Cancel',
        submitButton: 'Import',
        importSuccessToast: 'Chart of accounts import completed successfully.',
        result: {
          created: 'Created',
          updated: 'Updated',
          deleted: 'Deleted',
          preservedTitle: '{count} account(s) preserved — already in use',
        },
        rowErrors: {
          title: 'Could not import — fix the rows below and upload again',
        },
        closeButton: 'Close',
      },
    },
    report: {
      tooltip: 'Print report',
      documentTitle: 'Chart of Accounts',
      metaCountSingular: 'ledger account',
      metaCountPlural: 'ledger accounts',
      errorToast: 'Could not generate the report. Please try again.',
      popupBlockedToast:
        'The browser blocked the print window. Allow pop-ups for this site and try again.',
    },
  },
};
