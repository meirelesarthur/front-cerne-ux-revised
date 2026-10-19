// src/constants/languages/languageEnUs/languageEmployees.ts
// EN-US translation of the "Funcionários" (Employee — Base Registrations)
// module. TASK-EMP-FE-01: singular/plural (queryKey), PIX/account-type enum
// options and Yup schema validation messages — esqueleto de `list`/`filter`/
// `form.fields`/`form.user` for `TASK-EMP-FE-02/03/04`.

import { ModuleEmployees } from '@/@types/language/module-employees';

export const languageEmployees: ModuleEmployees = {
  employee: {
    singularLabel: 'Employee',
    pluralLabel: 'Employees',

    pixTypeOptions: {
      cpfCnpj: 'Tax ID',
      email: 'E-mail',
      phone: 'Phone',
      random: 'Random Key',
    },

    accountTypeOptions: {
      checking: 'Checking Account',
      savings: 'Savings Account',
    },

    list: {
      pageTitle: 'Employees',
      pageSubtitle: 'Manage the employees registered in this farm.',
      table: {
        document: 'Tax ID',
        name: 'Employee',
        email: 'E-mail',
        phone: 'Phone',
        office: 'Role',
        createdAt: 'Registered on',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        deactivate: 'Deactivate',
        activate: 'Activate',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No employees registered',
        descriptionEmpty: 'Register the first employee to get started.',
        titleFiltered: 'No employees found',
        descriptionFiltered: 'Adjust the applied filters and try again.',
        cta: 'New Employee',
      },
      deactivatedToast: 'Employee deactivated successfully.',
      activatedToast: 'Employee activated successfully.',
      deactivateDialog: {
        title: 'Deactivate Employee',
        description: 'Are you sure you want to deactivate the employee',
        warning:
          'The employee will stop showing up in the default listing, but can be reactivated later.',
        confirm: 'Deactivate',
      },
      deletedToast: 'Employee deleted successfully.',
      deleteDialog: {
        title: 'Delete Employee',
        description: 'Are you sure you want to delete the employee',
        warning:
          'This action cannot be undone. An employee with linked records cannot be deleted; deactivate it instead.',
        confirm: 'Delete',
      },
      activateDialog: {
        title: 'Activate Employee',
        description: 'Are you sure you want to activate the employee',
        warning:
          'The employee will be reactivated in the system and can be deactivated again if needed.',
        confirm: 'Activate',
      },
    },

    filter: {
      title: 'Filters',
      search: 'Search',
      searchPlaceholder: 'Search by name or Tax ID',
      startDate: 'Registered from',
      endDate: 'Registered until',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
    },

    form: {
      title: {
        create: 'New Employee',
        edit: 'Edit Employee',
      },
      subtitle: {
        create: 'Register a new employee.',
        edit: "Update the employee's data.",
      },
      employmentSectionTitle: 'Employment Details',
      nifFoundWarning:
        'Person already registered — data loaded. Saving will UPDATE the existing record.',
      nifFoundWarningEditing:
        'Another Person is already registered with this ID/Tax number — their data replaced what was in this form. Review before saving.',
      nifPermissionDeniedWarning:
        'You do not have permission to look up the people registry — fill in the data manually.',
      employeeAlreadyExistsRedirectWarning:
        'Employee already registered at this farm. Opening the record for editing.',
      fields: {
        nif: 'Tax ID',
        nickname: 'Nickname',
        name: 'Full Name',
        email: 'E-mail',
        phone: 'Phone',
        zipCode: 'ZIP Code',
        address: 'Address',
        number: 'Number',
        district: 'District',
        city: 'City',
        office: 'Role',
        function: 'Function (CBO)',
        commission: 'Commission (%)',
        vlTimeProductive: 'Productive Hour Value',
        baseSalary: 'Base Salary',
        goalSalary: 'Goal Salary',
        centerId: 'Cost Center',
        birthday: 'Birth Date',
      },
      bank: {
        title: 'Bank Details',
        bankId: 'Bank',
        accountType: 'Account Type',
        agency: 'Branch',
        account: 'Account',
        pixType: 'PIX Key Type',
        pix: 'PIX Key',
      },
      cepAutofill: {
        notFound: {
          title: 'ZIP Code not found',
          description: 'Fill in the address manually.',
        },
        cityNotResolved: {
          title: 'City not identified',
          description: 'Select the city manually.',
        },
        networkError: {
          title: 'Failed to look up the ZIP Code',
          description: 'Could not reach ViaCEP right now. Fill in manually.',
        },
      },
      user: {
        sectionTitle: 'System Access',
        createUser: 'Create User',
        role: 'User Profile',
        limitReachedError:
          'The user limit for the contracted plan has been reached. Uncheck this option or contact us to upgrade your plan.',
        rolePermissionDenied: 'You do not have permission to view user profiles.',
        usersQuotaReached:
          'The user limit for the contracted plan has been reached — a new access cannot be created.',
      },
      validation: {
        nifRequired: 'Tax ID is required.',
        nifInvalid: 'Invalid Tax ID — check the digits.',
        nameRequired: 'Required field.',
        nameMaxLength: 'Maximum 120 characters.',
        nicknameRequired: 'Required field.',
        nicknameMaxLength: 'Maximum 60 characters.',
        emailInvalid: 'Invalid e-mail.',
        emailMaxLength: 'Maximum 89 characters.',
        emailRequiredForUser: 'E-mail is required to create system access.',
        phoneMaxLength: 'Maximum 15 characters.',
        addressRequired: 'Required field.',
        addressMaxLength: 'Maximum 120 characters.',
        numberRequired: 'Required field.',
        numberMaxLength: 'Maximum 10 characters.',
        districtRequired: 'Required field.',
        districtMaxLength: 'Maximum 60 characters.',
        cityRequired: 'Select a city.',
        officeMaxLength: 'Maximum 120 characters.',
        functionRequired: 'Select the function.',
        birthdayRequired: 'Birth date is required.',
        birthdayNotFuture: 'Birth date cannot be in the future.',
        baseSalaryRequired: 'Base salary is required.',
        baseSalaryMin: 'The base salary cannot be negative.',
        roleRequired: 'Select the access profile.',
      },
    },
  },
};
