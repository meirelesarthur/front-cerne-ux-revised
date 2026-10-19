// src/constants/languages/languageEnUs/languagePastures.ts
// English translation of the OPERATIONAL module — Pasture — own domain,
// TASK-PAST-FE-00..08 (execução 041).

import { ModulePastures } from '@/@types/language/module-pastures';

export const languagePastures: ModulePastures = {
  pasture: {
    singularLabel: 'Pasture',
    pluralLabel: 'Pastures',
    list: {
      pageTitle: 'Pastures',
      pageSubtitle: 'Pasture costing entries by area/batch/activity.',
      deletedToast: 'Pasture removed successfully',
      statusLegend: {
        opened: 'Open',
        finished: 'Finished',
        appropriated: 'Appropriated',
      },
      table: {
        status: 'Status',
        code: 'Code',
        date: 'Date',
        requester: 'Requester',
        warehouse: 'Warehouse',
        createdAt: 'Created At',
      },
      actions: {
        view: 'View',
        edit: 'Finish/Edit',
        appropriate: 'Appropriate',
        delete: 'Delete',
        helpVideo: 'Help (video)',
        helpVideoComingSoon: 'Available soon',
      },
      filter: {
        title: 'Filter pastures',
        requester: 'Requester',
        requesterPlaceholder: 'Search requester',
        startDate: 'Start date',
        endDate: 'End date',
      },
      emptyState: {
        title: 'No pastures registered.',
        description: 'Start by adding your first pasture.',
        titleFiltered: 'No pastures found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add New',
      },
    },
    form: {
      title: {
        create: 'New Pasture',
        edit: 'Edit Pasture',
      },
      subtitle: {
        create: 'Register a new pasture.',
        edit: 'Update the pasture data.',
      },
      fields: {
        code: 'Code',
        date: 'Date',
        requester: 'Requester',
        operation: 'Operation',
        activity: 'Activity',
        area: 'Area',
        grazing: 'Grazing Module',
        batch: 'Batch',
        animal: 'Animal',
        inputsWarehouse: 'Inputs Warehouse',
        productionsWarehouse: 'Production Warehouse',
      },
      placeholders: {
        requester: 'Search requester',
        operation: 'Search operation',
        activity: 'Search activity',
        area: 'Search area',
        grazing: 'Search grazing module',
        batch: 'Search batch',
        animal: 'Search animal',
        inputsWarehouse: 'Search warehouse',
        productionsWarehouse: 'Search warehouse',
      },
      tabs: {
        general: 'General',
        equipments: 'Equipment',
        services: 'Labor/Services',
        inputs: 'Products/Inputs',
        occurrences: 'Occurrences',
        productions: 'Production',
      },
      addItem: '+ Add Item',
      removeItem: 'Remove item',
      emptyRow: 'No item added.',
      errors: {
        invalidFields: 'There are invalid fields in the form. Review the tabs.',
        areaOrGrazingRequired: 'Provide Area or Grazing Module (exclusive).',
        checkDateUnavailable:
          'Automatic date validation unavailable in this release (GAP-PAST-FE-01).',
        occurrenceRecommendationRequired:
          'Fill in the Recommendation to save the occurrence (image/diagnosis are not saved without a recommendation).',
      },
      equipments: {
        fields: {
          equipment: 'Equipment',
          measurement: 'Unit',
          startHourMeter: 'Start Hour Meter',
          endHourMeter: 'End Hour Meter',
          note: 'Note',
        },
        placeholders: {
          equipment: 'Search equipment',
          measurement: 'Search unit',
        },
        readonlyHint: 'Field locked while editing.',
      },
      services: {
        fields: {
          funcType: 'Type',
          executor: 'Executor',
          measurement: 'Unit',
          quantity: 'Quantity',
          totalQuantity: 'Total Qty',
        },
        placeholders: {
          funcType: 'Select the type',
          executor: 'Search executor',
          measurement: 'Search unit',
        },
        funcTypeOptions: {
          employee: 'Employee',
          function: 'Function',
          provider: 'Service Provider',
        },
        readonlyHint: 'Field locked while editing.',
      },
      inputs: {
        fields: {
          stock: 'Product (Stock)',
          measurement: 'Unit',
          quantity: 'Quantity',
          quantityUnitary: 'Unit Qty',
          totalQuantity: 'Total Qty',
        },
        placeholders: {
          stock: 'Search product',
          measurement: 'Search unit',
        },
        readonlyHint: 'Field locked while editing.',
        stockWarningInsufficient: 'Insufficient stock for the informed quantity.',
        stockWarningBelowMinimum: 'Stock below the recommended minimum.',
      },
      productions: {
        fields: {
          product: 'Product',
          measurement: 'Unit',
          stock: 'Stock',
          quantity: 'Quantity',
          note: 'Note',
        },
        placeholders: {
          product: 'Search product',
          measurement: 'Search unit',
        },
        readonlyHint: 'Field locked while editing.',
        newProductButton: '+ New Product',
      },
      occurrences: {
        fields: {
          diagnosis: 'Diagnosis',
          recommendation: 'Recommendations',
          priority: 'Priority',
        },
        placeholders: {
          diagnosis: 'Describe the diagnosis',
          recommendation: 'Describe the recommendations',
        },
        priorityOptions: {
          low: 'Low',
          medium: 'Medium',
          high: 'High',
        },
        images: {
          title: 'Images',
          addButton: 'Add image',
          changeButton: 'Change',
          removeButton: 'Remove',
          maxHint: 'Up to 3 images',
        },
      },
    },
    show: {
      title: 'Pasture Detail',
      tabs: {
        services: 'Labor/Services',
        equipments: 'Equipment',
        inputs: 'Inputs',
        productions: 'Production',
        occurrences: 'Occurrences',
      },
      emptySection: 'No item recorded in this tab.',
      backAction: 'Back',
      notFound: {
        title: 'Pasture not found.',
        description: 'Check the accessed link or go back to the list.',
        back: 'Back to list',
      },
    },
    appropriation: {
      title: 'Pasture Appropriation',
      subtitle: 'Set the cost center and class of each recorded item.',
      headerTitle: 'Pasture Data',
      itemsEmptyHint: 'No costs recorded — the pasture was appropriated automatically.',
      fields: {
        costCenter: 'Cost Center',
        class: 'Class',
        vlTime: 'Value/Hour',
      },
      placeholders: {
        costCenter: 'Select the cost center',
      },
      classOptions: {
        custeio: 'Costing',
        investimento: 'Investment',
      },
      submit: 'Save Appropriation',
      cancel: 'Cancel',
      back: 'Back',
      appropriatedToast: 'Pasture appropriated successfully',
      autoAppropriatedToast: 'Pasture appropriated automatically (no recorded costs)',
    },
  },
};
