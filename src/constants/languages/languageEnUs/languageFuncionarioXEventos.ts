// src/constants/languages/languageEnUs/languageFuncionarioXEventos.ts
// EN-US translation of the "Employee X Events" module (Administrative /
// People Management). `list`/`filter`/`importModal`/`reportButton`
// (TASK-FE-FXE-01) + `matrix` (TASK-FE-FXE-02).

import { ModuleEmployeeEvents } from '@/@types/language/module-employee-events';

export const languageFuncionarioXEventos: ModuleEmployeeEvents = {
  employeeEvent: {
    singularLabel: 'Employee x Event Link',
    pluralLabel: 'Employee x Events',
    addLinkButton: 'Add link',
    addLinkModal: {
      title: 'Add link',
      description: 'Select the employee to manage their event links.',
      employeeLabel: 'Employee',
      employeePlaceholder: 'Search by name or document',
      cancelButton: 'Cancel',
      confirmButton: 'Continue',
    },
    list: {
      pageTitle: 'Employee x Events',
      pageSubtitle: 'Select an employee to manage their payroll event links.',
      table: {
        name: 'Name',
        document: 'Document',
        office: 'Position',
        actions: {
          manageLinks: 'Manage links',
        },
      },
      emptyState: {
        titleEmpty: 'No employees registered.',
        descriptionEmpty: 'Register employees to manage their event links.',
        titleFiltered: 'No employees found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
      },
    },
    filter: {
      title: 'Filter employees',
      search: 'Search',
      searchPlaceholder: 'Search by name or document',
      startDate: 'Registration date (from)',
      endDate: 'Registration date (to)',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
    },
    importModal: {
      menuButtonLabel: 'Import spreadsheet',
      title: 'Import Employee x Events',
      subtitle: 'Download the template, fill it in and upload the spreadsheet to sync the links.',
      downloadShortcut: 'Download template',
      instructions:
        'The spreadsheet has 5 columns: Employee, Event, Value, Method and Enabled. All columns are required in every row.',
      warning: {
        title: 'Sync by employee',
        description:
          'The import syncs the links for each employee present in the spreadsheet — existing links not sent for that employee are removed, the sent ones are created or updated (same rule as the Links Matrix).',
      },
      fileUpload: {
        label: 'Spreadsheet (.xlsx)',
        hint: 'Up to 10MB .xlsx file.',
        dropzoneTitle: 'Drag a file or click to select',
        dropzoneDraggingTitle: 'Drop the file here',
        changeLabel: 'Change file',
        removeLabel: 'Remove file',
        errorTypeMessage: 'File type not accepted. Upload an .xlsx file.',
        errorSizeMessage: 'The file exceeds the maximum allowed size (10MB).',
      },
      rowErrors: {
        title: 'Rows with errors',
      },
      result: {
        employeesProcessedLabel: 'Employees processed',
        rowsProcessedLabel: 'Rows processed',
        createdLabel: 'Created',
        updatedLabel: 'Updated',
        deletedLabel: 'Removed',
      },
      cancelButton: 'Cancel',
      submitButton: 'Import',
      closeButton: 'Close',
      importSuccessToast: 'Links imported successfully',
      downloadTemplateError: 'Could not download the template. Please try again.',
    },
    reportButton: {
      label: 'PDF Report',
      exportError: {
        title: 'Employee x Events',
        description: 'Could not generate the report. Please try again.',
      },
    },
    matrix: {
      title: 'Event Links',
      createTitle: 'New link',
      header: {
        employeeLabel: 'Employee',
        employeeSelectPlaceholder: 'Search by name or document',
        nifLabel: 'Tax ID',
        functionLabel: 'Position',
      },
      backButton: 'Back',
      emptyState: {
        title: 'No links registered.',
        description: "Add an event to start configuring this employee's links.",
      },
      addEventButton: 'Add new',
      addEventPlaceholder: 'Select an event',
      noEventsAvailable: 'No active events registered for this farm.',
      removeRowButton: 'Remove',
      table: {
        event: 'Event',
        condition: 'Condition',
        value: 'Value',
        method: 'Method',
        enabled: 'Enabled',
      },
      saveButton: 'Save',
      cancelButton: 'Cancel',
      saveSuccessToast: 'Links saved successfully',
      saveError: {
        title: 'Event Links',
        description: 'Could not save the links. Please try again.',
      },
      invalidParamsToast: {
        title: 'Invalid parameters',
        description: 'The employee identifier is invalid to display the Links Matrix.',
      },
    },
  },
};
