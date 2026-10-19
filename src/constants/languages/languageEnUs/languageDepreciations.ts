// src/constants/languages/languageEnUs/languageDepreciations.ts
// EN-US translation of the DEPRECIATION module (Base Registrations /
// Assets, execução 027). Módulo TOP-LEVEL, mesma convenção flat de
// `costCenters`/`markers`/`depreciationForecasts` (não aninhado sob um
// guarda-chuva "cadastrosBase"). Fonte: Depreciation-Frontend-Contrato.md
// §8.3/§9/§10.

import { ModuleDepreciations } from '@/@types/language/module-depreciations';

export const languageDepreciations: ModuleDepreciations = {
  depreciation: {
    singularLabel: 'Depreciation',
    pluralLabel: 'Depreciations',
  },
  list: {
    equipment: {
      pageTitle: 'Monthly Depreciation',
      pageSubtitle: 'Manage the equipment depreciation records.',
      table: {
        period: 'Period',
        equipment: 'Equipment',
        valueToDepreciate: 'Value to Depreciate',
        monthlyDepreciation: 'Monthly Depreciation',
        remainingBalance: 'Remaining Balance',
        processedDate: 'Processed At',
      },
      emptyState: {
        titleEmpty: 'No depreciation records',
        descriptionEmpty: 'No depreciation has been generated yet.',
        titleFiltered: 'No results found',
        descriptionFiltered: 'Adjust the filters to find what you are looking for.',
      },
      error: {
        message: 'Unable to load the depreciation records.',
        retry: 'Try again',
      },
    },
    animal: {
      pageTitle: 'Animal Depreciation',
      pageSubtitle: 'Manage the animal depreciation records.',
      table: {
        animal: 'Animal',
        entryDate: 'Entry Date',
        valueToDepreciate: 'Value to Depreciate',
        processedDate: 'Processed Date',
        month: 'Month',
        year: 'Year',
        monthlyDepreciation: 'Monthly Depr. Value',
        remainingBalance: 'Balance to Depreciate',
      },
      emptyState: {
        titleEmpty: 'No depreciation records',
        descriptionEmpty: 'No depreciation has been generated yet.',
        titleFiltered: 'No results found',
        descriptionFiltered: 'Adjust the filters to find what you are looking for.',
      },
      error: {
        message: 'Unable to load the depreciation records.',
        retry: 'Try again',
      },
    },
  },
  tabs: {
    equipment: 'Equipment',
    animal: 'Animal',
  },
  filter: {
    title: 'Filter Depreciation',
    equipment: 'Equipment',
    equipmentAll: 'All',
    year: 'Year',
    yearPlaceholder: 'e.g. 2026',
    month: 'Month',
    monthAll: 'All',
    months: {
      january: 'January',
      february: 'February',
      march: 'March',
      april: 'April',
      may: 'May',
      june: 'June',
      july: 'July',
      august: 'August',
      september: 'September',
      october: 'October',
      november: 'November',
      december: 'December',
    },
  },
  generateModal: {
    title: 'Generate Depreciation',
    fields: {
      year: 'Year',
      month: 'Month',
      type: 'Type',
    },
    typeOptions: {
      equipment: 'Equipment',
      animal: 'Animal',
      all: 'Both',
    },
    submit: 'Generate',
    successToast: 'Depreciation generated successfully.',
    noEligibleToast: 'No records eligible for depreciation in the given period.',
  },
};
