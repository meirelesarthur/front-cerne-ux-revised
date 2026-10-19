// src/constants/languages/languageEnUs/languageMarkers.ts
// EN-US translation of the MARKERS module (Base Registrations).

import { ModuleMarkers } from '@/@types/language/module-markers';

export const languageMarkers: ModuleMarkers = {
  marker: {
    singularLabel: 'Marker',
    pluralLabel: 'Markers',
    type: {
      activity: 'Activity',
      infrastructure: 'Infrastructure',
    },
    list: {
      pageTitle: 'Markers',
      pageSubtitle:
        'Manage the marker catalog used on the property map (Activities and Infrastructures).',
      deletedToast: 'Marker removed successfully',
      table: {
        icon: 'Icon',
        description: 'Description',
        type: 'Type',
        active: 'Active',
        activeLabel: 'Active',
        inactiveLabel: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No markers registered.',
        descriptionEmpty: 'Start by adding the first marker.',
        titleFiltered: 'No markers found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Marker',
      },
      error: {
        message: 'Could not load the markers.',
        retry: 'Try again',
      },
    },
    filter: {
      title: 'Filter markers',
      search: 'Search',
      searchPlaceholder: 'Search by description',
      type: 'Type',
      typeAll: 'All',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
    },
    deleteBlocked: {
      title: 'Cannot delete',
      description:
        'There are records linked to this marker. Remove or reassign the links below before deleting',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        areas: 'Linked area(s)',
        sectors: 'Linked sector(s)',
        places: 'Linked place(s)',
        subPlaces: 'Linked sub-place(s)',
        areaInfrastructure: 'Linked area infrastructure',
        sectorInfrastructure: 'Linked sector infrastructure',
        placeInfrastructure: 'Linked place infrastructure',
        subPlaceInfrastructure: 'Linked sub-place infrastructure',
        activityCostCenters: 'Linked activity cost center(s)',
        apportionmentItems: 'Linked activity apportionment item(s)',
      },
    },
    form: {
      title: {
        create: 'New Marker',
        edit: 'Edit Marker',
      },
      subtitle: {
        create: 'Register a new marker for use on the property map.',
        edit: 'Update the marker data.',
      },
      fields: {
        description: 'Description',
        type: 'Type',
        isEnabled: 'Active',
        icon: 'Icon',
        iconNew: 'New icon',
      },
      placeholders: {
        description: 'E.g.: Corral',
      },
      hints: {
        iconAccepted: 'Accepted formats: PNG.',
        iconMaxSize: 'Maximum size: 2 MB.',
      },
      image: {
        dropzoneTitle: 'Drag an image or click to select',
        dropzoneDragging: 'Drop the image here',
        changeLabel: 'Change icon',
        removeLabel: 'Remove icon',
        errorType: 'File type not accepted. Upload a PNG file.',
        errorSize: 'File exceeds the maximum size of 2 MB.',
      },
      validation: {
        descriptionMaxLength: 'Description must be at most 40 characters',
        typeRequired: 'Select the type',
        iconRequired: 'The icon is required',
      },
    },
  },
};
