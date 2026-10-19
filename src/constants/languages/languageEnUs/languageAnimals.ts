// src/constants/languages/languageEnUs/languageAnimals.ts
// English (US) translation of the "Herd" module (Animal — Base Registrations
// / Livestock, execution 027). TASK-FE-880 (infra) + TASK-FE-881 (listing/
// filter).

import { ModuleAnimals } from '@/@types/language/module-animals';

export const languageAnimals: ModuleAnimals = {
  animal: {
    singularLabel: 'Animal',
    pluralLabel: 'Herd',

    typeOptions: {
      single: 'Individual',
      noId: 'No ID',
    },

    reproductiveStatusOptions: {
      pregnant: 'Pregnant',
      empty: 'Empty',
      calved: 'Calved',
    },

    statusOptions: {
      active: 'Active',
      pending: 'Pending',
      death: 'Dead',
      loss: 'Lost',
      sale: 'Sold',
      deleted: 'Deleted',
    },

    originOptions: {
      birth: 'Birth',
      processing: 'Processing',
      registration: 'Registration',
    },

    depreciationTypeOptions: {
      withResidual: 'With Residual Value',
      withoutResidual: 'Without Residual Value',
    },

    list: {
      pageTitle: 'Herd',
      pageSubtitle: 'Manage the animals of the active farm herd.',
      deletedToast: 'Animal deleted successfully',
      table: {
        type: 'Type',
        identificationType: 'Identification Type',
        identificationTypeEmpty: '—',
        identification: 'Identification',
        identificationEmpty: 'No ID',
        category: 'Category',
        batch: 'Batch',
        batchEmpty: 'No batch',
        batchMore: '+{count}',
        weight: 'Current Weight (Kg)',
        status: 'Status',
        reproductiveStatus: 'Reproductive Status',
        reproductiveStatusEmpty: 'N/A',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No animals registered.',
        descriptionEmpty: 'Start by adding the first animal of the herd.',
        titleEmptyNoCreate: 'No animals available.',
        descriptionEmptyNoCreate:
          'There are no animals registered yet. Contact the farm administrator.',
        titleFiltered: 'No animals found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Animal',
      },
      deleteConfirm: {
        title: 'Delete animal',
        description: 'Are you sure you want to delete the animal',
        warning:
          'This action is final and cannot be undone. If there are dependent links, the deletion may be blocked by the system.',
      },
      error: {
        message: 'Unable to load the herd.',
        retry: 'Try again',
      },

      bulkBar: {
        ariaLabel: 'Bulk actions',
        clearSelection: 'Clear selection',
        selectedOne: '{count} animal selected',
        selectedMany: '{count} animals selected',
        reproductiveStatus: 'Reproductive Status',
        batchTransfer: 'Transfer Batch',
        deleteMany: {
          action: 'Delete Animals',
          confirmWord: 'DELETE',
        },
      },
    },

    managementScreen: {
      pageTitle: 'Animal Management',
      pageSubtitle:
        'Manage the herd and bulk actions (batch transfer, reproductive status, deletion) from a dedicated screen.',
    },

    filter: {
      title: 'Filter herd',
      search: 'Search Animal ID',
      searchPlaceholder: 'Search Animal ID',
      category: 'Category',
      categoryAll: 'All',
      batch: 'Batch',
      batchAll: 'All',
      status: 'Status',
      statusAll: 'All',
      origin: 'Origin',
      originAll: 'All',
      reproductiveStatus: 'Reproductive Status',
      reproductiveStatusAll: 'All',
    },

    dialogs: {
      reproductiveStatus: {
        title: 'Bulk Reproductive Status',
        countTemplate: 'Apply to {count} selected animals.',
        pregnancyDate: 'Pregnancy Date',
        birthForecast: 'Expected Calving Date',
        submitButton: 'Apply',
        successMessage: '{count} animal(s) updated successfully.',
      },
      deleteMany: {
        title: 'Delete animals',
        countTemplate: 'You are about to delete {count} animals.',
        warning:
          'The animals will be deleted. Animals with active links (postings, births, weighings, etc.) cannot be deleted and the whole operation is cancelled.',
        confirmLabel: 'Type {word} to confirm',
        submitButton: 'Delete',
        successMessage: '{count} animal(s) deleted successfully.',
        blockedTitle: 'The animals below have active links and prevented the deletion:',
        blockedMore: 'and {count} more animal(s).',
        blockedTruncated: 'The list was limited by the server; other animals may also be blocked.',
        blockedDeselect: 'Deselect blocked',
      },
      batchTransfer: {
        title: 'Transfer Batch',
        countTemplate: '{count} selected animals.',
        sameBatchMode: 'Same batch for all',
        perAnimalMode: 'Different batch per animal',
        batchLabel: 'Destination batch',
        batchPlaceholder: 'Select the batch',
        animalColumnLabel: 'Animal',
        submitButton: 'Transfer',
        successMessage: '{count} animal(s) transferred successfully.',
      },
    },

    excel: {
      downloadTemplate: 'Download template',
      downloadTemplateError: 'Unable to download the template.',
      export: 'Export',
      exportError: 'Unable to export the herd.',
      import: {
        menuLabel: 'Import',
        title: 'Import Herd',
        subtitle: 'Bulk import animals from an .xlsx spreadsheet.',
        instructions: 'Download the template, fill in the herd data and upload the file below.',
        downloadShortcut: 'Download template',
        warning: {
          title: 'Before you import',
          description:
            'If any row in the spreadsheet is invalid, no animal will be imported — fix the reported errors and upload again.',
        },
        fileUpload: {
          label: 'Spreadsheet file',
          hint: '.xlsx format, up to 10MB.',
          dropzoneTitle: 'Drag the spreadsheet or click to select',
          dropzoneDraggingTitle: 'Drop the spreadsheet here',
          changeLabel: 'Change file',
          removeLabel: 'Remove file',
          errorTypeMessage: 'File type not accepted. Upload an .xlsx file.',
          errorSizeMessage: 'File exceeds the maximum allowed size (10MB).',
        },
        rowErrors: {
          title: 'Unable to import the spreadsheet',
        },
        result: {
          created: 'Animals imported',
          childrenCreated: 'Calves created',
        },
        importSuccessToast: 'Herd imported successfully.',
        cancelButton: 'Cancel',
        submitButton: 'Import',
        closeButton: 'Close',
      },
    },

    form: {
      title: {
        create: 'New Animal',
        edit: 'Edit Animal',
      },
      subtitle: {
        create: 'Register a new animal of the active farm herd.',
        edit: 'Change the data of the selected animal.',
      },

      fields: {
        photo: 'Photo',
        type: 'Type',
        quantity: 'Quantity',
        specie: 'Species',
        category: 'Category',
        breed: 'Breed',
        entryDate: 'Entry Date',
        birthDate: 'Birth Date',
        identificationType: 'Identification Type',
        identification: 'Identification',
        weight: 'Weight (Kg)',
        priceKiloAlive: 'Live Weight Price (Kg)',
        furDescription: 'Coat Description',
        note: 'Note',
        startWeight: 'Entry Weight',
        valueUnitary: 'Unit Value',
        unityAnimalUa: 'AU (Animal Unit)',
        priceArrobaAlive: 'Live Weight Price (@)',

        motherAnimal: 'Mother',
        fatherAnimal: 'Father',

        categoryMatrice: 'Reproductive Stage',
        reproductiveStatus: 'Reproductive Status',
        birthForecast: 'Expected Calving Date',

        childCategory: 'Calf Category',
        childBirthDate: 'Calf Birth Date',
        childWeight: 'Calf Weight',
        childIdentificationType: 'Calf Identification Type',
        childIdentification: 'Calf Identification',

        depreciationType: 'Depreciation Type',
        vlAcquisition: 'Acquisition Value',
        residual: 'Residual (%)',
        depreciation: 'Depreciation (%)',
        lifeBens: 'Useful Life (years)',
        vlResidual: 'Residual Value',
        vlDepreciate: 'Value to Depreciate',
        vlDepreciated: 'Depreciated Value',
        sdDepreciate: 'Balance to Depreciate',
      },

      placeholders: {
        type: 'Select the type',
        specie: 'Select the species',
        category: 'Select the category',
        breed: 'Select the breed',
        identificationType: 'Select the type',
        identification: 'Type the identification',
        motherAnimal: "Type the mother's identification",
        fatherAnimal: "Type the father's identification",
        categoryMatrice: 'Select the reproductive stage',
        reproductiveStatus: 'Select the reproductive status',
        childCategory: 'Select the calf category',
        childIdentificationType: 'Select the type',
        depreciationType: 'Select the type',
      },

      hints: {
        specieRequired: 'Select the species to enable Category and Breed.',
        quantityBatch: '{quantity} identical animals will be created, all "No ID".',
        calculatedEmpty: '—',
      },

      identifications: {
        sectionTitle: 'Identification',
        sectionHint: 'Add at least one type/identification for an individual animal.',
        emptyTitle: 'No identification added.',
        addRowLabel: 'Add identification',
        removeRowLabel: 'Remove identification',
        noIdHint:
          '"No ID" animal — the system automatically assigns "No ID" to each created record.',
        duplicateWarningTitle: 'Identification already registered',
        duplicateWarningDescription:
          'Identification "{{identification}}" is already in use by another active animal on this farm. You can still save normally.',
      },

      image: {
        dropzoneTitle: 'Drag an image or click to select',
        dropzoneDragging: 'Drop the image here',
        changeLabel: 'Change photo',
        removeLabel: 'Remove photo',
        errorType: 'File type not accepted.',
        errorSize: 'File exceeds the maximum allowed size.',
      },

      sections: {
        genealogy: 'Genealogy',
        reproductiveStatus: 'Reproductive Stage/Status',
        child: {
          title: 'Calf',
          hint: 'Fill in all fields to register the calf together with the mother.',
          createOnlyHint:
            'Available only when creating the animal — the calf is registered as a new animal linked to the mother.',
        },
        depreciation: 'Depreciation',
      },
    },
  },
};
