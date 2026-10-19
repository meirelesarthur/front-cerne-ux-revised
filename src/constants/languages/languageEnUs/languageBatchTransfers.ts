// src/constants/languages/languageEnUs/languageBatchTransfers.ts
// English translation of the BATCH ANIMAL TRANSFER module (Operational >
// Livestock > Transfers, feature `426be835`). Namespace `batchTransfers` —
// FREE, no collision with `batches` (Batch registration module).

import { ModuleBatchTransfers } from '@/@types/language/module-batch-transfers';

export const languageBatchTransfers: ModuleBatchTransfers = {
  batchTransfer: {
    singularLabel: 'Batch Transfer',
    pluralLabel: 'Batch Transfers',
    list: {
      pageTitle: 'Animal/Batch Transfer',
      pageSubtitle: 'Active animals eligible for transfer between batches.',
      totalCountLabel: 'Count',
      newTransference: 'New Transfer',
      table: {
        type: 'Type',
        identification: 'Identification',
        age: 'Age',
        category: 'Category',
        batch: 'Batch',
      },
      typeOptions: {
        batch: 'Batch',
        individual: 'Individual',
      },
      emptyState: {
        title: 'No records.',
        description: 'No eligible animals for transfer were found.',
      },
      error: {
        title: 'Unable to load data.',
        retry: 'Try again',
      },
    },
    filter: {
      title: 'Filter eligible animals',
      category: 'Category',
      batch: 'Batch',
      identification: 'Identification',
      identificationHint: 'Search matches the exact code only — partial matches are not found.',
    },
    form: {
      title: { create: 'New Transfer' },
      subtitle: { create: 'Transfer animals from one batch to another.' },
      fields: {
        code: 'Code',
        date: 'Date',
        user: 'Responsible',
        batchFilter: 'Batch',
        category: 'Category',
        minWeight: 'Min. weight',
        maxWeight: 'Max. weight',
        newBatch: 'New Batch',
      },
      placeholders: {
        minWeight: '350.00',
        maxWeight: '520.00',
        batchFilter: 'Select the origin batch',
        category: 'Select the categories',
        newBatch: 'Select the destination batch',
      },
      validation: {
        dateRequired: 'Date is required.',
        newBatchRequired: 'The new batch is required.',
        atLeastOneAnimal: 'Select at least one animal to perform the transfer.',
      },
      warnings: {
        maxWeightLessThanMin: 'The maximum weight must be greater than the minimum.',
        minWeightGreaterThanMax: 'The minimum weight must be less than the maximum.',
        weighingWarning:
          'Some of the selected animals may not have a weighing recorded for the transfer date — if any of them is missing one, the transfer will fail when saving.',
      },
      candidateAnimals: {
        selectAllLabel: 'Select all',
        deselectAllLabel: 'Deselect all',
        totalAnimalsLabel: 'Total Animals',
        emptyLabelBatch: 'The selected batch has no animals!',
        emptyLabelCategory: 'The selected categories have no animals!',
        errorLabel: 'Error loading animals.',
        retryLabel: 'Try again',
        searchPlaceholder: 'Search by identification',
      },
      footer: {
        total: 'Total',
        weight: 'Weight',
        averageWeight: 'Average Weight',
        totalUa: 'Total AU',
        averageUa: 'Average AU',
      },
      toasts: {
        success: 'Transfer completed successfully.',
      },
    },
  },
};
