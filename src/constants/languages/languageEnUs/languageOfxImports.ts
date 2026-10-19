// src/constants/languages/languageEnUs/languageOfxImports.ts
// EN-US translation of the "OFX Import" module (OfxImport — Financeiro,
// F-114, 97-Esteiras/064, TASK-064-OFX-FE-01). Mirror of languagePtBr's
// languageOfxImports.ts structure.

import { ModuleOfxImports } from '@/@types/language/module-ofx-imports';

export const languageOfxImports: ModuleOfxImports = {
  ofxImport: {
    singularLabel: 'OFX Import',
    pluralLabel: 'OFX Imports',
    list: {
      pageTitle: 'OFX Import',
      pageSubtitle: 'Manage the imported bank statement files.',
      deletedToast: 'OFX import removed successfully',
      searchPlaceholder: 'Search by description',
      table: {
        code: 'Code',
        description: 'Description',
        account: 'Account',
        startDate: 'Start Date',
        endDate: 'End Date',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        reconcile: 'Reconcile',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No OFX import registered.',
        descriptionEmpty: 'Start by importing the first bank statement.',
        titleFiltered: 'No import found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Import',
      },
      deleteConfirm: {
        title: 'Delete OFX import',
        description: 'Are you sure you want to delete this import',
      },
    },
    filter: {
      title: 'Filter OFX Imports',
      description: 'Description',
      account: 'Account',
      accountPlaceholder: 'Search account',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    form: {
      title: {
        create: 'New OFX Import',
        edit: 'Edit OFX Import',
        view: 'View OFX Import',
      },
      subtitle: {
        create: 'Upload a bank statement file (.ofx) to import.',
        edit: 'Change the OFX import data.',
        view: 'OFX import details.',
      },
      fields: {
        code: 'Code',
        description: 'Description',
        account: 'Account',
        startDate: 'Start Date',
        endDate: 'End Date',
        ofxFile: 'OFX File',
      },
      placeholders: {
        account: 'Search account',
      },
      fileUpload: {
        dropzoneTitle: 'Drag a .ofx file or click to select',
        dropzoneDraggingTitle: 'Drop the file here',
        hint: 'Only .ofx files, maximum 10MB.',
        changeLabel: 'Change file',
        removeLabel: 'Remove file',
        replaceLabel: 'Replace file',
        existingFileLabel: 'Current file',
        errorTypeMessage: 'File type not accepted.',
        errorSizeMessage: 'File exceeds the maximum size.',
      },
      actions: {
        download: 'Download attachment',
        downloadError: 'Could not download the attachment. Please try again.',
      },
      validation: {
        descriptionRequired: 'Enter the description.',
        descriptionMaxLength: 'Maximum of 255 characters.',
        accountRequired: 'Select the account.',
        startDateRequired: 'Enter the start date.',
        endDateRequired: 'Enter the end date.',
        ofxFileRequired: 'Select the OFX file.',
      },
    },
    reconciliation: {
      pageTitlePrefix: 'Reconciliation',
      backToHub: 'Back',
      loadError: 'Could not load the bank reconciliation.',
      cards: {
        total: 'Total Transactions',
        matched: 'Reconciled',
        pending: 'Pending',
        progress: 'Progress',
      },
      search: {
        placeholder: 'Search transaction...',
      },
      status: {
        reconciled: 'Reconciled',
        matchedPendingApply: 'Ready to apply',
        pending: 'Pending',
      },
      classification: {
        investment: 'Investment',
        redemption: 'Redemption',
        common: 'Common',
      },
      emptyState: {
        title: 'No transaction found.',
        description: 'Adjust the search or wait for the next statement.',
      },
      actions: {
        apply: 'Apply Reconciliation',
        applySuccess: 'Reconciliation applied successfully.',
        applyNothingToApply: 'There are no matched transactions waiting to be applied.',
        applyError: 'Could not apply the reconciliation.',
        linkTitle: 'Link title',
        createMovement: 'Create movement',
        unreconcile: 'Unreconcile',
        unreconcileConfirmTitle: 'Unreconcile movement',
        unreconcileConfirmDescription: 'The movement will go back to pending. Continue?',
        unreconcileSuccess: 'Movement unreconciled successfully.',
        unreconcileError: 'Could not unreconcile the movement.',
      },
      investmentBanner: {
        title: 'Batch Investments and Redemptions',
        description:
          'There are investment/redemption transactions still without a matching movement. Reconcile them in batch to speed things up.',
        cta: 'Reconcile in Batch',
        modalTitle: 'Batch Reconcile Investments and Redemptions',
        modalDescription:
          '1 transfer movement will be created for each transaction below, between the bank account and its linked investment account.',
        missingInvestmentAccount:
          'This bank account has no linked investment account — set up the link in Bank Accounts before reconciling in batch.',
        columnMemo: 'Description',
        columnDate: 'Date',
        columnValue: 'Value',
        confirmButton: 'Confirm Batch',
        successToast: 'Batch applied successfully.',
        partialErrorToast: 'transactions applied before the error',
      },
      newMovementModal: {
        title: 'New Movement',
        hint: 'Date, value and type come from the bank transaction and cannot be changed.',
        typeCategoryLabel: 'Category Type',
        submitButton: 'Save Movement',
        successToast: 'Movement created successfully.',
      },
      writeoffModal: {
        expenseTitle: 'Link Expense Title',
        incomeTitle: 'Link Income Title',
        hint: 'Select the open title(s) that match this bank transaction.',
        providerLabel: 'Provider',
        providerPlaceholder: 'Search provider',
        clientLabel: 'Client',
        clientPlaceholder: 'Search client',
        dueDateFrom: 'Due Date From',
        dueDateTo: 'Due Date To',
        columnSelect: '',
        columnNumber: 'Number',
        columnDueDate: 'Due Date',
        columnBalance: 'Balance',
        emptyTitles: 'No open title found for the given filters.',
        selectPartyHint: 'Select a provider/client to list the open titles.',
        selectAtLeastOneError: 'Select at least 1 title to continue.',
        continueButton: 'Continue',
        selectedTotalLabel: 'Selected total',
      },
    },
    report: {
      pageTitle: 'Reconciled Months',
      pageSubtitle: 'Number of reconciled movements per month.',
      table: {
        monthYear: 'Month/Year',
        quantity: 'Reconciled Qty.',
      },
      loadError: 'Could not load the reconciled months report.',
      retry: 'Try again',
      emptyState: {
        title: 'No reconciled month yet.',
        description: 'Reconcile bank movements to see the report here.',
      },
    },
  },
};
