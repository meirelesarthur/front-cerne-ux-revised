// src/constants/languages/languageEnUs/languageMachinesSupplyReport.ts
// English translation of the "Fuel Supplies" module (Fleet domain, F-277,
// esteira 97-Esteiras/054, TASK-054-277-FE-01). Mirror of
// `languagePtBr/languageMachinesSupplyReport.ts`.

import { ModuleMachinesSupplyReport } from '@/@types/language/module-machines-supply-report';

export const languageMachinesSupplyReport: ModuleMachinesSupplyReport = {
  report: {
    pageTitle: 'Fuel Supplies',
    pageSubtitle: 'Machine fuel supply report for the active farm.',
    fields: {
      equipmentIds: 'Machines',
      farmIds: 'Farms',
      productIds: 'Products',
      warehouseId: 'Warehouse',
      startDate: 'Start Date',
      endDate: 'End Date',
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
    farmsErrorLabel: 'Error loading farms.',
    farmsRetryLabel: 'Try again',
    warehousePlaceholder: 'Select the warehouse',
    productsSearchPlaceholder: 'Search product...',
    productsSelectAll: 'Select all',
    productsDeselectAll: 'Deselect all',
    productsSelectedCount: 'Selected products',
    productsEmptyLabel: 'No product found.',
    downloadButton: 'Generate report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      equipmentsRequired: 'Select at least one machine.',
      endDateBeforeStartDate: 'End Date must be on or after Start Date.',
    },
  },
};
