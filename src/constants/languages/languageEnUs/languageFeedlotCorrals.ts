// src/constants/languages/languageEnUs/languageFeedlotCorrals.ts
// EN-US translation of the OPERATIONAL module — Currais standalone screen
// (FeedlotCorral, F-035, lote 043, TASK-043-CUR-T01 — foundation). Mirror
// `languageFeedlotSectors`. `singularLabel`/`pluralLabel` also feed the
// CANONICAL query-key (derived from translation, in English) — see
// `src/constants/query-key.ts`.

import { ModuleFeedlotCorrals } from '@/@types/language/module-feedlot-corrals';

export const languageFeedlotCorrals: ModuleFeedlotCorrals = {
  feedlotCorral: {
    singularLabel: 'FeedlotCorral',
    pluralLabel: 'FeedlotCorrals',
    list: {
      pageTitle: 'Feedlot Corrals',
      pageSubtitle: 'Feedlot corrals registry.',
      deletedToast: 'Feedlot corral deleted successfully',
      table: {
        identification: 'Identification',
        name: 'Name',
        feedlotSector: 'Feedlot Sector',
        installationType: 'Installation',
        areaTotal: 'Total Area',
        floor: 'Floor',
        shading: 'Shading',
        trough: 'Trough',
        drinkingFountain: 'Drinking Fountain',
        status: 'Status',
        capacity: 'Capacity',
        animalsCount: 'Animals',
        createdAt: 'Created at',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        changeStatus: 'Change Status',
        history: 'History',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No feedlot corral registered.',
        descriptionEmpty: 'Start by adding your first feedlot corral.',
        titleEmptyNoCreate: 'No feedlot corral registered.',
        descriptionEmptyNoCreate: 'You do not have permission to create a new feedlot corral.',
        titleFiltered: 'No feedlot corral found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Feedlot Corral',
      },
      changeStatusDetachConfirm: {
        title: 'Remove batches from feedlot corral',
        description:
          'This feedlot corral is occupied with {count} animal(s) linked to batch(es). Changing the status will detach the batches and clear their dates/diet. Do you want to continue?',
      },
    },
    filter: {
      title: 'Filter feedlot corrals',
      name: 'Name',
      namePlaceholder: 'Search by name',
      feedlotSector: 'Feedlot Sector',
      feedlotSectorPlaceholder: 'Search by feedlot sector',
      status: 'Status',
      statusAll: 'All',
    },
    detail: {
      generalData: { title: 'General Data' },
      fields: {
        identification: 'Identification',
        name: 'Name',
        feedlotSector: 'Feedlot Sector',
        installationType: 'Installation',
        status: 'Status',
        width: 'Width',
        length: 'Length',
        areaTotal: 'Total Area',
        capacity: 'Capacity',
        coverage: 'Coverage',
        floor: 'Floor',
        shading: 'Shading',
        trough: 'Trough',
        drinkingFountain: 'Drinking Fountain',
        createdAt: 'Created at',
        updatedAt: 'Updated at',
      },
      actions: { edit: 'Edit' },
      notFound: {
        title: 'Feedlot corral not found.',
        description: 'The feedlot corral you are looking for does not exist or was removed.',
        back: 'Back to the list',
      },
    },
    history: {
      table: {
        corral: 'Feedlot Corral',
        beforeStatus: 'Previous Status',
        afterStatus: 'New Status',
        note: 'Note',
        createdAt: 'Date/Time',
        user: 'User',
      },
      emptyState: {
        title: 'No history recorded.',
        description: 'There are no status changes recorded for this feedlot corral yet.',
      },
      error: {
        message: 'Could not load this feedlot corral history.',
        retry: 'Try again',
      },
    },
    form: {
      title: { create: 'New Feedlot Corral', edit: 'Edit Feedlot Corral' },
      fields: { feedlotSector: 'Feedlot Sector' },
      placeholders: { feedlotSector: 'Select the feedlot sector' },
      hints: { identificationGenerated: 'Automatically generated' },
      validation: { feedlotSectorRequired: 'Feedlot sector is required.' },
    },
    wizard: {
      step1: 'Identification and Status',
      step2: 'Dimensions and Structure',
      step3: 'Batches',
      stepErrors: 'Fill in the required fields of this step before continuing.',
      submit: {
        situationPermissionDenied:
          'You do not have permission to update this feedlot corral status (requires Feedlot Map or Feedlot Corrals access).',
        partialSaveTitle: 'Feedlot corral partially saved',
        partialSaveBatchesDescription:
          'The feedlot corral was saved, but the batches were not linked. Open the record again to try again.',
        partialSaveSituationDescription:
          'The feedlot corral was saved, but the status was not updated. Open the record again to try again.',
      },
      lots: {
        heading: 'Feedlot Corral Batches',
        description: 'Link the batches that will occupy this feedlot corral.',
        blockedHeading: 'Batches locked',
        blockedDescription:
          'The current feedlot corral status does not allow adding or changing batches in this step.',
        statusBlockedTooltip: 'Unavailable for the current feedlot corral status.',
        addBlockedTitle: 'Select a batch',
        addBlockedDescription: 'Select the batch of the current row before adding another one.',
        removeConfirmTitle: 'Remove batch',
        removeConfirmDescription: 'Are you sure you want to remove this batch row',
        summaryCount: 'Batches selected: {count}',
        summaryTotalAnimals: 'Animals linked: {total}',
        batchModal: {
          titleCreate: 'New Batch',
          titleEdit: 'Edit Batch',
          fields: {
            date: 'Date',
            parameterWeight: 'Weight',
            specie: 'Specie',
            categories: 'Categories',
            description: 'Description',
          },
          cancelButton: 'Cancel',
          submitButton: 'Save',
          createdToast: 'Batch created successfully',
          updatedToast: 'Batch updated successfully',
        },
      },
    },
    enums: {
      installationType: { cover: 'Covered', uncovered: 'Uncovered' },
      status: {
        available: 'Empty',
        reserved: 'Sanitary Hold',
        occupied: 'Occupied',
        maintenance: 'Maintenance',
        cleaning: 'Cleaning',
        sanitaryHold: 'Infirmary',
        closed: 'Closed',
      },
      coverage: {
        open: 'Open',
        partiallyCovered: 'Partially Covered',
        fullyCovered: 'Fully Covered',
        metalShed: 'Metal Shed',
        insulatedShed: 'Insulated Shed',
        thermoacousticRoof: 'Thermoacoustic Roof',
        fiberCementRoof: 'Fiber Cement Roof',
        clayTileRoof: 'Clay Tile Roof',
        tensionedFabricRoof: 'Tensioned Fabric Roof',
        shadeNet: 'Shade Net',
      },
      floor: {
        compactedDirt: 'Compacted Dirt',
        concreteFloor: 'Concrete',
        groovedConcrete: 'Grooved Concrete',
        gravelFloor: 'Gravel',
        stoneFloor: 'Stone',
        sandFloor: 'Sand',
        rubberFlooring: 'Rubber Flooring',
        deepBedding: 'Deep Bedding',
        slattedFloor: 'Slatted Floor',
      },
      shading: { natural: 'Natural', artificial: 'Artificial', none: 'None' },
    },
  },
};
