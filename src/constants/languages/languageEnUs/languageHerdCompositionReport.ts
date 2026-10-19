// src/constants/languages/languageEnUs/languageHerdCompositionReport.ts
// English translation of the "Composição Rebanho" (Herd Composition) module —
// F-269, lote 079. Mirror of
// `languagePtBr/languageHerdCompositionReport.ts`.

import { ModuleHerdCompositionReport } from '@/@types/language/module-herd-composition-report';

export const languageHerdCompositionReport: ModuleHerdCompositionReport = {
  report: {
    pageTitle: 'Herd Composition',
    pageSubtitle:
      'Herd composition report for the active farm, with configurable filters, columns and ordering.',
    fields: {
      batch: 'Batch',
      gender: 'Gender',
      breed: 'Breed',
      category: 'Category',
      startDate: 'Entry Start Date',
      endDate: 'Entry End Date',
      weightMin: 'Minimum Current Weight (kg)',
      weightMax: 'Maximum Current Weight (kg)',
      status: 'Status',
      order: 'Order by',
      orderDirection: 'Direction',
      format: 'Format',
    },
    batchPlaceholder: 'Select the batch',
    breedPlaceholder: 'Select the breed',
    categoryPlaceholder: 'Select the category',
    genderPlaceholder: 'Select the gender',
    statusPlaceholder: 'Select the status',
    columnsFieldLabel: 'Report Columns',
    columnsSearchPlaceholder: 'Search column...',
    columnsEmptyMessage: 'No column found.',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
    downloadButton: 'Download report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    columns: {
      identification: 'Identification',
      father: 'Sire',
      category_description: 'Category',
      breed_description: 'Breed',
      batch: 'Batch',
      farm: 'Farm',
      gender: 'Gender',
      birth_date: 'Birth Date',
      age: 'Age (years)',
      weight: 'Current Weight (kg)',
      start_weight: 'Initial Weight (kg)',
      last_weighing: 'Last Weighing Date',
      gmd: 'ADG (kg/day)',
      nutrition: 'Nutrition',
      sanitary_total: 'Sanitary (R$)',
      status: 'Status',
      entry_date: 'Entry Date',
      note: 'Note',
    },
    orderOptions: {
      identification: 'Identification',
      category_description: 'Category',
      breed_description: 'Breed',
      gender: 'Gender',
      birth_date: 'Birth Date',
      weight: 'Current Weight (kg)',
      last_weighing: 'Last Weighing Date',
      gmd: 'ADG (kg/day)',
      status: 'Status',
      entry_date: 'Entry Date',
    },
    orderDirectionOptions: {
      asc: 'Ascending',
      desc: 'Descending',
    },
    formatOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    validation: {
      invalidDateRange: 'The End Date must be equal to or later than the Start Date.',
      invalidValue: 'Invalid value.',
      columnsRequired: 'Select at least one column.',
    },
  },
};
