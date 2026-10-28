// src/constants/languages/languageEnUs/languageHarvests.ts
// EN-US translation of the HARVESTS (Safras) module (Base Registrations).

import { ModuleHarvests } from '@/@types/language/module-harvests';

export const languageHarvests: ModuleHarvests = {
  harvest: {
    singularLabel: 'Harvest',
    list: {
      pageTitle: 'Harvests',
      pageSubtitle: 'Manage the farm reference agricultural periods.',
      deletedToast: 'Harvest removed successfully',
      table: {
        description: 'Description',
        startDate: 'Start Date',
        endDate: 'End Date',
        active: 'Status',
        activeLabel: 'Active',
        inactiveLabel: 'Inactive',
        weeks: 'Weeks',
        weeksSuffix: 'wks',
      },
      actions: {
        view: 'View harvest',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No harvests registered.',
        descriptionEmpty: 'Start by adding your first harvest.',
        titleFiltered: 'No harvests found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Harvest',
      },
    },
    filter: {
      title: 'Filter harvests',
      search: 'Search',
      searchPlaceholder: 'Search by description',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
    },
    form: {
      title: {
        create: 'New Harvest',
        edit: 'Edit Harvest',
      },
      subtitle: {
        create: 'Register a new harvest to organize the farm agricultural periods.',
        edit: 'Update the harvest data.',
      },
      steps: { general: "General Data", weeks: "Weeks" },
      stepTitles: { general: "Harvest general data", weeks: "Weeks Color Code" },
      weeksSubtitle: "Set the color of each week. This code is shown in calendars, reports and dashboards. Click the weeks to paint them.",
      stepCounter: { label: "Step", of: "of" },
      fields: {
        description: 'Description',
        startDate: 'Start Date',
        endDate: 'End Date',
        isEnabled: 'Active',
        herdControl: 'Herd Control',
        autoEvolution: 'Automatic Herd Evolution',
        firstMonth: '1st Half starts on',
        secondMonth: '2nd Half starts on',
      },
      placeholders: {
        description: 'E.g.: Harvest 2026/2027',
      },
      herdControlOptions: {
        individual: 'Individual',
        lote: 'Lot',
      },
      monthOptions: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
      weeks: {
        sectionTitle: 'Harvest Weeks',
        sectionHint:
          'Automatically generated from the informed period. Click or drag over the weeks to paint them with the selected color.',
        weeksCountSuffix: 'weeks',
        emptyTitle:
          'No weeks generated. Adjust the start and end dates to generate the harvest weeks.',
        emptyCta: 'Go to dates',
        toolbarLabel: 'Paint with:',
        resetCycleButton: 'Reset color cycle',
        resetCycleDialogTitle: 'Reset color cycle?',
        resetCycleDialogDescription:
          'This replaces all manually painted colors with the default cycle. This action cannot be undone.',
        resetCycleDialogConfirm: 'Reset',
        overviewLabel: 'Overview — how it will appear in reports and calendars',
        distributionLabel: 'Distribution:',
        distributionUnitSuffix: 'wks',
        gridAriaLabelEditable: 'Week grid — navigate with arrow keys and paint with Enter or Space',
        gridAriaLabelReadOnly: 'Week grid',
        tileAriaLabel: {
          prefix: 'Week',
          rangeSeparator: 'to',
          colorPrefix: 'color',
          currentSuffix: 'current week',
          paintHint: 'Enter or Space paints with',
        },
        colorLabels: {
          amarelo: 'Yellow',
          azulClaro: 'Light blue',
          azulEscuro: 'Dark blue',
          azulMarinho: 'Navy blue',
          branco: 'White',
          marrom: 'Brown',
          palha: 'Straw',
          preto: 'Black',
          rosa: 'Pink',
        },
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
        startDateRequired: 'Start date is required',
        endDateRequired: 'End date is required',
        dateInvalid: 'Enter a valid date',
        endDateBeforeStart: 'The end date must be on or after the start date.',
        herdControlRequired: 'Select the herd control',
        monthRange: 'Select a valid month',
        weeksRequired: 'Generate at least one week by informing a valid period',
        weekDateRange: 'The week end date must be on or after the start date',
        weekColorInvalid: 'Select a valid color from the palette',
      },
    },
    detail: {
      weeksReadOnlyHint: 'Visual code of the harvest weeks (read-only).',
      subtitle: {
        herdControlPrefix: 'Herd',
        autoEvolutionPrefix: 'Evolution',
      },
      stats: {
        weeksLabel: 'Weeks',
        herdControlLabel: 'Herd Control',
        autoEvolutionLabel: 'Automatic Evolution',
        autoEvolutionEnabled: 'Enabled',
        autoEvolutionDisabled: 'Disabled',
        durationLabel: 'Duration',
        durationUnit: 'months',
        currentWeekLabel: 'Current Week',
        currentWeekEmpty: 'No current week for today',
      },
      generalData: {
        title: 'General Data',
      },
      actions: {
        edit: 'Edit',
      },
      notFound: {
        title: 'Harvest not found',
        description:
          'The requested harvest does not exist, was removed, or belongs to another farm.',
        back: 'Back to Harvests',
      },
    },
  },
};
