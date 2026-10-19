// src/constants/languages/languageEnUs/languageMachinesMaintenanceReport.ts
// English translation of the "Maintenance" module (Fleet report — F-276,
// esteira 97-Esteiras/078, TASK-F276-F01). Mirror of
// `languagePtBr/languageMachinesMaintenanceReport.ts`.

import { ModuleMachinesMaintenanceReport } from '@/@types/language/module-machines-maintenance-report';

export const languageMachinesMaintenanceReport: ModuleMachinesMaintenanceReport = {
  report: {
    pageTitle: 'Maintenance',
    pageSubtitle: 'Maintenance report for the active farm machines.',
    fields: {
      equipmentIds: 'Machines',
      farmIds: 'Farms',
      warehouse: 'Warehouse',
      product: 'Product',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    equipmentsSearchPlaceholder: 'Search machine...',
    equipmentsSelectAll: 'Select all',
    equipmentsDeselectAll: 'Deselect all',
    equipmentsSelectedCount: 'Machines selected',
    equipmentsEmptyLabel: 'No machine found.',
    equipmentsErrorLabel: 'Failed to load machines.',
    equipmentsRetryLabel: 'Retry',
    farmsSearchPlaceholder: 'Search farm...',
    farmsSelectAll: 'Select all',
    farmsDeselectAll: 'Deselect all',
    farmsSelectedCount: 'Farms selected',
    farmsEmptyLabel: 'No farm found.',
    farmsErrorLabel: 'Failed to load farms.',
    farmsRetryLabel: 'Retry',
    warehousePlaceholder: 'All',
    productPlaceholder: 'Select',
    downloadPdfButton: 'Download PDF',
    downloadExcelButton: 'Download Excel',
    exportFileName: 'relatorio_manutencoes',
    popupBlocked: 'Could not open the new tab. Check your pop-up blocker.',
    toasts: {
      success: 'Report generated successfully.',
      genericError: 'Could not generate the report.',
    },
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
      endDateAfterStartDate: 'The end date must be on or after the start date.',
      equipmentRequired: 'Select at least one machine.',
    },
  },
};
