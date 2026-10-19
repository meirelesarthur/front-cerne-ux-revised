// src/constants/languages/languageEnUs/languageBirthAnimals.ts
// EN-US translation of the Births module (Operational > Livestock).
// Namespace `birthAnimals` — free (frontend-contract-nascimentos.md §1).

import { ModuleBirthAnimals } from '@/@types/language/module-birth-animals';

export const languageBirthAnimals: ModuleBirthAnimals = {
  birthAnimal: {
    singularLabel: 'Birth',
    pluralLabel: 'Births',
    list: {
      pageTitle: 'Births',
      pageSubtitle: 'Manage the farm births (calves).',
      deletedToast: 'Birth deleted successfully.',
      table: {
        code: 'Code',
        mother: 'Mother',
        fatherText: 'Father ID/Semen',
        newborn: 'Calf',
        breed: 'Breed',
        weight: 'Weight',
        date: 'Date',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
        editDisabledTooltip: 'This birth already has a linked weaning and cannot be edited.',
        deleteDisabledTooltip: 'This birth already has a linked weaning and cannot be deleted.',
      },
      emptyState: {
        titleEmpty: 'No births registered.',
        descriptionEmpty: 'Start by adding the first birth.',
        titleFiltered: 'No records found.',
        descriptionFiltered: 'Try adjusting the filters.',
      },
      error: {
        message: 'Could not load the data.',
        retry: 'Try again',
      },
    },
    filter: {
      title: 'Filter births',
      identification: 'Identification (mother or calf)',
      breed: 'Breed',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    deleteDialog: {
      title: 'Confirm deletion',
      descriptionTemplate:
        'Birth {code} will be permanently deleted. This action cannot be undone.',
    },
    banners: {
      weaningLocked:
        'This birth already has a linked weaning — editing and deletion are unavailable on this screen.',
    },
    detail: {
      pageTitleTemplate: 'Birth {code}',
      notFound: {
        title: 'Birth not found.',
        description: 'The requested birth does not exist or was removed.',
        back: 'Back to list',
      },
      sections: {
        header: 'Header',
        identifications: 'Identifications',
      },
      fields: {
        code: 'Code',
        date: 'Date',
        mother: 'Mother',
        fatherText: 'Father ID/Semen',
        fatherAnimal: 'Father (resolved)',
        newborn: 'Calf',
        breed: 'Breed',
        category: 'Category',
        specie: 'Species',
        birthNote: 'Birth Note',
        batch: 'Batch',
        transferBatch: 'Batch (transfer)',
        weight: 'Weight',
        furDescription: 'Coat',
        note: 'Note',
        photo: 'Photo',
      },
      identificationsTable: {
        type: 'Identification Type',
        identification: 'Identification',
        empty: 'No identifications registered.',
      },
      backButton: 'Back',
    },
    form: {
      title: {
        create: 'New Birth',
        edit: 'Edit Birth',
      },
      fields: {
        code: 'Code',
        date: 'Date',
        specie: 'Species',
        category: 'Category',
        breed: 'Breed',
        birthNote: 'Birth Note',
        weight: 'Weight',
        mother: 'Mother',
        fatherText: 'Father/Semen',
        batch: 'Batch (mother filter)',
        transferBatch: 'Batch (transfer)',
        furDescription: 'Coat',
        note: 'Note',
        photo: 'Photo',
      },
      placeholders: {
        specie: 'Select the species',
        category: 'Select the category',
        breed: 'Select the breed',
        birthNote: 'Select the birth note',
        mother: 'Search the mother by identification',
        fatherText: 'Enter the father or semen identification',
        batch: 'Select the batch',
        transferBatch: 'Select the transfer batch',
      },
      hints: {
        codeGeneratedOnSave: 'Generated on save',
        specieRequired: 'Select the species first',
      },
      image: {
        dropzoneTitle: 'Drag a photo or click to select',
        dropzoneDragging: 'Drop the photo here',
        changeLabel: 'Change photo',
        removeLabel: 'Remove',
        errorType: 'Unsupported file format.',
        errorSize: 'File larger than the allowed limit.',
      },
      identifications: {
        sectionTitle: 'Calf identifications',
        sectionHint: 'Add at least one identification for the calf.',
        emptyTitle: 'No identification added.',
        addRowLabel: 'Add identification',
        removeRowLabel: 'Remove identification',
        typeLabel: 'Identification Type',
        typePlaceholder: 'Select the type',
        valueLabel: 'Identification',
        valuePlaceholder: 'Enter the identification',
        duplicateWarningTitle: 'Identification already registered',
        duplicateWarningDescription:
          'The identification "{{identification}}" is already in use by another record.',
      },
      batchDateWarning: {
        title: 'Date consistency warning',
      },
    },
    excel: {
      headerButtonLabel: 'Import/Export',
      downloadTemplate: 'Download template',
      downloadTemplateError: 'Could not download the template.',
      import: {
        title: 'Import Births',
        subtitle: 'Import births in bulk from an .xlsx spreadsheet.',
        instructions: 'Download the template, fill in the birth data and upload the file below.',
        downloadShortcut: 'Download template',
        warning: {
          title: 'Before you import',
          description:
            'If any row in the spreadsheet is invalid, no birth will be imported — fix the reported errors and upload again.',
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
          title: 'Could not import the spreadsheet',
        },
        result: {
          created: 'Births imported',
        },
        importSuccessToast: 'Births imported successfully.',
        noPermission: 'You do not have permission to import births.',
        cancelButton: 'Cancel',
        submitButton: 'Import',
        closeButton: 'Close',
      },
    },
  },
};
