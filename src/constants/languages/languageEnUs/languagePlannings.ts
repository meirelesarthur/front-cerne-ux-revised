// src/constants/languages/languageEnUs/languagePlannings.ts
// EN-US translation of the OPERATIONAL/Agriculture module — Plannings
// (Planning) — own domain, TASK-FE-PLAN-01 (pipeline `97-Esteiras/007`,
// LISTING slice).

import { ModulePlannings } from '@/@types/language/module-plannings';

export const languagePlannings: ModulePlannings = {
  planning: {
    singularLabel: 'Planning',
    pluralLabel: 'Plannings',
    list: {
      pageTitle: 'Plannings',
      pageSubtitle: 'Crop/Variety planning per harvest.',
      deletedToast: 'Planning deleted successfully',
      duplicatedToast: 'Planning duplicated successfully',
      reportErrorToast: 'Could not generate the planning report.',
      statusLabels: {
        pending: 'Pending',
        released: 'Released',
        closed: 'Closed',
      },
      table: {
        status: 'Status',
        code: 'Code',
        harvest: 'Harvest',
        responsible: 'Responsible',
        planningTotal: 'Planned Amount',
        planningArea: 'Amount/area',
      },
      actions: {
        edit: 'Edit',
        duplicate: 'Duplicate',
        print: 'Print',
        delete: 'Delete',
      },
      deleteConfirm: {
        header: 'Delete Planning',
        body: 'Are you sure you want to delete this planning? This action cannot be undone.',
      },
      emptyState: {
        title: 'No plannings registered.',
        description: 'Start by creating your first planning.',
        cta: 'New Planning',
      },
    },
    form: {
      title: {
        create: 'New Planning',
        edit: 'Edit Planning',
      },
      subtitle: {
        create: 'Crop/Variety planning per harvest.',
        edit: 'Crop/Variety planning per harvest.',
      },
      fields: {
        code: 'Code',
        codeGeneratedPlaceholder: 'Generated automatically on save',
        responsible: 'Responsible',
        harvest: 'Harvest',
        createdAt: 'Created on',
        area: 'Area',
        areaTotal: 'Total Area (ha)',
        plantedArea: 'Planted Area (ha)',
        availableArea: 'Available Area (ha)',
        status: 'Status',
        commercialDollar: 'Dollar Rate (US$)',
        realSc: 'R$/bag',
        planningTotal: 'Planned Amount',
        planningArea: 'Amount/area',
      },
      placeholders: {
        harvest: 'Select the harvest',
        area: 'Select the area',
        status: 'Select the status',
      },
      errors: {
        required: 'Required field',
      },
      unsavedChangesDialog: {
        title: 'Leave without saving?',
        description: 'There are unsaved changes in this form that will be lost',
        confirmButton: 'Leave without saving',
      },
    },
    tree: {
      title: 'Crop/Variety',
      empty: {
        title: 'No crops registered yet.',
        description: 'Add a Crop/Variety to start building the planning tree.',
      },
      error: {
        title: 'Could not load the tree.',
        description: 'An error occurred while fetching this planning crops.',
      },
      cultivation: {
        singularLabel: 'Crop/Variety',
        actions: {
          new: 'New Crop/Variety',
          edit: 'Edit',
          delete: 'Delete',
        },
        deletedToast: 'Crop/variety deleted successfully',
        deleteConfirm: {
          header: 'Delete Crop/Variety',
          body: 'Are you sure you want to delete this crop/variety? Its linked operations will also be removed.',
        },
        dialog: {
          title: {
            create: 'New Crop/Variety',
            edit: 'Edit Crop/Variety',
          },
          fields: {
            cultivation: 'Crop',
            variety: 'Variety',
            startDate: 'Start date',
            endDate: 'End date',
            startPlantingDate: 'Planting start date',
            cycle: 'Cycle (days)',
            forecast: 'Harvest forecast',
          },
          placeholders: {
            cultivation: 'Select the crop',
            variety: 'Select the variety',
            varietyNoCultivation: 'Select the crop first',
          },
          errors: {
            required: 'Required field',
          },
          createdToast: 'Crop/variety created successfully',
          updatedToast: 'Crop/variety updated successfully',
        },
      },
      operation: {
        singularLabel: 'Operation',
        actions: {
          new: 'New Operation',
          definePeriod: 'Set Period',
          delete: 'Delete',
        },
        deletedToast: 'Operation deleted successfully',
        empty: {
          title: 'No operations registered yet.',
          description: 'Create an operation manually to get started.',
        },
        deleteConfirm: {
          header: 'Delete Operation',
          body: 'Are you sure you want to delete this operation? This action cannot be undone.',
        },
        dialog: {
          title: {
            create: 'New Operation',
            definePeriod: 'Set Period',
          },
          fields: {
            operation: 'Operation',
            startDate: 'Start date',
            endDate: 'End date',
          },
          placeholders: {
            operation: 'Select the operation',
          },
          errors: {
            required: 'Required field',
          },
          actions: {
            definePeriodSubmit: 'Save period',
          },
          createdToast: 'Operation created successfully',
          updatedToast: 'Operation period updated successfully',
        },
      },
      production: {
        singularLabel: 'Production',
        rowLabel: '1. Production',
        actions: {
          edit: 'Set Production',
        },
        dialog: {
          title: 'Set Production',
          fields: {
            cultivation: 'Crop/Variety',
            productionQuantity: 'Production quantity (per ha)',
          },
          errors: {
            required: 'Required field',
          },
          updatedToast: 'Production updated successfully',
        },
      },
      activity: {
        singularLabel: 'Activity',
        actions: {
          new: 'New Activity',
          edit: 'Edit',
          delete: 'Delete',
        },
        deletedToast: 'Activity removed successfully',
        empty: {
          title: 'No activities registered yet.',
          description: 'Add an activity to get started.',
        },
        deleteConfirm: {
          header: 'Delete Activity',
          body: 'Are you sure you want to delete this activity? This action cannot be undone.',
        },
        dialog: {
          title: {
            create: 'New Activity',
            edit: 'Edit Activity',
          },
          fields: {
            activity: 'Activity',
            startDate: 'Start date',
            endDate: 'End date',
          },
          placeholders: {
            activity: 'Select the activity',
          },
          errors: {
            required: 'Required field',
          },
          createdToast: 'Activity created successfully',
          updatedToast: 'Activity updated successfully',
        },
      },
      otherActivity: {
        singularLabel: 'Other Activity',
        actions: {
          new: 'Add Activity',
          delete: 'Delete',
        },
        deletedToast: 'Activity removed successfully',
        empty: {
          title: 'No other activities registered yet.',
          description: 'Add an activity to the "Other" group of this crop.',
        },
        deleteConfirm: {
          header: 'Delete Activity',
          body: 'Are you sure you want to delete this activity from the "Other" group? This action cannot be undone.',
        },
        dialog: {
          title: 'Add Activity',
          fields: {
            activity: 'Activity',
            quantity: 'Qty/ha',
            amount: 'Unit value ($)',
            total: 'Total value ($)',
          },
          placeholders: {
            activity: 'Select the activity',
          },
          errors: {
            required: 'Required field',
          },
          totalHelperText:
            'Calculated automatically (Qty/ha × Unit value × Planted Area). The server always recalculates the final value.',
          createdToast: 'Activity added successfully',
        },
      },
      product: {
        singularLabel: 'Input',
        actions: {
          new: 'New Input',
          edit: 'Edit',
          delete: 'Delete',
        },
        deletedToast: 'Input removed successfully',
        empty: {
          title: 'No inputs registered yet.',
          description: 'Add an input to get started.',
        },
        deleteConfirm: {
          header: 'Delete Input',
          body: 'Are you sure you want to delete this input? This action cannot be undone.',
        },
        dialog: {
          title: {
            create: 'New Input',
            edit: 'Edit Input',
          },
          fields: {
            warehouse: 'Warehouse',
            product: 'Product',
            measurement: 'Unit',
            stock: 'Stock',
            quantity: 'Qty/ha',
            amount: 'Unit value ($)',
            total: 'Total value ($)',
          },
          placeholders: {
            warehouse: 'Select the warehouse',
            product: 'Select the product',
          },
          errors: {
            required: 'Required field',
          },
          stockHelperText: 'Available balance in the selected warehouse — informational only.',
          totalHelperText:
            'Calculated automatically (Qty/ha × Unit value × Planted Area). The server always recalculates the final value.',
          createdToast: 'Input added successfully',
          updatedToast: 'Input updated successfully',
        },
      },
      equipment: {
        singularLabel: 'Equipment',
        actions: {
          new: 'New Equipment',
          edit: 'Edit',
          delete: 'Delete',
        },
        deletedToast: 'Equipment removed successfully',
        empty: {
          title: 'No equipment registered yet.',
          description: 'Add equipment to get started.',
        },
        deleteConfirm: {
          header: 'Delete Equipment',
          body: 'Are you sure you want to delete this equipment? This action cannot be undone.',
        },
        dialog: {
          title: {
            create: 'New Equipment',
            edit: 'Edit Equipment',
          },
          fields: {
            equipment: 'Equipment',
            measurement: 'Unit',
            quantity: 'Qty/ha',
            amount: 'Unit value ($)',
            total: 'Total value ($)',
          },
          placeholders: {
            equipment: 'Select the equipment',
          },
          errors: {
            required: 'Required field',
          },
          totalHelperText:
            'Calculated automatically (Qty/ha × Unit value × Planted Area). The server always recalculates the final value.',
          createdToast: 'Equipment added successfully',
          updatedToast: 'Equipment updated successfully',
        },
      },
      function: {
        singularLabel: 'Labor/Service',
        actions: {
          new: 'New Service',
          edit: 'Edit',
          delete: 'Delete',
        },
        deletedToast: 'Service removed successfully',
        empty: {
          title: 'No services registered yet.',
          description: 'Add a service to get started.',
        },
        deleteConfirm: {
          header: 'Delete Service',
          body: 'Are you sure you want to delete this service? This action cannot be undone.',
        },
        employeeAssignedBadge: 'employee assigned',
        dialog: {
          title: {
            create: 'New Service',
            edit: 'Edit Service',
          },
          fields: {
            executor: 'Function/Executor',
            employee: 'Employee',
            measurement: 'Unit',
            quantity: 'Qty/ha',
            amount: 'Unit value ($)',
            total: 'Total value ($)',
          },
          placeholders: {
            executor: 'Select the function',
            employee: 'Select the employee',
          },
          errors: {
            required: 'Required field',
          },
          totalHelperText:
            'Calculated automatically (Qty/ha × Unit value × Planted Area). The server always recalculates the final value.',
          employeeUnresolvedLabel: 'Selected employee',
          createdToast: 'Service added successfully',
          updatedToast: 'Service updated successfully',
        },
      },
    },
  },
};
