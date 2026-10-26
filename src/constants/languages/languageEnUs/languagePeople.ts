// src/constants/languages/languageEnUs/languagePeople.ts
// EN-US translation of the PEOPLE (Person — Base Registrations) module.

import { ModulePeople } from '@/@types/language/module-people';

export const languagePeople: ModulePeople = {
  person: {
    singularLabel: 'Person',
    roles: {
      proprietary: 'Proprietary',
      employee: 'Employee',
      provider: 'Provider',
      client: 'Client',
      user: 'User',
    },
    roleHints: {
      proprietary: 'Farm owner — share by property and state registrations.',
      employee: 'Staff member — role, function, bank details and cost center.',
      provider: 'Supplies goods — branches, sellers and bank details.',
      client: 'Buyer — state registrations, taxpayer status and fiscal data.',
      user: 'System access — roles, farms and supervisors.',
    },

    list: {
      pageTitle: 'People',
      pageSubtitle:
        'Single civil identity registration — each person can accumulate the roles of Proprietary, Employee, Provider, Client and User.',
      searchPlaceholder: 'Search by name, nickname or Tax ID',
      deletedToast: 'Person removed successfully',
      table: {
        name: 'Name',
        document: 'Tax ID',
        email: 'E-mail',
        roles: 'Roles',
        noRole: 'No role',
        actions: '',
      },
      actions: {
        view: 'View details',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No people registered.',
        descriptionEmpty: 'Start by registering the first person.',
        titleFiltered: 'No people found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Person',
      },
      deleteDialog: {
        title: 'Delete person?',
        description: 'Are you sure you want to delete',
        warning:
          'The person stops appearing in listings, but the linked roles and satellite records remain intact in the database.',
      },
    },

    filter: {
      title: 'Filter people',
      search: 'Search',
      role: 'Role',
      roleAll: 'All roles',
    },

    steps: {
      basico: 'Basic Data',
      endereco: 'Address',
    },

    form: {
      title: { create: 'New Person', edit: 'Edit Person' },
      subtitle: {
        create: 'Fill in the steps to register the person.',
        edit: "Update the person's data.",
      },

      basico: {
        subtitle: 'Enter the identification of the person and enable the applicable roles.',
        nif: 'Tax ID',
        nameFisica: 'Full Name',
        namePj: 'Trade Name',
        nicknameFisica: 'Nickname',
        nicknamePj: 'Legal Name',
        email: 'E-mail',
        phone: 'Phone',
        rolesLabel: 'Roles for this person',
        rolesHint: 'Enable the applicable roles — each one adds a configuration step below.',
        roleAdded: '"{role}" step added — configure it next.',
        nifFoundWarning:
          'Person already registered — data loaded. Saving will UPDATE the existing record.',
      },

      endereco: {
        subtitle: "The person's address for correspondence.",
        zipCode: 'ZIP Code',
        city: 'City',
        address: 'Address',
        number: 'Number',
        district: 'District',
      },

      proprietary: {
        subtitle: 'Link the farms, the share by property and the state registrations.',
        stateRegistrations: 'State Registrations',
        stateRegistrationShort: 'IE',
        addStateRegistration: 'Add registration',
        emptyStateRegistrations: 'No state registration added.',
        farms: 'Farms and Share',
        addFarm: 'Add farm',
        emptyFarms: 'No farm linked.',
        farm: 'Farm',
        percentage: 'Share (%)',
      },

      employee: {
        subtitle: "The employee's role, function, cost center and bank details.",
        office: 'Role',
        function: 'Function (CBO)',
        commission: 'Commission (%)',
        vlTimeProductive: 'Productive Hour Value',
        vlTimeUnproductive: 'Unproductive Hour Value',
        baseSalary: 'Base Salary',
        goalSalary: 'Goal Salary',
        centerId: 'Cost Center',
        birthday: 'Birth Date',
        bank: {
          title: 'Bank Details',
          bankId: 'Bank',
          accountType: 'Account Type',
          agency: 'Branch',
          account: 'Account',
          pixType: 'PIX Key Type',
          pix: 'PIX Key',
        },
      },

      provider: {
        subtitle: 'Supply type, bank details, branches and sellers.',
        type: 'Provider Type',
        typeOptions: {
          resale: 'Input reseller',
          industry: 'Industry',
          service: 'Service provider',
          carrier: 'Carrier',
          commissioned: 'Commissioned representative',
        },
        commission: 'Commission (%)',
        hourValue: 'Hourly Rate',
        stateRegistration: 'IE (Provider)',
        cityRegistration: 'IM (Provider)',
        contact: 'Contact',
        contactPhone: 'Contact Phone',
        branches: 'Branches',
        addBranch: 'Add branch',
        emptyBranches: 'No branch registered.',
        branchNif: 'Branch Tax ID',
        branchName: 'Branch Name',
        branchStateRegistration: 'State Registration',
        branchZipCode: 'ZIP Code',
        branchCity: 'City',
        branchAddress: 'Address',
        sellers: 'Sellers',
        addSeller: 'Add seller',
        emptySellers: 'No seller registered.',
        sellerName: 'Name',
        sellerEmail: 'E-mail',
        sellerPhone: 'Phone',
      },

      client: {
        subtitle: 'Fiscal data, commercial contact and state registrations of the buyer.',
        cellphone: 'Mobile',
        contact: 'Contact',
        contactPhone: 'Contact Phone',
        cityRegistration: 'IM (Client)',
        farmName: 'Farm Name',
        finalCustomer: 'Final Customer',
        finalCustomerHint: 'Affects taxation when issuing invoices.',
        taxpayer: 'Taxpayer',
        taxpayerHint: 'Defines whether the customer is an ICMS taxpayer (tax impact).',
        country: 'Country',
        idAbroad: 'Foreign ID',
        stateRegistrations: 'State Registrations',
        stateRegistrationShort: 'IE',
        addStateRegistration: 'Add registration',
        emptyStateRegistrations: 'No state registration added.',
      },

      user: {
        subtitle: 'System access — password, roles, farms and supervisors.',
        password: 'Password',
        passwordConfirmation: 'Confirm Password',
        passwordHint: 'At least 8 characters, with uppercase, lowercase and a number.',
        editPasswordNotice:
          'The password cannot be changed here while editing. Use the password reset flow to change it.',
        purchasingAssistant: 'Purchasing Assistant',
        purchasingAssistantHint: 'Special profile with purchasing review permissions.',
        farms: 'Farms',
        roles: 'Roles',
        bosses: 'Supervisors',
        farmsSearchPlaceholder: 'Search farm...',
        rolesSearchPlaceholder: 'Search role...',
        bossesSearchPlaceholder: 'Search supervisor...',
        selectedCount: 'Selected',
        toggleRoleWarning:
          'Disabling this role does not remove the existing access — it just avoids sending new data to it.',
        deactivateDialog: {
          title: 'Deactivate user access?',
          message: 'By saving, this user will lose access to the system. Do you want to continue?',
          confirm: 'Save and deactivate access',
        },
      },

      // TASK-FE-338 — confirmation when deactivating an already-active
      // Owner/Employee/Provider/Client role (generalization of finding F).
      // `{roles}` is replaced by the list of affected role labels (e.g.
      // "Owner, Provider").
      roleDeactivateDialog: {
        title: 'Deactivate the selected role(s)?',
        message:
          'By saving, the following role(s) will be deactivated: {roles}. Data already linked to them (farms, branches, sellers, registrations) will be preserved. Do you want to continue?',
        confirm: 'Save and deactivate',
      },

      pixTypeOptions: {
        cpfCnpj: 'Tax ID',
        email: 'E-mail',
        phone: 'Phone',
        random: 'Random Key',
      },

      footer: {
        back: 'Back',
        next: 'Next',
        save: 'Save Person',
        saving: 'Saving...',
        close: 'Close',
        stepCounter: {
          label: 'Step',
          of: 'of',
        },
      },

      toasts: {
        createdSuccess: 'Person created successfully.',
        updatedSuccess: 'Person updated successfully.',
        upsertSuccess: 'Person already registered — data updated.',
      },

      unsavedChanges: {
        title: 'Unsaved changes',
        message: 'You have unsaved changes. Do you want to leave without saving?',
        confirm: 'Leave without saving',
        cancel: 'Stay',
      },

      validation: {
        nifRequired: 'Tax ID is required.',
        nifInvalid: 'Invalid Tax ID — check the digits.',
        nameRequired: 'Required field.',
        nameMaxLength: 'Maximum 120 characters.',
        nicknameRequired: 'Required field.',
        nicknameMaxLength: 'Maximum 60 characters.',
        emailInvalid: 'Invalid e-mail.',
        emailRequiredForAccess: 'E-mail is required to grant access or register a client.',
        cityRequired: 'Select a city.',
        addressRequired: 'Required field.',
        numberRequired: 'Required field.',
        numberMaxLength: 'Maximum 10 characters.',
        districtRequired: 'Required field.',
        districtMaxLength: 'Maximum 60 characters.',
        functionRequired: 'Select the function.',
        birthdayRequired: 'Birth date is required.',
        farmRequired: 'Select the farm.',
        percentageRange: 'Share must be between 0 and 100.',
        typeRequired: 'Select the type.',
        finalCustomerRequired: 'Required field.',
        taxpayerRequired: 'Required field.',
        countryRequired: 'Select the country.',
        branchNifRequired: 'Branch Tax ID is required.',
        branchCityRequired: "Select the branch's city.",
        branchAddressRequired: "Branch's address is required.",
        sellerNameRequired: "Seller's name is required.",
        passwordRequired: 'Password is required.',
        passwordMin: 'Minimum 8 characters.',
        passwordConfirmationMismatch: 'Passwords do not match.',
      },
    },
  },
};
