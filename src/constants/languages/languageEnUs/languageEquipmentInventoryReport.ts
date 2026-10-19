// src/constants/languages/languageEnUs/languageEquipmentInventoryReport.ts
// English translation of the "Equipment Inventory Report" module (F-260,
// esteira 97-Esteiras/075, TASK-INV-FE-01). Mirror of
// `languagePtBr/languageEquipmentInventoryReport.ts`.

import { ModuleEquipmentInventoryReport } from '@/@types/language/module-equipment-inventory-report';

export const languageEquipmentInventoryReport: ModuleEquipmentInventoryReport = {
  report: {
    pageTitle: 'Equipment Inventory',
    pageSubtitle: 'Equipment inventory report by family, manager owner and status.',
    fields: {
      family: 'Family',
      proprietary: 'Manager Owner',
      status: 'Status',
      type: 'Report Type',
    },
    statusOptions: {
      active: 'Active',
      inactive: 'Inactive',
    },
    typeOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Download Report',
    downloadError: 'Could not generate the report.',
    statusRequiredHint: 'Select the Status to generate the report.',
    toasts: {
      success: 'Report generated successfully.',
      genericError: 'Could not generate the report.',
    },
    validation: {
      statusRequired: 'Status is required.',
    },
  },
};
