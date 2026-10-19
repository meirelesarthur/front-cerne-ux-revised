// src/constants/languages/languageEnUs/languageProdArea.ts
// English translation of the "Prod./Área" (Production by Area) module —
// F-299, 97-Esteiras/012, Tarefa 47/48. Mirror of
// `languagePtBr/languageProdArea.ts`.

import { ModuleProductionAreaReport } from '@/@types/language/module-production-area-report';

export const languageProdArea: ModuleProductionAreaReport = {
  report: {
    pageTitle: 'Production by Area',
    pageSubtitle: 'Production by area report for the active farm.',
    fields: {
      productionCycle: 'Production Cycle',
      areas: 'Areas',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    cyclePlaceholder: 'Select',
    areasSearchPlaceholder: 'Search area',
    areasSelectAll: 'Select All',
    areasDeselectAll: 'Deselect All',
    areasSelectedCount: 'Selected areas',
    areasHint: 'With no selection, the report considers all areas.',
    printButton: 'Print',
    downloadError: 'Could not generate the report.',
    popupBlocked: 'The browser blocked the new tab. Allow pop-ups for this site and try again.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
      endDateBeforeStart: 'The End Date must be on or after the Start Date.',
    },
  },
};
