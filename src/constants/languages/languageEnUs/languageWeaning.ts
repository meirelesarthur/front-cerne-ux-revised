// src/constants/languages/languageEnUs/languageWeaning.ts
// Tradução EN-US do módulo de DESMAMA (Operacional > Pecuária > Manejo).
// Namespace `weaning` — LIVRE (`02-arquitetura-frontend-desmama.md`).

import { ModuleWeaning } from '@/@types/language/module-weaning';

export const languageWeaning: ModuleWeaning = {
  weaning: {
    singularLabel: 'Weaning',
    pluralLabel: 'Weanings',
    list: {
      pageTitle: 'Weaning',
      pageSubtitle: 'Manage the farm weanings.',
      deletedToast: 'Weaning deleted successfully.',
      table: {
        code: 'Code',
        date: 'Date',
        type: 'Type',
        batch: 'Batch',
        responsible: 'Responsible',
        status: 'Processing',
      },
      status: {
        pending: 'Pending',
        finished: 'Finished',
        none: '—',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
        editDisabledTooltip: 'This weaning already has finished processing and cannot be edited.',
        deleteDisabledTooltip:
          'This weaning already has finished processing and cannot be deleted.',
      },
      emptyState: {
        titleEmpty: 'No weanings registered.',
        descriptionEmpty: 'Start by adding the first weaning.',
        titleFiltered: 'No records found.',
        descriptionFiltered: 'Try adjusting the filters.',
      },
      error: {
        message: 'Unable to load data.',
        retry: 'Try again',
      },
    },
    filter: {
      title: 'Filter weanings',
      responsible: 'Responsible',
    },
    deleteDialog: {
      title: 'Confirm deletion',
      descriptionTemplate:
        'Weaning {code} will be permanently deleted. This action cannot be undone.',
    },
    type: {
      recria: 'Rearing',
      venda: 'Sale',
    },
    form: {
      title: {
        create: 'New Weaning',
        edit: 'Edit Weaning',
        view: 'View Weaning',
      },
      fields: {
        code: 'Code',
        date: 'Date',
        type: 'Type',
        batch: 'Batch',
        transferBatch: 'Transfer batch',
        responsible: 'Responsible',
        animals: 'Animals (mothers)',
      },
      placeholders: {
        type: 'Select the type',
        batch: 'Select the batch',
        transferBatch: 'Select the transfer batch',
        animals: 'Search mothers by identification',
      },
      hints: {
        codeGeneratedOnSave: 'Generated on save',
        selectBatchFirst: 'Select the batch first',
      },
      validation: {
        transferSameAsOrigin: 'The transfer batch must be different from the source batch.',
      },
      buttons: {
        back: 'Back',
        edit: 'Edit',
      },
      finishedProcessingTooltip:
        'This weaning already has finished processing and can no longer be edited.',
    },
    report: {
      headerButtonLabel: 'Report',
      title: 'Weaning Report',
      pageSubtitle: 'Filter the period and format to generate the report.',
      fields: {
        startDate: 'Start date',
        endDate: 'End date',
        format: 'Format',
      },
      format: {
        pdf: 'PDF',
        xlsx: 'Excel (XLSX)',
      },
      submitButton: 'Export',
      cancelButton: 'Cancel',
      errorToast: 'Unable to generate the report.',
      downloadSuccess: 'Report generated successfully.',
    },
  },
};
