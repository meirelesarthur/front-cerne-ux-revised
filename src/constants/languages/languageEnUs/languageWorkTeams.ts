// src/constants/languages/languageEnUs/languageWorkTeams.ts
// EN-US translation of the WORK TEAMS module (Administrative / People
// Management). Namespace `workTeams` — GAP-EQ-FE-01 (collision with
// `languageGB.teams`, the SaaS/billing domain). This locale is mandatory:
// the `singularLabel`/`pluralLabel` here feed the `workTeams` query keys
// (src/constants/query-key.ts).

import { ModuleWorkTeams } from '@/@types/language/module-work-teams';

export const languageWorkTeams: ModuleWorkTeams = {
  workTeam: {
    singularLabel: 'Team',
    pluralLabel: 'Teams',
    list: {
      pageTitle: 'Teams',
      pageSubtitle: 'Manage work teams and their members.',
      deletedToast: 'Team removed successfully',
      table: {
        name: 'Name',
        description: 'Description',
        supervisor: 'Supervisor',
        supervisorEmpty: '—',
        status: 'Status',
        statusActive: 'Active',
        statusInactive: 'Inactive',
        createdAt: 'Created At',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No teams registered.',
        descriptionEmpty: 'Start by adding the first team.',
        titleFiltered: 'No records found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add',
      },
      error: {
        message: 'Could not load the data.',
        retry: 'Try again',
      },
    },
    filter: {
      title: 'Filter teams',
      search: 'Search',
      searchPlaceholder: 'Search by name or description',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
    },
    deleteDialog: {
      title: 'Confirm deletion',
      descriptionTemplate: '{name} will be permanently deleted. This action cannot be undone.',
    },
    reportButton: {
      label: 'PDF Report',
      successToast: 'Report downloaded successfully',
      exportError: {
        title: 'Report',
        description: 'Could not generate the report. Please try again.',
      },
    },
    form: {
      title: {
        create: 'New team',
        edit: 'Edit team',
        view: 'View team',
      },
      backButton: 'Back',
      fields: {
        name: 'Name',
        description: 'Description',
        employeeUuid: 'Supervisor',
        isEnabled: 'Active',
      },
      placeholders: {
        name: 'Team name',
        description: 'Team description',
        employeeUuid: 'Select the supervisor',
      },
      validation: {
        nameMaxLength: 'Name must be at most 30 characters.',
        descriptionMaxLength: 'Description must be at most 50 characters.',
        memberRowIncomplete: 'Select the Type and the Member for this row, or remove it.',
      },
      members: {
        sectionTitle: 'Members',
        addButton: 'Add',
        removeRowButton: 'Remove member',
        emptyState: 'No members registered.',
        incompleteRowWarning: 'Fill in all fields before adding new ones.',
        memberPlaceholder: 'Select the member',
        memberPlaceholderNoType: 'Select the type first',
        optionsError: 'Could not load the members.',
        optionsRetry: 'Try again',
        table: {
          type: 'Type',
          member: 'Member',
          active: 'Active',
        },
        typeOptions: {
          employee: 'Employee',
          thirdParty: 'Third party',
        },
      },
      unsavedChanges: {
        title: 'Unsaved changes',
        message: 'You have unsaved changes. Do you want to leave without saving?',
        confirm: 'Leave without saving',
      },
      businessErrorFallback: 'Could not save the team. Please check the informed data.',
    },
  },
};
