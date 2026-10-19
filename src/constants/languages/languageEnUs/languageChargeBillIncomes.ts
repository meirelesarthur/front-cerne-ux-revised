// src/constants/languages/languageEnUs/languageChargeBillIncomes.ts
// EN-US translation of the "Accounts Receivable" module (ChargeBillIncome —
// Operational / Agriculture / Loading). Namespace `chargeBillIncomes` — FREE,
// no collision with `incomes` (Financial domain, homonymous entity).

import { ModuleChargeBillIncomes } from '@/@types/language/module-charge-bill-incomes';

export const languageChargeBillIncomes: ModuleChargeBillIncomes = {
  chargeBillIncome: {
    singularLabel: 'Account Receivable',
    pluralLabel: 'Accounts Receivable',
    titleModule: 'Accounts Receivable',
    list: {
      pageTitle: 'Accounts Receivable',
      pageSubtitle: 'Manage loading accounts receivable.',
      deletedToast: 'Account receivable deleted successfully.',
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
        titleEmpty: 'No accounts receivable registered.',
        descriptionEmpty: 'Start by adding the first account receivable.',
        cta: 'Add',
      },
      error: {
        message: 'Unable to load data.',
        retry: 'Try again',
      },
      deleteConfirm: {
        title: 'Confirm deletion',
        description: 'This account receivable will be permanently deleted.',
        warning: 'This action cannot be undone.',
      },
    },
    form: {
      title: {
        create: 'New Account Receivable',
        edit: 'Edit Account Receivable',
      },
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
      placeholders: {
        code: 'Automatically generated on save',
        provider: 'All Associated',
        cultivation: 'All',
      },
      toasts: {
        createdSuccess: 'Account receivable created successfully.',
        updatedSuccess: 'Account receivable updated successfully.',
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
        title: 'Account receivable not found.',
        description: 'The record may have been deleted or the link is incorrect.',
        back: 'Back',
      },
    },
  },
};
