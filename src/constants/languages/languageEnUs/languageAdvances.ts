// src/constants/languages/languageEnUs/languageAdvances.ts
// English translation of the SALARY ADVANCE module (Administrative).
// TASK-FE-adiant-salarial (97-Esteiras/034) — core CRUD only (D2: financial
// dimension out of scope, no financial terms here).

import { ModuleAdvances } from '@/@types/language/module-advances';

export const languageAdvances: ModuleAdvances = {
  advance: {
    singularLabel: 'Salary Advance',
    pluralLabel: 'Salary Advances',
    list: {
      pageTitle: 'Salary Advances',
      pageSubtitle: 'Manage salary advances granted to employees.',
      deletedToast: 'Advance removed successfully',
      table: {
        employee: 'Employee',
        event: 'Event',
        date: 'Date',
        amount: 'Amount',
        actions: 'Actions',
      },
      actions: {
        view: 'View advance',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No advances registered.',
        descriptionEmpty: 'Start by adding the first salary advance.',
        titleFiltered: 'No advances found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Advance',
      },
      filter: {
        employee: 'Employee',
      },
    },
    detail: {
      generalData: {
        title: 'General Data',
      },
      fields: {
        employee: 'Employee',
        event: 'Event',
        date: 'Date',
        amount: 'Amount',
      },
      installments: {
        title: 'Advance Apportionment',
        month: 'Month',
        value: 'Value',
        empty: 'No installments linked.',
      },
      actions: {
        edit: 'Edit',
      },
      notFound: {
        title: 'Advance not found',
        description:
          'The requested advance does not exist, was removed, or belongs to another farm.',
        back: 'Back to Advances',
      },
    },
    form: {
      title: {
        create: 'New Salary Advance',
        edit: 'Edit Salary Advance',
      },
      fields: {
        employee: 'Employee',
        event: 'Event',
        date: 'Date',
        amount: 'Amount',
        installments: 'Advance Apportionment',
        financialType: 'Title Type',
        provider: 'Provider',
        proprietary: 'Proprietary',
        number: 'Number',
        note: 'Note',
        fiscalDocument: 'Fiscal Document',
        hasInput: 'Has Down Payment?',
        inputDate: 'Down Payment Date',
        inputValue: 'Down Payment Value',
        financialCategory: 'Financial Category',
        costCenter: 'Cost Center',
        apportionmentValue: 'Value',
        apportionmentPercent: '%',
        dueDate: 'Due Date',
        hasFinancial: 'Generate Financial?',
      },
      installmentRow: {
        month: 'Month',
        value: 'Value',
        addButton: 'Add installment',
        removeButton: 'Remove installment',
        emptyLabel: 'No installments added.',
        sumBadgeLabel: 'Installments sum',
      },
      sections: {
        financial: 'Generate Financial',
        financialInstallments: 'Financial Installments',
        apportionment: 'Category Apportionment',
        installmentGenerator: 'Generate Installments',
      },
      installmentGenerator: {
        count: 'Installment Count',
        firstDueDate: '1st Due Date',
        intervalDays: 'Interval (days)',
        generateButton: 'Generate Installments',
        overwriteConfirm: 'This will replace the current installments. Continue?',
      },
      financialInstallmentRow: {
        addButton: 'Add financial installment',
        removeButton: 'Remove financial installment',
        emptyLabel: 'No financial installments added.',
        sumBadgeLabel: 'Financial installments sum',
      },
      apportionmentRow: {
        addButton: 'Add category',
        removeButton: 'Remove category',
        emptyLabel: 'No category added to the apportionment.',
        sumBadgeLabel: 'Apportionment sum',
      },
      validation: {
        employeeRequired: 'Select the employee',
        eventRequired: 'Select the event',
        dateRequired: 'Date is required',
        amountRequired: 'Enter a valid amount',
        installmentsRequired: 'Add at least one installment',
        installmentsSum: 'The sum of installments must equal the advance total amount',
        installmentMonthRequired: 'Enter the installment month',
        installmentValueRequired: 'Enter a valid value for the installment',
        financialInstallmentsSum:
          'The sum of financial installments must equal the advance total amount',
        apportionmentSum:
          'The sum of the category apportionment must equal the advance total amount',
        typeRequired: 'Select the title type',
        fiscalDocumentRequired: 'Inform whether this is a fiscal document',
        financialCategoryRequired: 'Select the financial category',
        costCenterRequired: 'Select the cost center',
        dueDateRequired: 'Enter the financial installment due date',
        financialValueRequired: 'Enter a valid value for the financial installment',
        inputDateRequired: 'Enter the down payment date',
        inputValueRequired: 'Enter a valid down payment value',
      },
    },
  },
};
