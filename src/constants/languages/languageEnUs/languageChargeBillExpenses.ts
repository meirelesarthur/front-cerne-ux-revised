// src/constants/languages/languageEnUs/languageChargeBillExpenses.ts
// EN-US translation of the "Accounts Payable" module (ChargeBillExpense —
// Operational / Agriculture / Loading). Namespace `chargeBillExpenses` —
// FREE, no collision with `expenses` (Financial domain, homonymous entity)
// nor `chargeBillIncomes` (twin).

import { ModuleChargeBillExpenses } from '@/@types/language/module-charge-bill-expenses';

export const languageChargeBillExpenses: ModuleChargeBillExpenses = {
  chargeBillExpense: {
    singularLabel: 'Account Payable',
    pluralLabel: 'Accounts Payable',
    titleModule: 'Accounts Payable',
    list: {
      pageTitle: 'Accounts Payable',
      pageSubtitle: 'Manage loading accounts payable.',
      deletedToast: 'Account payable deleted successfully.',
      columns: {
        code: 'Code',
        dueDate: 'Due Date',
        provider: 'Supplier',
        cultivation: 'Cost Allocation',
        amount: 'Amount',
        actions: 'Actions',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      fallback: {
        provider: 'All Associated',
        cultivation: 'All',
      },
      emptyState: {
        titleEmpty: 'No accounts payable registered.',
        descriptionEmpty: 'Start by adding the first account payable.',
        cta: 'Add',
      },
      error: {
        message: 'Unable to load data.',
        retry: 'Try again',
      },
      deleteConfirm: {
        title: 'Confirm deletion',
        description: 'This account payable will be permanently deleted.',
        warning: 'This action cannot be undone.',
      },
    },
    form: {
      title: {
        create: 'New Account Payable',
        edit: 'Edit Account Payable',
      },
      fields: {
        code: 'Code',
        dtEmission: 'Issue Date',
        dueDate: 'Due Date',
        number: 'Document No.',
        amount: 'Amount',
        provider: 'Supplier',
        branch: 'Supplier Branch',
        cultivation: 'Cost Allocation',
        description: 'Description',
      },
      placeholders: {
        code: 'Automatically generated on save',
        provider: 'All Associated',
        cultivation: 'All',
      },
      hints: {
        branchRequiresProvider: 'Select a supplier first',
        providerHasNoBranches: 'This supplier has no registered branches',
      },
      toasts: {
        createdSuccess: 'Account payable created successfully.',
        updatedSuccess: 'Account payable updated successfully.',
      },
    },
    detail: {
      fields: {
        code: 'Code',
        dtEmission: 'Issue Date',
        dueDate: 'Due Date',
        number: 'Document No.',
        amount: 'Amount',
        provider: 'Supplier',
        cultivation: 'Cost Allocation',
        description: 'Description',
      },
      actions: {
        edit: 'Edit',
        back: 'Back',
      },
      notFound: {
        title: 'Account payable not found.',
        description: 'The record may have been deleted or the link is incorrect.',
        back: 'Back',
      },
    },
  },
};
