// src/constants/languages/languageEnUs/languageAreas.ts
// Areas module (Area) — EN-US. TASK-FE-415 (foundation). See
// `src/@types/language/module-areas/index.ts` (type contract).

import { ModuleAreas } from '@/@types/language/module-areas';

export const languageAreas: ModuleAreas = {
  area: {
    singularLabel: 'Area',
    pluralLabel: 'Areas',
    // Areas sub-list inside the expanded Farm row (TASK-FE-416).
    list: {
      table: {
        description: 'Name',
        totalArea: 'Total Area (ha)',
        active: 'Active',
        activeLabel: 'Yes',
        inactiveLabel: 'No',
      },
      actions: {
        view: 'View area',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        title: 'No area registered in this farm.',
        description: 'Add the first area to get started.',
      },
      errorState: {
        title: 'Could not load the areas.',
        description: 'Try again in a moment.',
      },
      deletedToast: 'Area removed successfully',
    },
    typeOptions: {
      productive: 'Productive',
      reserve: 'Reserve',
    },
    // EXACT mirror of `languageBaseRegistrations.grazing.colorOptions` (same
    // backend `AreaColor` Enum, same order, same labels).
    colorOptions: {
      white: 'White',
      blue: 'Blue',
      black: 'Black',
      green: 'Green',
      yellow: 'Yellow',
      red: 'Red',
      gray: 'Gray',
      lightGray: 'Light Gray',
      lightBlue: 'Light Blue',
      darkBlue: 'Dark Blue',
      turquoise: 'Turquoise',
      darkGreen: 'Dark Green',
      lightGreen: 'Light Green',
      orange: 'Orange',
    },
    form: {
      validation: {
        descriptionRequired: 'Enter the area description.',
        descriptionMaxLength: 'Description must be at most 100 characters.',
        registrationMaxLength: 'Registration must be at most 30 characters.',
        dateRequired: 'Enter the area creation date.',
        typeRequired: 'Select the area type.',
        colorRequired: 'Select the area color.',
        coordinatesRequired: 'Draw the area on the map or import a KML file.',
        totalAreaRequired: 'Enter the total area (ha).',
        productiveAreaRequired: 'Enter the productive area (ha).',
        unproductiveAreaRequired: 'Enter the unproductive area (ha).',
        isEnabledRequired: 'Inform whether the area is active.',
      },
      title: {
        create: 'New area',
        edit: 'Edit area',
      },
      sections: {
        map: 'Area boundary',
        details: 'Area details',
      },
      fields: {
        description: 'Description',
        registration: 'Registration',
        date: 'Creation date',
        proprietary: 'Managing owner',
        type: 'Type',
        activity: 'Activity/crop',
        recreationArea: 'Recreation area',
        color: 'Area color',
        infrastructure: 'Infrastructure',
        totalArea: 'Area (ha)',
        productiveArea: 'Productive area (ha)',
        unproductiveArea: 'Unproductive area (ha)',
        isEnabled: 'Active',
        note: 'Note',
      },
      placeholders: {
        description: 'Enter the area description',
        registration: 'Enter the registration',
        proprietary: 'Select the managing owner',
        activity: 'Select the activity/crop',
        infrastructure: 'Select the infrastructure',
        note: 'Additional notes',
      },
      farmNotFound: {
        title: 'Farm not identified.',
        description: 'Go back to the farms list and try again.',
      },
    },
    mapEditor: {
      mapHint: 'Use the map tools to draw the area polygon.',
      noPerimeter: 'No polygon drawn yet — draw on the map or import a KML file.',
      perimeterDefinedLabel: 'Polygon drawn',
      areaUnit: 'ha',
      importButton: 'Import KML',
      importInProgress: 'Importing...',
      importSuccessToast: 'File imported successfully',
      importErrorToast: 'Error importing KML: check that the file contains a valid polygon.',
      importInvalidExtension: 'Please upload a .kml or .kmz file.',
      importMultiplePolygonsToast:
        'The file contains more than one polygon — only the first was used.',
      overlapWarningTitle: 'Area overlap',
      overlapWarningDescription:
        'This polygon overlaps another area already registered in this farm. Adjust the drawing before continuing.',
      iconOutsideAreaWarning: 'The icon must stay inside the drawn area.',
    },
    multiple: {
      title: 'Add multiple areas',
      subtitle: 'Import one or more KML files to create several areas at once.',
      importButton: 'Import KMLs',
      importInProgress: 'Importing files...',
      emptyState: {
        title: 'No file imported yet.',
        description: 'Import one or more .kml/.kmz files to generate the area cards.',
      },
      importFileErrorToast: 'Could not import the file: check that it contains a valid polygon.',
      importInvalidExtension: 'Please upload only .kml or .kmz files.',
      cardLabelPrefix: 'Area',
      cardRemoveLabel: 'Remove area',
      submitButton: 'Save areas',
      validationErrorToast: 'Fix the highlighted fields in the cards before saving.',
      emptySubmitToast: 'Import at least one KML file before saving.',
      createdSuccessToast: 'Areas created successfully!',
    },
    detail: {
      mapAriaLabel: 'Area map',
      sections: {
        map: 'Map location',
        details: 'Area details',
      },
      fields: {
        farm: 'Farm',
        farmTotalArea: 'Farm area',
        manager: 'Manager',
        city: 'City',
        description: 'Description',
        active: 'Active',
        totalArea: 'Area (ha)',
        infrastructure: 'Infrastructure',
        note: 'Note',
      },
      notFound: {
        title: 'Area not found.',
        description: 'Go back to the farms list and try again.',
        back: 'Go back',
      },
      actions: {
        edit: 'Edit',
      },
    },
  },
};
