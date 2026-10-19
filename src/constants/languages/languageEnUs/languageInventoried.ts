// src/constants/languages/languageEnUs/languageInventoried.ts
// English (US) translation of the INVENTARIADO module (Operational →
// Livestock → Inventoried, F-041, execution CORE_WORKSPACE/97-Esteiras/060).
// Mirror of languagePtBr/languageInventoried.ts — same keys, same structure.

import { ModuleInventoried } from '@/@types/language/module-inventoried';

export const languageInventoried: ModuleInventoried = {
  inventoried: {
    singularLabel: 'Inventoried',
    pluralLabel: 'Inventoried',
    list: {
      pageTitle: 'Inventoried',
      pageSubtitle: 'View the animal inventories imported by spreadsheet.',
      table: {
        date: 'Date',
        animalsCount: 'Number of Animals',
        inBatch: 'In Batch',
        outOfBatch: 'Out of Batch',
        missing: 'Missing from Spreadsheet',
        actions: 'Action',
      },
      actions: {
        view: 'View',
        report: 'Report',
        delete: 'Delete',
      },
      emptyState: {
        title: 'No inventory found.',
        description: 'There are no inventories imported for the active farm yet.',
      },
      deletedToast: 'Inventory deleted successfully',
      deleteDialog: {
        description: 'Are you sure you want to delete the inventory',
        warning:
          'This deletion removes the inventory and all animals linked to it. This action cannot be undone.',
      },
      importButtonLabel: 'Import/Export',
    },
    importModal: {
      title: 'Import Inventoried',
      subtitle:
        'Download the template, fill it in and upload the spreadsheet to create a new inventory.',
      downloadShortcut: 'Download',
      instructions:
        'The spreadsheet has 2 columns: Batch and Animal. Each row informs an animal and the batch where it was found during the count. The import creates 1 new inventory — it does not replace or delete any existing inventory.',
      fileUpload: {
        label: 'Spreadsheet (.xls or .xlsx)',
        hint: '.xls or .xlsx file up to 10MB.',
        dropzoneTitle: 'Drag a file or click to select',
        dropzoneDraggingTitle: 'Drop the file here',
        changeLabel: 'Change file',
        removeLabel: 'Remove file',
        errorTypeMessage: 'File type not accepted. Upload a .xls or .xlsx file.',
        errorSizeMessage: 'The file exceeds the maximum allowed size (10MB).',
      },
      rowErrors: {
        title: 'Rows with error',
      },
      result: {
        title: 'Inventory created successfully',
        animalsCountLabel: 'Number of Animals',
        inBatchLabel: 'In Batch',
        outOfBatchLabel: 'Out of Batch',
        missingLabel: 'Missing from Spreadsheet',
      },
      cancelButton: 'Cancel',
      submitButton: 'Import',
      closeButton: 'Close',
      successToast: 'Inventory imported successfully',
      downloadTemplateError: 'Could not download the template. Please try again.',
    },
    detail: {
      pageTitle: 'Inventoried',
      back: 'Back',
      header: {
        date: 'Date',
        responsible: 'Responsible',
      },
      animals: {
        title: 'Animals',
        batch: 'Batch',
        animal: 'Animal',
        status: 'Status',
        noBatch: 'None',
      },
      statusLabels: {
        inBatch: 'In Batch',
        outOfBatch: 'Out of Batch',
        missing: 'Missing from Spreadsheet',
      },
      notFound: {
        title: 'Inventory not found.',
        description: 'There is no inventory for the given identifier.',
      },
      noData: '—',
    },
    report: {
      popupBlocked: 'Could not open the report. Check your browser pop-up blocker.',
      error: 'Could not generate the report. Please try again.',
    },
  },
};
