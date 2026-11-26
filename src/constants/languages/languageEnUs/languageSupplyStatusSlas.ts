// src/constants/languages/languageEnUs/languageSupplyStatusSlas.ts
// English translation of the "SLA Parameters" module (SupplyStatusSla —
// Administrative / Supplies, TASK-FE-SLA-01). See
// `@/@types/language/module-supply-status-slas` for the full contract.

import { ModuleSupplyStatusSlas } from '@/@types/language/module-supply-status-slas';

export const languageSupplyStatusSlas: ModuleSupplyStatusSlas = {
  supplyStatusSla: {
    singularLabel: 'SLA Parameter',
    pluralLabel: 'SLA Parameters',
    titleModule: 'SLA Parameters',

    list: {
      pageTitle: 'SLA Parameters',
      pageSubtitle:
        'Configure the maximum tolerated time, in hours, for each purchase request status.',
      table: {
        statusLabel: 'Status',
        maxHours: 'Max time (hours)',
        actions: {
          edit: 'Edit',
          save: 'Save',
          cancel: 'Cancel',
        },
      },
      noFarmState: {
        title: 'Select a farm',
        description: 'Select an active farm to see the SLA parameters.',
      },
      emptyState: {
        title: 'No parameters found',
        description: 'There are no SLA parameters registered for the active farm.',
      },
      error: {
        message: 'Could not load the SLA parameters.',
        retry: 'Try again',
      },
      validation: {
        maxHoursRequired: 'Max time is required.',
        maxHoursInvalid: 'Max time must be a valid integer.',
        maxHoursMin: 'Max time cannot be negative.',
      },
      savedToast: 'SLA Status updated successfully!',
      recordsCount: 'No. of Records: {total}',
      tenantNotice: 'Attention: the maximum time set here applies to all farms of the tenant.',
    },
  },
};
