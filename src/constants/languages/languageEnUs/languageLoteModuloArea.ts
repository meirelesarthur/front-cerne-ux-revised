// src/constants/languages/languageEnUs/languageLoteModuloArea.ts
// EN-US translation of the "Lote/Módulo/Área" module (BatchModuleAreaTransfer —
// Operacional > Pecuária > Transferências, 97-Esteiras/070).

import { ModuleLoteModuloArea } from '@/@types/language/module-lote-modulo-area';

export const languageLoteModuloArea: ModuleLoteModuloArea = {
  loteModuloArea: {
    batchModuleAreaTransfer: {
      singularLabel: 'Batch/Module/Area',
      pluralLabel: 'Batch/Module/Area',
      list: {
        pageTitle: 'Batch/Module/Area',
        table: {
          code: 'Code',
          description: 'Description',
          animalsCount: 'Animals Count',
          currentLink: 'Current Link',
          actions: 'Actions',
          noCurrentLink: '—',
        },
        filter: {
          batch: 'Batch',
          batchPlaceholder: 'Select',
        },
        actions: {
          filter: 'Filter',
          clearFilter: 'Clear filter',
          edit: 'Edit/Transfer',
        },
        error: {
          message: 'Could not load Batch/Module/Area transfers.',
          retry: 'Try again',
        },
        emptyState: {
          titleEmpty: 'No batch found.',
          descriptionEmpty: 'Adjust the filter or wait for new active batches.',
        },
      },
      form: {
        title: 'Transfer Batch',
        fields: {
          code: 'Code',
          date: 'Date',
          user: 'Responsible',
          batch: 'Batch',
          qtd: 'Animals Count',
          area: 'Current Link',
          areaDestination: 'Area',
          grazingDestination: 'Module',
          corralDestination: 'Corral',
        },
        saveButton: 'Save',
        cancelButton: 'Cancel',
        successToast: 'Transfer completed successfully',
        validation: {
          destinationRequired: 'Select a destination Area, Module or Corral',
        },
        error: {
          message: 'Could not load this transfer data.',
        },
      },
      cascade: {
        dateInvalidForArea: 'Invalid date for the selected Area.',
        dateInvalidForGrazing: 'Invalid date for the selected Module.',
        dateInvalidForCorral: 'Invalid date for the selected Corral.',
        dateInvalidGeneric: 'Invalid date for this transfer.',
      },
    },
  },
};
