// src/constants/languages/languageEnUs/languageAgricultureApplicationManagementReport.ts
// EN-US translation of the "Field Application/Management" module (Farming
// report — F-220, execution 059). Structural mirror of
// `languageProductionCostingAreaReport.ts`/`languageStockAbcReport.ts`'s
// `report` block.

import { ModuleAgricultureApplicationManagementReport } from '@/@types/language/module-agriculture-application-management-report';

export const languageAgricultureApplicationManagementReport: ModuleAgricultureApplicationManagementReport =
  {
    report: {
      pageTitle: 'Field Application/Management',
      pageSubtitle: 'Applications and field management report by plot, for the selected period.',
      fields: {
        productionCycle: 'Production Cycle',
        areas: 'Areas',
        startDate: 'Start Date',
        endDate: 'End Date',
        reportType: 'Report Type',
        group: 'Group',
        category: 'Category',
        kind: 'Class',
        format: 'Format',
      },
      productionCyclePlaceholder: 'Select the production cycle',
      areasPlaceholder: 'Select the areas',
      reportTypeOptions: {
        inputs: 'Inputs',
        services: 'Services',
        occurrences: 'Occurrences',
      },
      reportTypePlaceholder: 'Select the report type',
      groupPlaceholder: 'Select the group',
      categoryPlaceholder: 'Select the category',
      categoryDisabledHint: 'Select a group first',
      kindPlaceholder: 'Select the class',
      kindDisabledHint: 'Select a category first',
      formatOptions: {
        pdf: 'PDF',
        xlsx: 'Excel',
      },
      downloadButton: 'Download Report',
      downloadSuccess: 'Report generated successfully.',
      downloadError: 'Could not generate the report.',
      periodRequiredHint: 'Select the Start Date and the End Date to generate the report.',
      validation: {
        periodRequired: 'The date is required.',
      },
    },
  };
