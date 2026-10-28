// src/constants/languages/languageEnUs/languageUsers.ts
// EN-US translation of the USERS module (User — administrative CRUD).

import { ModuleUsers } from '@/@types/language/module-users';

export const languageUsers: ModuleUsers = {
  user: {
    singularLabel: 'User',
    pluralLabel: 'Users',
    list: {
      pageTitle: 'Users',
      pageSubtitle: 'Manage system access accounts and their links.',
      table: {
        name: 'Name',
        email: 'Email',
        role: 'Role',
        roleMore: '+{count}',
        status: 'Status',
        statusActive: 'Active',
        statusInactive: 'Inactive',
        lastActivity: 'Last activity',
        photo: 'Photo',
      },
      actions: {
        edit: 'Edit',
        view: 'View',
      },
      emptyState: {
        titleEmpty: 'No users registered.',
        descriptionEmpty: 'Start by adding the first user.',
        titleFiltered: 'No users found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New User',
      },
      error: {
        message: 'Could not load the users.',
        retry: 'Try again',
      },
    },
    filter: {
      title: 'Filter users',
      search: 'Search',
      searchPlaceholder: 'Search by name, email or NIF',
      role: 'Role',
      roleAll: 'All',
      isActive: 'Status',
      isActiveAll: 'All',
      activeOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
      online: 'Online now',
      onlineAll: 'All',
      onlineOptions: {
        online: 'Online',
        offline: 'Offline',
      },
      inactiveDays: 'Inactivity',
      inactiveDaysAll: 'All',
      // FIX (lote 3b, Execução 027 — finding from lote 2): the legacy screen
      // never shows the raw day count, always "More than X" — real source:
      // agro365/resources/views/users/index.blade.php:59-72. The numeric
      // VALUES (1/7/15/30/90/180/365) stay the same, only the label changes.
      inactiveDaysOptions: {
        oneDay: 'More than 1 day',
        oneWeek: 'More than 1 week',
        oneFortnight: 'More than 15 days',
        oneMonth: 'More than 1 month',
        oneQuarter: 'More than 1 quarter',
        oneSemester: 'More than 6 months',
        oneYear: 'More than 1 year',
      },
      tenant: 'Tenant',
      tenantAll: 'All',
      plan: 'Plan',
      planAll: 'All',
      tenantStatus: 'Tenant status',
      tenantStatusAll: 'All',
      // FIX (batch 2, Execution 027): `active` label was fabricated
      // ("Active"). Real source: `App\Enums\TenantStatus::label()`
      // (GB.Cerne.Api/app/Enums/TenantStatus.php) — `ACTIVE => 'Habilitado'`
      // (PT-only backend enum) — translated here as "Enabled" to match the
      // PT canonical meaning (contract distinguishes tenant "enabled" state
      // from a user's own `is_active` boolean).
      tenantStatusOptions: {
        active: 'Enabled',
        defaulting: 'Defaulting',
        suspended: 'Suspended',
        cancelled: 'Cancelled',
      },
    },
    form: {
      title: {
        create: 'New User',
        edit: 'Edit User',
      },
      subtitle: {
        create: 'Register the person and the access account.',
        edit: 'Update the person and the access account data.',
      },
      sectionPerson: 'Identification',
      sectionAccount: 'Account',
      sectionLinks: 'Access',
      sectionLinksHint: 'Roles and scopes granted to the user.',
      fields: {
        nif: 'Tax ID',
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        city: 'City',
        address: 'Address',
        password: 'Password',
        passwordConfirmation: 'Password confirmation',
        isActive: 'Active',
        isPurchasingAssistant: 'Purchasing checker?',
        photo: 'Photo',
        roleUuids: 'User Profile',
        farmUuids: 'Farms',
        bossUuids: 'Bosses',
      },
      placeholders: {
        email: 'name@company.com',
      },
      nifFoundWarning:
        'Person already registered — data loaded. Saving will UPDATE the existing record.',
      nifFoundWarningEditing:
        'Another Person is already registered with this Tax ID — their data replaced this form. Review before saving.',
      rolesSearchPlaceholder: 'Search role...',
      farmsSearchPlaceholder: 'Search farm...',
      bossesSearchPlaceholder: 'Search supervisor...',
      selectedCount: 'Selected',
      editPasswordNotice:
        'The password is set at creation; to reset it, use the "Reset Password" action in the list.',
      emailReadonlyNotice: 'The email cannot be changed after the account is created.',
      hints: {
        photoAccepted: 'Accepted formats: JPEG, PNG, JPG, GIF, SVG.',
        photoMaxSize: 'Maximum size: 2 MB.',
      },
      image: {
        dropzoneTitle: 'Drag an image or click to select',
        dropzoneDragging: 'Drop the image here',
        changeLabel: 'Change photo',
        removeLabel: 'Remove photo',
        errorType: 'File type not accepted.',
        errorSize: 'File exceeds the maximum size of 2 MB.',
      },
      validation: {
        nifRequired: 'Enter the Tax ID',
        nifInvalid: 'Invalid Tax ID',
        nameRequired: 'Enter the name',
        nameMaxLength: 'The name must be at most 120 characters',
        emailRequired: 'Enter the email',
        emailInvalid: 'Invalid email',
        emailMaxLength: 'The email must be at most 191 characters',
        cityRequired: 'Select the city',
        addressRequired: 'Enter the address',
        addressMaxLength: 'The address must be at most 120 characters',
        passwordRequired: 'Enter the password',
        passwordMin: 'The password must be at least 6 characters',
        passwordConfirmationMismatch: 'Passwords do not match',
        roleUuidsMin: 'Select at least one role',
        farmUuidsMin: 'Select at least one farm',
      },
    },
    actions: {
      activate: 'Activate',
      deactivate: 'Deactivate',
      activateConfirmTitle: 'Activate user',
      activateConfirmDescription: 'The user will regain access to the system. Continue?',
      deactivateConfirmTitle: 'Deactivate user',
      deactivateConfirmDescription: 'The user will lose access to the system. Continue?',
      resetPassword: 'Reset Password',
      resetPasswordConfirmTitle: 'Reset password',
      resetPasswordConfirmDescription:
        'A new password will be generated and emailed to the user; their active sessions will be revoked. Continue?',
      resetPasswordSuccess: 'Password reset. The user has been notified by email.',
      activateSuccess: 'User activated successfully.',
      deactivateSuccess: 'User deactivated successfully.',
      deleteUser: 'Delete',
      deleteUserConfirmTitle: 'Delete user',
      deleteUserConfirmDescription:
        'This action permanently deletes the user. It cannot be undone.',
      deleteUserSuccess: 'User deleted successfully.',
    },
    viewDialog: {
      title: 'View user',
      sectionPerson: 'Identification',
      sectionAccount: 'Account',
      sectionLinks: 'Access',
      fields: {
        nif: 'Tax ID',
        name: 'Name',
        nickname: 'Nickname',
        loginEmail: 'Login email',
        contactEmail: 'Contact email',
        phone: 'Phone',
        address: 'Address',
        city: 'City',
        isActive: 'Status',
        isPurchasingAssistant: 'Purchasing checker?',
        lastActivity: 'Last activity',
        roles: 'Roles',
        farms: 'Farms',
        bosses: 'Bosses',
      },
      noValue: '-',
      noRoles: 'No role linked.',
      noFarms: 'No farm linked.',
      noBosses: 'No boss linked.',
      loadError: 'Could not load the user data.',
      close: 'Close',
    },
  },
};
