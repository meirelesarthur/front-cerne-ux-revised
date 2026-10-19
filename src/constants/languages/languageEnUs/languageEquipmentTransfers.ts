// src/constants/languages/languageEnUs/languageEquipmentTransfers.ts
// EN-US translation of the EQUIPMENT TRANSFER module (Fleet Management,
// F-101, 97-Esteiras/005). This is also the source of `queryKey.equipmentTransfers.*`
// (derived from `singularLabel`/`pluralLabel` — never a literal string).

import { ModuleEquipmentTransfers } from '@/@types/language/module-equipment-transfers';

export const languageEquipmentTransfers: ModuleEquipmentTransfers = {
  equipmentTransfer: {
    singularLabel: 'Equipment Transfer',
    pluralLabel: 'Equipment Transfers',
    list: {
      pageTitle: 'Equipment Transfer',
      pageSubtitle: 'Equipment transfers between farms.',
      table: {
        status: 'Status',
        code: 'Code',
        responsible: 'Responsible',
        date: 'Date',
        farmOrigin: 'Origin Farm',
        farmDestination: 'Destination Farm',
        equipments: 'Equipments',
      },
      legend: {
        title: 'Legend',
        open: 'Open',
        finished: 'Finished',
        canceled: 'Canceled',
      },
      actions: {
        view: 'View',
        receive: 'Receive',
        cancel: 'Cancel',
      },
      emptyState: {
        titleEmpty: 'No transfers found.',
        descriptionEmpty: 'Create a new equipment transfer to get started.',
        titleFiltered: 'No results for this filter.',
        descriptionFiltered: 'Adjust the period and try again.',
        titleError: 'Could not load transfers.',
        descriptionError: 'Please try again shortly.',
        retry: 'Try again',
      },
    },
    filter: {
      startDate: 'Start date',
      endDate: 'End date',
    },
    form: {
      createTitle: 'New Equipment Transfer',
      createSubtitle: 'Select the equipments and the destination farm.',
      fields: {
        code: 'Code',
        responsible: 'Responsible',
        date: 'Date',
        farmOrigin: 'Origin Farm',
        farmDestination: 'Destination Farm',
      },
      equipments: {
        sectionTitle: 'Equipments',
        equipment: 'Equipment',
        addItem: 'Add equipment',
        removeItem: 'Remove equipment',
        minOneRequired: 'Select at least one equipment.',
      },
      attachments: {
        sectionTitle: 'Attachments',
        name: 'Name',
        file: 'File',
        addItem: 'Add attachment',
        removeItem: 'Remove attachment',
      },
      unsavedChangesDialog: {
        title: 'Leave without saving?',
        description: 'You have unsaved changes. Are you sure you want to leave without saving?',
        confirmButton: 'Leave without saving',
      },
    },
    receive: {
      pageTitle: 'Receive Transfer',
      pageSubtitle: 'Confirm the equipment receipt data.',
      fields: {
        receiptDate: 'Receipt date',
        employee: 'Responsible employee',
        receiptDateRequired: 'Enter the receipt date.',
        employeeRequired: 'Select the responsible employee.',
      },
      submit: 'Receive',
      successMessage: 'Transfer received successfully.',
    },
    show: {
      pageTitle: 'Transfer Detail',
      receiptBlock: {
        title: 'Receipt',
        receiptDate: 'Receipt date',
        employee: 'Responsible employee',
      },
      equipments: {
        title: 'Equipments',
      },
      attachments: {
        title: 'Attachments',
        viewDocument: 'View Document',
        empty: 'No attachments.',
      },
    },
    cancel: {
      dialogTitle: 'Cancel transfer',
      dialogDescription: 'Are you sure you want to cancel the transfer',
      dialogWarning: 'This action cannot be undone.',
      confirmLabel: 'Cancel transfer',
      successMessage: 'Transfer canceled successfully.',
    },
  },
};
