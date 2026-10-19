// src/constants/languages/languageEnUs/languageFechamentoSemana.ts
// EN-US translation of the FECHAMENTO SEMANA module (Operational). Namespace
// `fechamentoSemana` — FREE. This locale is mandatory: the `singularLabel`/
// `pluralLabel` here feed the `fechamentoSemana` query keys
// (src/constants/query-key.ts).

import { ModuleFechamentoSemana } from '@/@types/language/module-fechamento-semana';

export const languageFechamentoSemana: ModuleFechamentoSemana = {
  closingWeek: {
    singularLabel: 'Closing Week',
    pluralLabel: 'Closing Weeks',
    titleModule: 'Closing Weeks',
    list: {
      pageTitle: 'Closing Weeks',
      pageSubtitle: 'Manage the farm weekly closings.',
      deletedToast: 'Closing week deleted successfully.',
      table: {
        code: 'No.',
        week: 'Week',
        startDate: 'Start Date',
        endDate: 'End Date',
      },
      actions: {
        view: 'View',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No closing weeks registered.',
        descriptionEmpty: 'Start by adding the first closing week.',
        cta: 'Add',
      },
      error: {
        message: 'Unable to load the data.',
        retry: 'Try again',
      },
    },
    deleteDialog: {
      title: 'Confirm deletion',
      descriptionTemplate:
        'Closing week No. {code} will be permanently deleted. This action cannot be undone.',
    },
    search: {
      pageTitle: 'New closing week',
      pageSubtitle: 'Select the period to generate the report.',
      fields: {
        startDate: 'Start date',
        endDate: 'End date',
      },
      validation: {
        startDateRequired: 'Start date is required.',
        endDateRequired: 'End date is required.',
        endDateBeforeStartDate: 'End date cannot be before start date.',
      },
      generateButton: 'Generate',
      emptyReport: 'No charges found in this period.',
      businessErrorFallback: 'Could not close the week. Please try again.',
    },
    report: {
      reportTitle: 'Average Price Formation Statement',
      table: {
        cultivation: 'Cultivation',
        quality: 'Quality',
        quantityFinal: 'Final Qty.',
        expenses: 'Apportioned expenses',
        amount: 'Average price',
        items: {
          date: 'Date',
          dueDate: 'Due date',
          provider: 'Provider',
          client: 'Client',
          quantityFinal: 'Qty. Kg',
          price: 'Price',
          totalAmount: 'Operation amount',
        },
      },
      code: 'No.',
      week: 'Week',
      saveButton: 'Save',
      backButton: 'Back',
      savedToast: 'Week closed successfully.',
    },
    detail: {
      fields: {
        code: 'No.',
        date: 'Date',
        startDate: 'Start Date',
        endDate: 'End Date',
        week: 'Week',
        responsible: 'Responsible',
      },
      itemsSectionTitle: 'Closing items',
      itemsTable: {
        cultivation: 'Cultivation',
        quality: 'Quality',
        amount: 'Amount',
      },
      itemsEmptyState: 'No items saved in this closing week.',
      backButton: 'Back',
      notFound: 'Closing week not found.',
    },
  },
};
