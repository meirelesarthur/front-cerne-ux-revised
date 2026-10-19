// src/constants/languages/languageEnUs/languageBatch.ts
// EN-US translation of the ANIMAL BATCHES module (Cadastros Base / Livestock).
// Foundation of the screen regeneration (TASK-FE-1074) — mirror `languageCausaMortePerda`
// + `statusOptions` (BatchStatus enum A/P/I/R, consumed by TASK-FE-1075) +
// `archiveConfirm` (M5) + `importExport` (D1, contract v1.1 §8).

import { ModuleBatches } from '@/@types/language/module-batches';

export const languageBatch: ModuleBatches = {
  batch: {
    singularLabel: 'Animal Batch',
    pluralLabel: 'Animal Batches',
    list: {
      pageTitle: 'Animal Batches',
      pageSubtitle: 'Manage the herd management batches.',
      deletedToast: 'Animal batch deleted successfully',
      table: {
        code: 'Code',
        description: 'Description',
        date: 'Date',
        specie: 'Species',
        categories: 'Categories',
        status: 'Status',
        totalAnimals: 'Total Animals',
      },
      actions: {
        edit: 'Edit animal batch',
        delete: 'Delete animal batch',
        archive: 'Archive animal batch',
      },
      emptyState: {
        titleEmpty: 'No animal batches registered.',
        titleFiltered: 'No results found.',
        titleEmptyNoCreate: 'No animal batches available.',
        descriptionEmpty: 'Start by adding the first animal batch.',
        descriptionFiltered: 'Try adjusting or clearing the current filters.',
        descriptionEmptyNoCreate:
          'There are no animal batches registered yet. Contact the platform administrator.',
        cta: 'New Animal Batch',
      },
      deleteConfirm: {
        title: 'Delete animal batch',
        description: 'Are you sure you want to delete the animal batch',
        warning: 'This deletion is permanent and cannot be undone.',
      },
    },
    statusOptions: {
      active: 'Active',
      pending: 'Pending',
      inactive: 'Inactive',
      archived: 'Archived',
    },
    archiveConfirm: {
      title: 'Archive animal batch',
      description: 'Are you sure you want to archive the animal batch',
      warning: 'An archived batch leaves the listing and cannot be reactivated through the screen.',
      successToast: 'Animal batch archived successfully',
    },
    filter: {
      title: 'Filter Animal Batches',
      description: 'Search by description',
    },
    form: {
      title: {
        create: 'New Animal Batch',
        edit: 'Edit Animal Batch',
      },
      subtitle: {
        create: 'Register a new herd management batch.',
        edit: 'Update the animal batch data.',
      },
      fields: {
        code: 'Code',
        description: 'Description',
        date: 'Date',
        specie: 'Species',
        parameterWeight: 'Weight',
        categories: 'Categories',
        animals: 'Animals',
        animalsCounter: '{count} animal(s) selected',
      },
      placeholders: {
        description: 'E.g.: Rearing batch — pasture 3',
        specie: 'Search by description',
        parameterWeight: 'Search by description',
        categories: 'Search by description',
        animals: 'Search by identification',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
        dateRequired: 'Date is required',
        specieRequired: 'Select a species',
        categoriesRequired: 'Select at least one category',
        categoriesMin: 'Select at least one category',
      },
      warnings: {
        categoriesClearedBySpecieChange:
          'The selected categories and animals were removed because the species was changed.',
        animalsClearedByCategoryRemoval:
          'The animals selected in this category were removed because the category was unselected.',
        animalsClearedByWeightChange:
          'Some selected animals were removed because they no longer belong to the chosen weight range.',
      },
      candidateAnimals: {
        selectAllLabel: 'Select all',
        deselectAllLabel: 'Deselect all',
        totalAnimalsLabel: 'Total Animals',
        emptyLabel: 'No candidate animals found for this category.',
        errorLabel: 'Error loading the candidate animals.',
        retryLabel: 'Try again',
        searchPlaceholder: 'Search by identification',
      },
      footer: {
        totalAnimals: 'Total Batch Animals',
        totalWeight: 'Total Batch Weight (Kg)',
        averageWeight: 'Average Batch Weight (Kg)',
        totalUa: 'Total AU',
        averageUa: 'Average AU',
      },
    },
    importExport: {
      downloadTemplate: 'Download template',
      downloadTemplateError: 'Could not download the template',
      importSpreadsheet: 'Import spreadsheet',
      modalTitle: 'Import Animal Batch',
      modalDescription:
        'Each file imports exactly 1 batch (header + animals). To import several batches, repeat the process with one file per batch.',
      instructions:
        'Fill in the "cabecalho" sheet (Date, Species, Description) and the "animais" sheet (Identification) before submitting.',
      warning: {
        title: 'The batch may be created empty',
        description:
          'If any animal identification is not found (non-existent, already linked to another batch, or from another farm), the batch is still created — just without any animal linked. Always check the message shown after the import.',
      },
      fileUpload: {
        label: 'File (.xlsx)',
        hint: 'Only .xlsx files, up to 10 MB.',
        dropzoneTitle: 'Drag a file or click to select',
        dropzoneDraggingTitle: 'Drop the file here',
        changeLabel: 'Change file',
        removeLabel: 'Remove file',
        errorTypeMessage: 'File type not accepted. Upload a .xlsx file.',
        errorSizeMessage: 'The file exceeds the maximum size of 10 MB.',
      },
      result: {
        successTitle: 'Batch imported successfully',
        partialTitle: 'Batch created without linked animals',
        codeLabel: 'Batch code',
        totalAnimalsLabel: 'Linked animals',
      },
      successToast: 'Animal batch imported successfully',
      errorToast: 'Could not import the animal batch',
      cancelButton: 'Cancel',
      submitButton: 'Import',
      closeButton: 'Close',
    },
    // "Individual Animal Performance" report (F-234, TASK-FE-PA-01,
    // `GET /batch-profitability-report`) — mirror Pregnant Cows `report`.
    report: {
      pageTitle: 'Animal Performance',
      pageSubtitle: 'Generate the individual animal performance report in PDF or Excel.',
      filters: {
        sale: 'Sale',
        batch: 'Batch',
        startDate: 'Start Date',
        endDate: 'End Date',
      },
      fields: {
        reportType: 'Report Type',
      },
      reportTypeOptions: {
        pdf: 'PDF',
        excel: 'Excel',
      },
      submitButton: 'Generate Report',
      successToast: 'Report generated successfully.',
      errorToast: 'Could not generate the report.',
      hint: {
        saleOrPeriodRequired:
          'Select a Sale or fill in the period (Start Date and End Date) to generate the report.',
      },
    },
  },
};
