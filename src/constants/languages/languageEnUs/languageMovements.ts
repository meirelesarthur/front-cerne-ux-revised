// src/constants/languages/languageEnUs/languageMovements.ts
// EN-US translation of the "Cash / Bank Transactions" module (Movement —
// Financial, TASK-MV-FE-01). Mirror of languagePtBr/languageMovements.ts.
// Page title mirrors the sidebar label already fixed in
// `languageSidebar.ts` (item `fin-cai`, "Cash / Bank Transactions").

import { ModuleMovements } from '@/@types/language/module-movements';

export const languageMovements: ModuleMovements = {
  movement: {
    singularLabel: 'Movement',
    pluralLabel: 'Movements',
    list: {
      pageTitle: 'Cash / Bank Transactions',
      pageSubtitle: 'Manage cash and bank entries.',
      deletedToast: 'Movement removed successfully',
      table: {
        code: 'Code',
        date: 'Date',
        type: 'Type',
        typeCategory: 'Category Type',
        account: 'Account',
        proprietary: 'Owner',
        value: 'Amount',
        totalAllocated: 'Total Allocated',
        interest: 'Interest',
      },
      actions: {
        edit: 'Edit',
        allocation: 'Edit Allocation',
        delete: 'Delete',
        viewOpeningBalance: 'View in Opening Balance',
      },
      footer: {
        pageTotal: 'Page total',
      },
      emptyState: {
        titleEmpty: 'No movement registered.',
        descriptionEmpty: 'Start by adding the first movement.',
        titleFiltered: 'No movement found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Movement',
      },
      deleteConfirm: {
        title: 'Delete movement',
        description: 'Are you sure you want to delete this movement',
        cascadeTitle: 'Delete movement with generated obligations',
        cascadeDescription:
          'This movement generated {count} Payable/Receivable obligation(s). If you continue, those obligations and their settlements will be deleted too.',
        cascadeConfirm: 'Delete anyway',
      },
    },
    filter: {
      title: 'Filter Movements',
      startDate: 'Start Date',
      endDate: 'End Date',
      account: 'Account',
      accountPlaceholder: 'Search account',
      proprietary: 'Owner',
      proprietaryPlaceholder: 'Search owner',
      type: 'Type',
      category: 'Category',
      categoryPlaceholder: 'Search category',
      harvest: 'Harvest',
      harvestPlaceholder: 'Search harvest',
      categoryType: 'Category Type Filter',
      categoryTypePlaceholder: 'Select the category type',
      categoryDisabledHint: 'Select the category type first',
      valueMin: 'Min. amount',
      valueMax: 'Max. amount',
    },
    form: {
      title: { create: 'New Movement', edit: 'Edit Movement' },
      subtitle: {
        create: 'Register a new cash/bank entry.',
        edit: 'Change the cash/bank entry data.',
      },
      fields: {
        date: 'Movement Date',
        type: 'Type',
        typeCategory: 'Category Type',
        account: 'Account',
        destinationAccount: 'Destination Account',
        originAccount: 'Origin Account',
        farm: 'Farm',
        proprietary: 'Owner',
        client: 'Client',
        provider: 'Provider',
        value: 'Amount',
        interest: 'Interest',
        document: 'Document',
        note: 'History',
        // TASK-MV-FE-09 (Ajuste 6) — mechanical translation of the pt-BR
        // labels required by the task-packet (legacy exact text: "Dedutível"
        // / "Gera Obrigação").
        fiscalDocument: 'Deductible',
        generatesObligation: 'Generates Obligation',
      },
      placeholders: {
        account: 'Search account',
        destinationAccount: 'Search destination account',
        originAccount: 'Search origin account',
        farm: 'Search farm',
        proprietary: 'Search owner',
        client: 'Search client',
        provider: 'Search provider',
        document: 'Document number',
        note: 'Note about the movement',
      },
      // TASK-MV-FE-11 — create/edit Client button next to the Select.
      // TASK-MV-FE-13 — create/edit Provider button next to the Select.
      actions: {
        addClientAria: 'Register new client',
        editClientAria: 'Edit selected client',
        addProviderAria: 'Register new provider',
        editProviderAria: 'Edit selected provider',
      },
      // TASK-MV-FE-09 (Ajustes 4/7) — help tooltips next to the label.
      hints: {
        documentTooltip:
          'Identification of the document being registered\nExample: Receipt, Invoice, etc...',
        fiscalDocumentTooltip:
          'Indicates whether this fiscal document can be used for tax deduction.',
      },
      typeOptions: {
        income: 'Income',
        expense: 'Expense',
      },
      typeCategoryOptions: {
        income: 'Income',
        expense: 'Expense',
        transfer: 'Internal Transfer',
        financing: 'Financing/Loan',
        initialBalance: 'Opening Balance',
      },
      allocations: {
        sectionTitle: 'Allocation',
        sectionHint: 'Split the movement amount between category and cost center.',
        sumLabel: 'Total allocated',
        remainingLabel: 'Remaining',
        overLabel: 'Over by',
        balancedLabel: 'Balanced',
        sumHint: 'the sum differs from the informed amount',
        emptyTitle: 'No allocation item added. Add at least one item.',
        addRowLabel: 'Add Allocation',
        removeRowLabel: 'Remove allocation',
        fields: {
          category: 'Category',
          center: 'Cost Center',
          planAccount: 'Chart of Accounts',
          harvest: 'Harvest',
          value: 'Amount',
          percent: 'Percentage',
        },
        placeholders: {
          category: 'Search category',
          center: 'Search cost center',
          planAccount: 'Search chart of accounts',
          harvest: 'Search harvest',
        },
        reports: {
          categoryTooltip: 'Print Financial Categories report',
          planAccountTooltip: 'Print Chart of Accounts report',
          allocationTooltip: 'Print current allocation',
          allocationDocumentTitle: 'Movement Allocation',
          allocationColumnCategory: 'Category',
          allocationColumnPlanAccount: 'Chart of Accounts',
          allocationColumnCenter: 'Cost Center',
          allocationColumnValue: 'Amount',
          allocationColumnPercent: 'Percentage',
          allocationTotalLabel: 'Total',
          allocationPlanAccountEmpty: '—',
          errorToast: 'Could not generate the report. Try again.',
          popupBlockedToast:
            'The browser blocked the print window. Allow pop-ups for this site and try again.',
        },
      },
      validation: {
        dateRequired: 'Enter the movement date.',
        typeRequired: 'Select the type.',
        typeCategoryRequired: 'Select the category type.',
        accountRequired: 'Select the account.',
        destinationAccountRequired: 'Select the destination account.',
        proprietaryRequired: 'Select the owner.',
        valueRequired: 'Enter the amount.',
        valueNotZero: 'The movement amount cannot be 0.',
        documentMaxLength: 'Maximum 100 characters.',
        noteMaxLength: 'Maximum 600 characters.',
        allocationsMinLength: 'Add at least one allocation item.',
        allocationCategoryRequired: 'Select the category.',
        allocationCenterRequired: 'Select the cost center.',
        allocationValueRequired: 'Enter the item amount.',
        allocationValueMin: 'The item amount must be greater than zero.',
        // TASK-MV-FE-08 (Ajuste 2) — mechanical translation of the pt-BR
        // text required by the task-packet (legacy key 'total_rateio').
        allocationsSumMismatch: "The allocation total differs from the title's total value.",
      },
      openingBalanceNotice:
        'Opening Balance movement: edit it in Base Registers > Opening Balance.',
      cascadeSave: {
        title: 'Save movement with generated obligations',
        description:
          'This movement generated {count} Payable/Receivable obligation(s). If you save, those obligations and their settlements will be deleted and, if applicable, a new draft will be generated.',
        confirm: 'Save anyway',
      },
      obligationDraftGenerated: {
        title: 'Financial obligation generated',
        ofxNotice:
          'This movement generated a financial obligation draft. To create the obligation in Payable/Receivable, edit the movement in Cash/Bank Movements and save it again.',
        navigating: 'Movement saved. Complete the obligation to link the financing.',
        noPermission:
          'Movement saved. You do not have permission to create the obligation; ask someone with Payable/Receivable access.',
      },
    },
    allocation: {
      title: 'Edit Allocation',
      subtitle: 'Adjust the allocation distribution of this movement.',
      headerValueLabel: 'Net movement amount',
      toastSuccess: 'Allocation updated successfully',
    },
  },
};
