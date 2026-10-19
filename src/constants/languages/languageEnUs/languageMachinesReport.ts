// src/constants/languages/languageEnUs/languageMachinesReport.ts
// English translation of the "Machines" module (Fleet domain, F-278,
// esteira 97-Esteiras/052, TASK-052-278-FE-01). Mirror of
// `languagePtBr/languageMachinesReport.ts`.

import { ModuleMachinesReport } from '@/@types/language/module-machines-report';

export const languageMachinesReport: ModuleMachinesReport = {
  report: {
    pageTitle: 'Machines',
    pageSubtitle: 'Machine maintenance report for the active farm.',
    fields: {
      equipmentIds: 'Machines',
      farmIds: 'Farms',
      startDate: 'Start Date',
      endDate: 'End Date',
      maintenanceType: 'Executor Type',
      maintenanceExecutor: 'Executor',
      format: 'Format',
    },
    equipmentsSearchPlaceholder: 'Search machine...',
    equipmentsSelectAll: 'Select all',
    equipmentsDeselectAll: 'Deselect all',
    equipmentsSelectedCount: 'Selected machines',
    equipmentsEmptyLabel: 'No machine found.',
    equipmentsErrorLabel: 'Error loading machines.',
    equipmentsRetryLabel: 'Try again',
    farmsSearchPlaceholder: 'Search farm...',
    farmsSelectAll: 'Select all',
    farmsDeselectAll: 'Deselect all',
    farmsSelectedCount: 'Selected farms',
    farmsEmptyLabel: 'No farm found.',
    maintenanceExecutorPlaceholder: 'Select the executor',
    maintenanceTypeOptions: {
      employee: 'Employee',
      provider: 'Provider',
    },
    downloadButton: 'Generate report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      equipmentsRequired: 'Select at least one machine.',
      endDateBeforeStartDate: 'End Date must be on or after Start Date.',
    },
  },
};
