// src/constants/languages/languageEnUs/languageLoggedHoursReport.ts
// EN-US translation of the "Logged Hours" module (Personnel Management report
// — F-275, 97-Esteiras/012, Task 47 + post-manual-QA fix). Structural mirror
// of the `report` block in `languageCustoProducao.ts`, without drill-down and
// without an on-screen preview/grid.

import { ModuleLoggedHoursReport } from '@/@types/language/module-logged-hours-report';

export const languageLoggedHoursReport: ModuleLoggedHoursReport = {
  report: {
    pageTitle: 'Logged Hours',
    pageSubtitle: 'User session time, grouped by tenant and farm.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      tenant: 'Tenant',
      farm: 'Farm',
    },
    tenantPlaceholder: 'Select the tenant',
    farmPlaceholder: 'All',
    filtersSectionTitle: 'Filters',
    downloadPdfButton: 'Generate PDF',
    downloadError: 'Could not generate the report.',
    popupBlocked: 'The browser blocked the new tab. Allow pop-ups for this site and try again.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
      endDateBeforeStartDate: 'The End Date must be equal to or after the Start Date.',
    },
  },
};
