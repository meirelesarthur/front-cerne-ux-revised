// src/constants/languages/languageEnUs/languageBaseRegistrations.ts
// EN-US translation of the Base Registrations aggregator module.

import { ModuleBaseRegistrations } from '@/@types/language/module-base-registrations';

import { languageDocumentManagements } from './languageDocumentManagements';

export const languageBaseRegistrations: ModuleBaseRegistrations = {
  documentManagements: languageDocumentManagements,
  titleModule: 'Base Registrations',
  diagnosisPregnancy: {
    singularLabel: 'Pregnancy Diagnosis',
    pluralLabel: 'Pregnancy Diagnoses',
    list: {
      pageTitle: 'Pregnancy Diagnosis',
      pageSubtitle: 'Manage the pregnancy diagnosis results used in reproductive management.',
      deletedToast: 'Pregnancy diagnosis removed successfully',
      table: {
        description: 'Description',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No pregnancy diagnosis registered.',
        descriptionEmpty: 'Start by adding the first diagnosis result.',
        titleFiltered: 'No diagnosis found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Diagnosis',
      },
    },
    filter: {
      title: 'Filter diagnosis',
      search: 'Search',
      searchPlaceholder: 'Search by description',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
    },
    form: {
      title: {
        create: 'New Diagnosis',
        edit: 'Edit Diagnosis',
      },
      subtitle: {
        create: 'Register a new pregnancy diagnosis result.',
        edit: 'Update the pregnancy diagnosis data.',
      },
      fields: {
        description: 'Description',
        isEnabled: 'Status',
      },
      placeholders: {
        description: 'E.g.: Pregnant',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
      },
    },
  },

  // Body Score (BodyScore, TASK-BS-FE-01) — mirror `diagnosisPregnancy` + FK
  // to Species. `is_enabled` label = "Enabled" (GAP-BS-FE-01, [AVALIADO] —
  // owner decision, faithful to the legacy Blade). Boolean representation
  // "Yes"/"No" — exact texts of the legacy `<select>`
  // (`00-Documentacao_Bruta/BodyScore/01-BodyScore.md ## 6`, item 3) — NOT
  // "Active"/"Inactive".
  bodyScore: {
    singularLabel: 'Body Score',
    pluralLabel: 'Body Scores',
    list: {
      pageTitle: 'Body Score',
      pageSubtitle: 'Manage the body scores used in herd management.',
      deletedToast: 'Body score removed successfully',
      table: {
        description: 'Description',
        specie: 'Species',
        isEnabled: 'Enabled',
        yes: 'Yes',
        no: 'No',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No body score registered.',
        descriptionEmpty: 'Start by adding the first body score.',
        titleFiltered: 'No body score found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Body Score',
      },
    },
    filter: {
      title: 'Filter body scores',
      search: 'Search',
      searchPlaceholder: 'Search by description',
      specie: 'Species',
      specieAll: 'All',
    },
    form: {
      title: {
        create: 'New Body Score',
        edit: 'Edit Body Score',
      },
      subtitle: {
        create: 'Register a new body score used in herd management.',
        edit: 'Update the body score data.',
      },
      fields: {
        description: 'Description',
        isEnabled: 'Enabled',
        specie: 'Species',
      },
      placeholders: {
        description: 'E.g.: 3.5',
        specie: 'Select the species',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
        specieRequired: 'Species is required',
      },
    },
  },

  accountingGroupers: {
    singularLabel: 'Accounting Grouper',
    pluralLabel: 'Accounting Groupers',
    list: {
      pageTitle: 'Accounting Groupers',
      pageSubtitle: 'Manage the accounting grouper tree (income statement).',
      deletedToast: 'Accounting grouper removed successfully',
      table: {
        code: 'Code',
        name: 'Name',
        order: 'Order',
        isEnabled: 'Status',
        active: 'Active',
        inactive: 'Inactive',
        actions: 'Actions',
      },
      actions: {
        edit: 'Edit',
        addChild: 'Add descendant',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No accounting grouper registered.',
        descriptionEmpty: 'Start by adding the first accounting grouper.',
        titleFiltered: 'No accounting grouper found.',
        descriptionFiltered: 'Try adjusting your search.',
        cta: 'New Accounting Grouper',
      },
      error: {
        message: 'Unable to load the Accounting Groupers tree.',
        retry: 'Try again',
      },
    },
    filter: {
      title: 'Filter accounting groupers',
      search: 'Search',
      searchPlaceholder: 'Search by code or name',
    },
    form: {
      title: {
        create: 'New Accounting Grouper',
        createChild: 'New Accounting Grouper (descendant)',
        edit: 'Edit Accounting Grouper',
      },
      subtitle: {
        create: 'Register a new accounting grouper.',
        edit: 'Update the accounting grouper data.',
      },
      fields: {
        code: 'Code',
        name: 'Name',
        isEnabled: 'Status',
        order: 'Order',
        parent: 'Parent',
      },
      placeholders: {
        name: 'E.g.: Gross Revenue',
      },
      parentPlaceholder: {
        root: 'Root (no parent)',
      },
      hints: {
        codeGenerated: 'Generated automatically on save',
      },
      validation: {
        nameRequired: 'Name is required',
        nameMaxLength: 'Name must be at most 60 characters',
        isEnabledRequired: 'Status is required',
        orderRequired: 'Order is required',
        orderMin: 'Order must be greater than or equal to 1',
      },
    },
    deleteBlocked: {
      title: 'Cannot delete',
      description:
        'There are records linked to this accounting grouper. Remove or reassign the links below before deleting',
      resourceLabel: '{count} link(s) in {resource}',
      tableLabels: {
        accounting_groupers: 'Child accounting grouper(s)',
        financial_categories: 'Linked financial category(ies)',
      },
    },
  },
  additionalInfo: {
    singularLabel: 'Additional Info',
    pluralLabel: 'Additional Infos',
    list: {
      pageTitle: 'Additional Info',
      pageSubtitle: 'Manage the additional info used in Operation Nature.',
      deletedToast: 'Additional Info removed successfully',
      table: {
        description: 'Description',
        info: 'Info',
        isActive: 'Status',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No additional info registered.',
        descriptionEmpty: 'Start by adding your first additional info.',
        titleEmptyNoCreate: 'No additional info registered.',
        descriptionEmptyNoCreate: 'Ask an administrator to register an additional info.',
        titleFiltered: 'No additional info found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Additional Info',
      },
    },
    filter: {
      title: 'Filter additional info',
      search: 'Search',
      searchPlaceholder: 'Search by description',
      isActive: 'Status',
      isActiveAll: 'All',
      activeOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
    },
    form: {
      title: {
        create: 'New Additional Info',
        edit: 'Edit Additional Info',
      },
      subtitle: {
        create: 'Register a new additional info for use in Operation Nature.',
        edit: 'Update the additional info data.',
      },
      fields: {
        description: 'Description',
        info: 'Info',
        isActive: 'Status',
      },
      placeholders: {
        description: 'E.g.: ICMS Tax Substitution',
        info: 'Describe the detail of this additional info',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
        infoRequired: 'Info is required',
        infoMaxLength: 'Info must be at most 1000 characters',
      },
    },
  },
  addressing: {
    singularLabel: 'Addressing',
    pluralLabel: 'Addressings',
    pageTitle: 'Addressing',
    pageSubtitle: 'Manage the Addressing tree (Sector, Aisle, Shelf and Level).',
    deletedToast: 'Addressing removed successfully',
    levels: {
      1: 'Sector',
      2: 'Aisle',
      3: 'Shelf',
      4: 'Level',
    },
    table: {
      description: 'Description',
      level: 'Level',
      childrenCount: 'Children',
    },
    tree: {
      expand: 'Expand',
      collapse: 'Collapse',
    },
    actions: {
      edit: 'Edit',
      addChild: 'Add {level}',
      delete: 'Delete',
    },
    empty: {
      message: 'No Addressing registered yet.',
      cta: 'New Addressing',
    },
    error: {
      message: 'Could not load the Addressing tree.',
      retry: 'Try again',
    },
    filter: {
      title: 'Filter Addressing',
      search: 'Description',
      searchPlaceholder: 'Search by description',
    },
    form: {
      title: {
        create: 'New {level}',
        edit: 'Edit {level}',
      },
      subtitle: {
        create: 'Register a new addressing.',
        edit: "Update this addressing's description.",
      },
      fields: {
        description: 'Description',
        parentInfo: 'Parent addressing',
      },
      parentInfo: {
        noParent: 'This will be a Sector (root) — no parent addressing.',
      },
      placeholders: {
        description: 'Enter the description',
      },
      validation: {
        descriptionRequired: 'Description is required',
      },
    },
    deleteBlocked: {
      title: 'Cannot delete',
      description:
        'There are records linked to this addressing. Remove or reassign the links below before deleting',
      resourceLabel: '{count} link(s) in {resource}',
      tableLabels: {
        addressings: 'Child addressing(s)',
        products: 'Linked product(s)',
      },
    },
  },
  // Apportionment (Rateio - Categoria Financeira, TASK-AP-FE-02) — links 1
  // Financial Category to the fixed distribution of the farm's productive
  // activities, with optional Cost Center breakdown.
  apportionment: {
    singularLabel: 'Apportionment',
    pluralLabel: 'Apportionments',
    list: {
      pageTitle: 'Apportionments / Categories',
      pageSubtitle:
        "Manage the fixed apportionment of each Financial Category across the farm's productive activities.",
      deletedToast: 'Apportionment removed successfully',
      table: {
        financialCategory: 'Financial Category',
        totalHa: 'Total (ha)',
        totalPercentage: 'Total (%)',
        actions: 'Actions',
      },
      actions: { edit: 'Edit', delete: 'Delete' },
      emptyState: {
        titleEmpty: 'No apportionment registered.',
        descriptionEmpty:
          'Start by linking a Financial Category to the apportionment of activities.',
        titleFiltered: 'No apportionment found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Apportionment',
      },
    },
    filter: {
      title: 'Filter apportionments',
      search: 'Search',
      searchPlaceholder: 'Search by Financial Category',
    },
    form: {
      title: { create: 'New Apportionment', edit: 'Edit Apportionment' },
      subtitle: {
        create: 'Link a Financial Category to the apportionment of productive activities.',
        edit: 'Update the apportionment of productive activities.',
      },
      fields: {
        financialCategory: 'Financial Category',
        activity: 'Activity',
        ha: 'Productive Area (ha)',
        percentage: 'Productive Area (%)',
        costCentersSectionTitle: 'Cost Centers',
        costCenter: 'Cost Center',
        unsetedHa: 'Available Ha',
        costCenterHa: 'Ha to Allocate',
        costCenterHaPercentage: 'Percentage',
        totalHa: 'Total (ha)',
        totalPercentage: 'Total (%)',
      },
      placeholders: {
        financialCategory: 'Select the Financial Category',
        costCenter: 'Select the Cost Center',
      },
      validation: {
        financialCategoryRequired: 'Financial Category is required',
        itemsMinLength: 'There must be at least one productive activity registered on the farm',
        centerRequired: 'Select a Cost Center',
        haRequired: 'Ha value is required',
        haMin: 'Ha value cannot be negative',
        haExceedsAvailable: 'Ha value cannot exceed the available amount for this activity',
        haPercentageMax: 'Percentage cannot exceed 100%',
        haPercentageExceedsRemaining:
          "Percentage cannot exceed the remaining amount available among this activity's Cost Centers",
      },
      addCenterRowLabel: 'Add Cost Center',
      removeCenterRowLabel: 'Remove Cost Center',
    },
  },
  bank: {
    singularLabel: 'Bank',
    pluralLabel: 'Banks',
    list: {
      pageTitle: 'Banks',
      pageSubtitle: 'View the catalog of financial institutions (code and name).',
      deletedToast: 'Bank deleted successfully',
      table: {
        code: 'Code',
        name: 'Name',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      search: {
        placeholder: 'Search by code or name',
      },
      emptyState: {
        titleEmpty: 'No banks registered.',
        descriptionEmpty: 'Start by adding your first bank.',
        titleEmptyNoCreate: 'No banks available.',
        descriptionEmptyNoCreate:
          'There are no banks registered yet. Contact the platform administrator.',
        titleFiltered: 'No banks found.',
        descriptionFiltered: 'Try adjusting the search by code or name.',
        cta: 'New Bank',
      },
      deleteConfirm: {
        title: 'Delete bank',
        message: 'Are you sure you want to delete the bank',
        warning:
          'This deletion is permanent. If the bank is linked to a supplier, the deletion may fail.',
      },
    },
    form: {
      title: {
        create: 'New Bank',
        edit: 'Edit Bank',
      },
      subtitle: {
        create: 'Register a new bank in the financial institutions catalog.',
        edit: 'Update the bank data.',
      },
      fields: {
        code: 'Code',
        name: 'Name',
      },
      placeholders: {
        code: 'E.g.: 001',
        name: 'E.g.: Bank of Brazil S.A.',
      },
      validation: {
        codeRequired: 'Code is required',
        codeMaxLength: 'Code must be at most 4 characters',
        codeDuplicate:
          'A bank with this code already exists. The main banks are already pre-registered.',
        nameRequired: 'Name is required',
        nameMaxLength: 'Name must be at most 100 characters',
      },
    },
  },

  headband: {
    singularLabel: 'Headband',
    pluralLabel: 'Headbands',
    type: {
      central: 'Central',
      partnerLogo: 'Partner Logo',
    },
    list: {
      pageTitle: 'Headbands',
      pageSubtitle: 'Manage the banners displayed at the top of the system.',
      deletedToast: 'Headband removed successfully',
      table: {
        position: 'Position',
        description: 'Description',
        type: 'Type',
        partners: 'Partners',
        partnersNone: 'No partners linked',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No headbands registered.',
        descriptionEmpty: 'Start by adding the first banner.',
        titleFiltered: 'No headbands found.',
        descriptionFiltered: 'Try adjusting the filters.',
        cta: 'New Headband',
      },
    },
    filter: {
      title: 'Filter headbands',
      type: 'Type',
      typeAll: 'All',
      partner: 'Partner',
      partnerPlaceholder: 'Search partner',
    },
    form: {
      title: {
        create: 'New Headband',
        edit: 'Edit Headband',
      },
      subtitle: {
        create: 'Create a new banner.',
        edit: 'Update the headband data.',
      },
      fields: {
        description: 'Description',
        link: 'Link',
        position: 'Position',
        type: 'Type',
        image: 'Image',
        partner: 'Partner (single)',
        partners: 'Linked partners',
      },
      placeholders: {
        description: 'E.g.: Summer campaign',
        link: 'https://...',
        position: 'E.g.: 1',
      },
      hints: {
        imageAccepted: 'Accepted formats: PNG, JPG, JPEG, GIF.',
        imageMaxSize: 'Maximum size: 2MB.',
      },
      image: {
        dropzoneTitle: 'Drag an image or click to select',
        dropzoneDragging: 'Drop the image here',
        changeLabel: 'Change image',
        errorType: 'File type not accepted.',
        errorSize: 'File exceeds maximum size.',
      },
      partnersChecklist: {
        searchPlaceholder: 'Search partner',
        selectAllLabel: 'Select all',
        deselectAllLabel: 'Deselect all',
        selectedCountLabel: 'Number of selected partners',
        emptyLabel: 'No partners found.',
        errorLabel: 'Error loading partners list.',
        retryLabel: 'Try again',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 40 characters',
        linkRequired: 'Link is required',
        linkMaxLength: 'Link must be at most 200 characters',
        positionRequired: 'Position is required',
        positionMin: 'Position must be at least 1',
        positionMax: 'Position must be at most 127',
        typeRequired: 'Type is required',
      },
      businessRule: {
        limitReached: 'Limit of 7 headbands reached for this type.',
        svgNotAccepted: 'SVG files are not accepted. Use PNG, JPG, JPEG or GIF.',
      },
    },
  },

  birthNote: {
    singularLabel: 'Birth Note',
    pluralLabel: 'Birth Notes',
    list: {
      pageTitle: 'Birth Notes',
      pageSubtitle: 'Manage the birth notes used on animals.',
      deletedToast: 'Birth note removed successfully',
      table: {
        description: 'Description',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No birth note registered.',
        descriptionEmpty: 'Start by adding your first birth note.',
        titleFiltered: 'No birth note found.',
        descriptionFiltered: 'Try adjusting the search.',
        cta: 'New Birth Note',
      },
    },
    filter: {
      title: 'Filter birth notes',
      search: 'Search',
      searchPlaceholder: 'Search by description',
    },
    form: {
      title: {
        create: 'New Birth Note',
        edit: 'Edit Birth Note',
      },
      subtitle: {
        create: 'Register a new birth note used on animals.',
        edit: 'Update the birth note data.',
      },
      fields: {
        description: 'Description',
        isEnabled: 'Status',
      },
      placeholders: {
        description: 'E.g.: Assisted birth',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
      },
    },
  },
  categoryType: {
    singularLabel: 'Category Type',
    pluralLabel: 'Category Types',
    list: {
      pageTitle: 'Category Types',
      pageSubtitle: 'Manage the types used in financial categories.',
      deletedToast: 'Category type removed successfully',
      table: {
        description: 'Description',
        isEnabled: 'Status',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No category types registered.',
        descriptionEmpty: 'Start by adding your first category type.',
        titleEmptyNoCreate: 'No category types registered.',
        descriptionEmptyNoCreate: 'Ask an administrator to register a category type.',
        titleFiltered: 'No category types found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Category Type',
      },
    },
    filter: {
      title: 'Filter category types',
      search: 'Search',
      searchPlaceholder: 'Search by description',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
    },
    form: {
      title: {
        create: 'New Category Type',
        edit: 'Edit Category Type',
      },
      subtitle: {
        create: 'Register a new type for use in financial categories.',
        edit: 'Update the category type data.',
      },
      fields: {
        description: 'Description',
        isEnabled: 'Status',
      },
      placeholders: {
        description: 'E.g.: Operating Revenue',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
      },
    },
  },
  diagnosticTechnique: {
    singularLabel: 'Diagnostic Technique',
    pluralLabel: 'Diagnostic Techniques',
    list: {
      pageTitle: 'Diagnostic Techniques',
      pageSubtitle: 'Manage the techniques used in pregnancy diagnosis.',
      deletedToast: 'Diagnostic technique removed successfully',
      table: {
        description: 'Description',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No diagnostic technique registered.',
        descriptionEmpty: 'Start by adding your first diagnostic technique.',
        titleFiltered: 'No diagnostic technique found.',
        descriptionFiltered: 'Try adjusting the search.',
        cta: 'New Diagnostic Technique',
      },
    },
    filter: {
      title: 'Filter diagnostic techniques',
      search: 'Search',
      searchPlaceholder: 'Search by description',
    },
    form: {
      title: {
        create: 'New Diagnostic Technique',
        edit: 'Edit Diagnostic Technique',
      },
      subtitle: {
        create: 'Register a new technique used in pregnancy diagnosis.',
        edit: 'Update the diagnostic technique data.',
      },
      fields: {
        description: 'Description',
        isEnabled: 'Status',
      },
      placeholders: {
        description: 'E.g.: Ultrasound',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
      },
    },
  },
  // ============================================
  // Administrativo (Administrative) — Gestão Documentos — Document Type
  // (TASK-DT-FE-01). This Task covers only `list`/`filter` — `form.*` is
  // completed in TASK-DT-FE-02.
  // ============================================
  documentTypes: {
    singularLabel: 'Document Type',
    pluralLabel: 'Document Types',
    list: {
      pageTitle: 'Document Types',
      pageSubtitle: 'Manage the document type tree.',
      deletedToast: 'Document type removed successfully',
      table: {
        code: 'Code',
        name: 'Name',
        order: 'Order',
        isEnabled: 'Status',
        active: 'Active',
        inactive: 'Inactive',
        actions: 'Actions',
      },
      actions: {
        edit: 'Edit',
        addChild: 'Add descendant',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No document type registered.',
        descriptionEmpty: 'Start by adding the first document type.',
        titleFiltered: 'No document type found.',
        descriptionFiltered: 'Try adjusting your search.',
        cta: 'New Document Type',
      },
      error: {
        message: 'Unable to load the Document Types tree.',
        retry: 'Try again',
      },
    },
    filter: {
      title: 'Filter document types',
      search: 'Search',
      searchPlaceholder: 'Search by code or name',
    },
    form: {
      title: {
        create: 'New Document Type',
        createChild: 'New Document Type (descendant)',
        edit: 'Edit Document Type',
      },
      subtitle: {
        create: 'Register a new document type.',
        edit: 'Update the document type data.',
      },
      fields: {
        code: 'Code',
        name: 'Name',
        isEnabled: 'Status',
        order: 'Order',
        parent: 'Parent',
      },
      placeholders: {
        name: 'E.g.: Driver License',
      },
      parentPlaceholder: {
        root: 'Root (no parent)',
      },
      hints: {
        codeGenerated: 'Generated automatically on save',
      },
      validation: {
        nameRequired: 'Name is required',
        nameMaxLength: 'Name must be at most 60 characters',
        isEnabledRequired: 'Status is required',
        orderRequired: 'Order is required',
      },
    },
  },
  familyEquipment: {
    singularLabel: 'Family Equipment',
    pluralLabel: 'Family Equipments',
    list: {
      pageTitle: 'Family Equipment',
      pageSubtitle: 'Manage the equipment parameter catalog used by inventory and depreciation.',
      deletedToast: 'Family equipment removed successfully',
      table: {
        image: 'Image',
        description: 'Description',
        typeDepreciation: 'Depreciation type',
        lifeBens: 'Useful life (years)',
        active: 'Active',
        activeLabel: 'Active',
        inactiveLabel: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No family equipment registered.',
        descriptionEmpty: 'Start by adding the first family equipment.',
        titleFiltered: 'No family equipment found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Family Equipment',
      },
    },
    filter: {
      title: 'Filter family equipment',
      search: 'Search',
      searchPlaceholder: 'Search by description',
      typeDepreciation: 'Depreciation type',
      typeDepreciationAll: 'All',
      typeDepreciationOptions: {
        semResidual: 'No residual value',
        comResidual: 'With residual value',
      },
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
    },
    form: {
      title: {
        create: 'New Family Equipment',
        edit: 'Edit Family Equipment',
      },
      subtitle: {
        create: 'Register a new family equipment for use in inventory and depreciation.',
        edit: 'Update the family equipment data.',
      },
      fields: {
        description: 'Description',
        typeDepreciation: 'Depreciation type',
        depreciation: 'Depreciation (%)',
        residual: 'Residual value (%)',
        lifeBens: 'Useful life (years)',
        vlTimeProductive: 'Productive time',
        vlTimeUnproductive: 'Unproductive time',
        isEnabled: 'Active',
        image: 'Image',
      },
      placeholders: {
        description: 'E.g.: Crawler tractor',
      },
      hints: {
        residualConditional: 'Required when the depreciation type is "With residual value".',
        imageAccepted: 'Accepted formats: JPEG, PNG, JPG, GIF, SVG.',
        imageMaxSize: 'Maximum size: 2 MB.',
      },
      typeDepreciationOptions: {
        semResidual: 'No residual value',
        comResidual: 'With residual value',
      },
      image: {
        dropzoneTitle: 'Drag an image or click to select',
        dropzoneDragging: 'Drop the image here',
        changeLabel: 'Change image',
        removeLabel: 'Remove image',
        errorType: 'Format not accepted. Upload a JPEG, PNG, JPG, GIF or SVG file.',
        errorSize: 'File exceeds the 2 MB maximum size.',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
        typeDepreciationRequired: 'Select the depreciation type',
        depreciationRange: 'Depreciation must be between 0 and 100',
        residualRequired: 'Residual value is required for this depreciation type',
        residualRange: 'Residual value must be between 0 and 100',
        lifeBensPositive: 'Useful life must be a whole number greater than zero',
        vlTimeMin: 'The value must be greater than or equal to zero',
      },
    },
  },
  fodder: {
    singularLabel: 'Fodder',
    pluralLabel: 'Fodders',
    list: {
      pageTitle: 'Fodder',
      pageSubtitle: 'Manage the fodder records used in herd grazing.',
      deletedToast: 'Fodder removed successfully',
      table: {
        description: 'Description',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No fodder registered.',
        descriptionEmpty: 'Start by adding your first fodder.',
        cta: 'New Fodder',
      },
    },
    deleteBlocked: {
      title: 'Cannot delete',
      description:
        'This fodder is linked to grazing records. Remove the link below before deleting',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        grazings: 'Linked grazing(s)',
      },
    },
    form: {
      title: {
        create: 'New Fodder',
        edit: 'Edit Fodder',
      },
      subtitle: {
        create: 'Register a new fodder used in herd grazing.',
        edit: 'Update the fodder data.',
      },
      fields: {
        description: 'Description',
        isEnabled: 'Status',
      },
      placeholders: {
        description: 'E.g.: Elephant grass',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
      },
    },
  },
  grazing: {
    singularLabel: 'Grazing',
    pluralLabel: 'Grazings',
    list: {
      pageTitle: 'Grazing Module',
      pageSubtitle: 'Manage the grazings used in the herd paddock rotation.',
      deletedToast: 'Grazing removed successfully',
      table: {
        code: 'Code',
        description: 'Description',
        fodder: 'Fodder',
        date: 'Date',
        color: 'Color',
        controlProductivity: 'Controls Productivity',
        areasCount: 'Paddocks',
        areasSum: 'Total Area (ha)',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No grazing registered.',
        descriptionEmpty: 'Start by adding the first grazing.',
        cta: 'New Grazing',
      },
    },
    controlProductivityOptions: {
      yes: 'Yes',
      no: 'No',
    },
    colorOptions: {
      white: 'White',
      blue: 'Blue',
      black: 'Black',
      green: 'Green',
      yellow: 'Yellow',
      red: 'Red',
      gray: 'Gray',
      lightGray: 'Light Gray',
      lightBlue: 'Light Blue',
      darkBlue: 'Dark Blue',
      turquoise: 'Turquoise',
      darkGreen: 'Dark Green',
      lightGreen: 'Light Green',
      orange: 'Orange',
    },
    form: {
      title: {
        create: 'New Grazing',
        edit: 'Edit Grazing',
      },
      subtitle: {
        create: 'Register a new grazing for the herd paddock rotation.',
        edit: 'Update the grazing data.',
      },
      fields: {
        description: 'Description',
        fodder: 'Fodder',
        date: 'Date',
        code: 'Code',
        color: 'Color',
        controlProductivity: 'Controls Productivity',
        responsible: 'Responsible',
        areas: 'Paddocks',
      },
      placeholders: {
        description: 'Enter the grazing description',
        fodder: 'Select the fodder',
      },
      hints: {
        codeGenerated: 'Automatically generated',
        // TASK-GZ-FE-03: the paddock selection map now exists — text
        // updated from "available in the next step" to the real usage
        // hint, shown above the map (mirror `demarcacaoText.mapHint`).
        areasPlaceholder: 'Click a paddock on the map to select or unselect it.',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
        fodderRequired: 'Fodder is required',
        dateRequired: 'Date is required',
        colorFormat: 'Select a valid color from the available palette',
        colorRequired: 'Color is required',
        areasMin: 'Select at least one paddock',
        areasRequired: 'Paddocks are required',
      },
      invalidFieldsToast: 'Please review the highlighted fields in the form.',
    },
    map: {
      loading: 'Loading paddocks...',
      noActiveFarm: 'Select an active farm to see the available paddocks.',
      errorState: {
        title: 'Could not load paddocks',
        description: 'An error occurred while fetching the active farm Areas.',
        retry: 'Try again',
      },
      emptyState: {
        title: 'No paddock registered on this farm',
        description: 'Register Areas in the Farm/Area module to be able to select them here.',
      },
      selectedCountLabel: '{count} paddock(s) selected',
      areaSumPreviewLabel: 'Summed area (preview): {value} ha',
      conflictToast: {
        title: 'Paddock unavailable',
        description: '{description} ({code}) is already linked to another Grazing.',
      },
      validateErrorToast: 'Could not verify this paddock availability. Please try again.',
    },
  },
  ibpt: {
    singularLabel: 'IBPT Table',
    pluralLabel: 'IBPT Tables',
    list: {
      pageTitle: 'IBPT',
      pageSubtitle: 'Manage the tax incidence tables by state.',
      deletedToast: 'IBPT table removed successfully',
      table: { uf: 'State', versao: 'Version', itemsCount: 'No. Records' },
      actions: { view: 'View', delete: 'Delete' },
      emptyState: {
        titleEmpty: 'No IBPT table registered.',
        descriptionEmpty: 'Import the first tax table by state.',
        cta: 'New Table',
      },
    },
    import: {
      title: { create: 'New IBPT Table' },
      subtitle: { create: 'Import a tax table by state from a CSV file.' },
      fields: { uf: 'State', versao: 'Version', file: 'CSV File' },
      fileUpload: {
        label: 'CSV File',
        hint: 'Accepted formats: .csv, .txt — up to 10MB.',
        dropzoneTitle: 'Drag a file or click to select',
        dropzoneDraggingTitle: 'Drop the file here',
        changeLabel: 'Change file',
        removeLabel: 'Remove file',
        errorTypeMessage: 'File type not accepted.',
        errorSizeMessage: 'File exceeds the maximum size.',
      },
      warning: {
        title: 'Warning: full table replacement',
        description:
          'Re-importing a state that already has a registered table completely replaces the previous ' +
          'table (header and rows). There is no version history.',
      },
      rowErrors: { title: 'The CSV file contains invalid rows:' },
      validation: {
        ufRequired: 'State is required',
        versaoRequired: 'Version is required',
        versaoMaxLength: 'Version must have at most 30 characters',
        fileRequired: 'Select a CSV file',
      },
      cancelButton: 'Cancel',
      submitButton: 'Save',
      importSuccessToast: 'IBPT table imported successfully',
    },
    detail: {
      pageTitle: 'IBPT {uf}',
      itemsLabel: 'Records',
      fields: { uf: 'State', versao: 'Version', itemsCount: 'No. Records' },
      table: {
        codigo: 'Code',
        nacionalFederal: 'National Federal',
        importadoFederal: 'Imported Federal',
        estadual: 'State',
        municipal: 'Municipal',
      },
      notFound: {
        title: 'IBPT table not found',
        description: 'The requested table does not exist or was removed.',
        back: 'Back',
      },
    },
  },
  identificationType: {
    singularLabel: 'Identification Type',
    pluralLabel: 'Identification Types',
    list: {
      pageTitle: 'Identification Types',
      pageSubtitle: 'Manage the identification types used on animals.',
      deletedToast: 'Identification type removed successfully',
      table: {
        description: 'Description',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No identification type registered.',
        descriptionEmpty: 'Start by adding your first identification type.',
        cta: 'New Identification Type',
      },
    },
    form: {
      title: {
        create: 'New Identification Type',
        edit: 'Edit Identification Type',
      },
      subtitle: {
        create: 'Register a new identification type used on animals.',
        edit: 'Update the identification type data.',
      },
      fields: {
        description: 'Description',
        isEnabled: 'Status',
      },
      placeholders: {
        description: 'E.g.: Ear Tag',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
      },
    },
  },
  indexer: {
    singularLabel: 'Indexer',
    pluralLabel: 'Indexers',
    list: {
      pageTitle: 'Indexers',
      pageSubtitle: 'Manage the indexers used in financial contracts.',
      deletedToast: 'Indexer removed successfully',
      table: {
        description: 'Description',
        descriptive: 'Descriptive',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No indexer registered.',
        descriptionEmpty: 'Start by adding your first indexer.',
        titleFiltered: 'No indexer found.',
        descriptionFiltered: 'Try adjusting the search.',
        cta: 'New Indexer',
      },
    },
    filter: {
      title: 'Filter indexers',
      search: 'Search',
      searchPlaceholder: 'Search by description or descriptive',
    },
    form: {
      title: {
        create: 'New Indexer',
        edit: 'Edit Indexer',
      },
      subtitle: {
        create: 'Register a new indexer used in financial contracts.',
        edit: 'Update the indexer data.',
      },
      fields: {
        description: 'Description',
        descriptive: 'Descriptive',
        isEnabled: 'Status',
      },
      placeholders: {
        description: 'E.g.: IGPM',
        descriptive: 'E.g.: General Market Price Index',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
        descriptiveRequired: 'Descriptive is required',
        descriptiveMaxLength: 'Descriptive must be at most 100 characters',
      },
    },
  },
  issueDfeSyncTime: {
    singularLabel: 'DFe Sync',
    pluralLabel: 'DFe Syncs',
    list: {
      pageTitle: 'DFe Sync',
      pageSubtitle: 'Manage the DFe synchronization times for each Tax Issuer.',
      deletedToast: 'Sync removed successfully',
      table: {
        issuer: 'Issuer',
        syncHour: 'Sync Time',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No sync registered.',
        descriptionEmpty: 'Start by adding your first DFe sync.',
        titleEmptyNoCreate: 'No sync registered.',
        descriptionEmptyNoCreate: 'Ask an administrator to register a sync.',
        cta: 'New Sync',
      },
      error: {
        message: 'Unable to load the syncs.',
        retry: 'Try again',
      },
    },
    form: {
      title: { create: 'New Sync', edit: 'Edit Sync' },
      subtitle: {
        create: 'Register a new DFe synchronization time for a Tax Issuer.',
        edit: 'Update the DFe synchronization time.',
      },
      fields: {
        issue: 'Issuer',
        syncHour: 'Sync Time',
      },
      placeholders: {
        issue: 'Search tax issuer...',
      },
      validation: {
        issueRequired: 'Select a Tax Issuer',
        syncHourRequired: 'Select the sync time',
      },
    },
  },
  lowReason: {
    singularLabel: 'Low Reason',
    pluralLabel: 'Low Reasons',
    list: {
      pageTitle: 'Low Reasons',
      pageSubtitle: 'Manage the reasons used when writing off animals.',
      deletedToast: 'Low reason removed successfully',
      table: {
        code: 'Code',
        description: 'Description',
        doMovement: 'Moves Stock',
        isEnabled: 'Status',
        doMovementYes: 'Yes',
        doMovementNo: 'No',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No low reasons registered.',
        descriptionEmpty: 'Start by adding your first low reason.',
        titleEmptyNoCreate: 'No low reasons registered.',
        descriptionEmptyNoCreate: 'Ask an administrator to register a low reason.',
        titleFiltered: 'No low reasons found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Low Reason',
      },
    },
    filter: {
      title: 'Filter low reasons',
      search: 'Search',
      searchPlaceholder: 'Search by description',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      doMovement: 'Moves Stock',
      doMovementAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
      movementOptions: {
        yes: 'Yes',
        no: 'No',
      },
    },
    form: {
      title: {
        create: 'New Low Reason',
        edit: 'Edit Low Reason',
      },
      subtitle: {
        create: 'Register a new reason for use when writing off animals.',
        edit: 'Update the low reason data.',
      },
      fields: {
        code: 'Code',
        description: 'Description',
        doMovement: 'Moves Stock',
        isEnabled: 'Status',
      },
      placeholders: {
        description: 'E.g.: Death, Sale, Theft',
      },
      hints: {
        codeGenerated: 'Automatically generated on save',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
      },
    },
    detail: {
      sections: {
        generalData: 'General Data',
      },
      fields: {
        code: 'Code',
        description: 'Description',
        doMovement: 'Moves Stock',
        isEnabled: 'Status',
      },
      actions: {
        edit: 'Edit',
      },
      notFound: {
        title: 'Low reason not found',
        description: 'The requested low reason does not exist or was removed.',
        back: 'Back',
      },
    },
  },
  measurement: {
    singularLabel: 'Measurement Unit',
    pluralLabel: 'Measurement Units',
    list: {
      pageTitle: 'Measurement Units',
      pageSubtitle: 'Manage the measurement units used across the system registrations.',
      deletedToast: 'Measurement unit removed successfully',
      table: {
        name: 'Abbreviation',
        description: 'Description',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No measurement unit registered.',
        descriptionEmpty: 'Start by adding your first measurement unit.',
        titleEmptyNoCreate: 'No measurement unit available.',
        descriptionEmptyNoCreate:
          'There are no measurement units registered yet. Contact the platform administrator.',
        titleFiltered: 'No measurement unit found.',
        descriptionFiltered: 'Try adjusting or clearing the search.',
        cta: 'New Measurement Unit',
      },
      deleteConfirm: {
        title: 'Delete measurement unit',
        description: 'Are you sure you want to delete the measurement unit',
        warning: 'This deletion is permanent and cannot be undone.',
      },
    },
    filter: {
      title: 'Search Measurement Units',
      search: 'Search',
      searchPlaceholder: 'Search by abbreviation or description',
    },
    form: {
      title: {
        create: 'New Measurement Unit',
        edit: 'Edit Measurement Unit',
      },
      subtitle: {
        create: 'Register a new measurement unit.',
        edit: 'Update the measurement unit data.',
      },
      fields: {
        name: 'Abbreviation',
        description: 'Description',
      },
      placeholders: {
        name: 'E.g.: KG',
        description: 'E.g.: Kilogram',
      },
      validation: {
        nameRequired: 'Abbreviation is required',
        nameMaxLength: 'Abbreviation must be at most 8 characters',
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
      },
    },
  },
  nfse: {
    singularLabel: 'Received NFS-e',
    pluralLabel: 'Received NFS-e',
    list: {
      pageTitle: 'Received NFSe',
      pageSubtitle: 'Review the service invoices received by the Issuer.',
      table: {
        prestador: 'Provider',
        cpfCnpj: 'Tax ID',
        numero: 'Number',
        valor: 'Value',
        dtEmissao: 'Issue Date',
        competencia: 'Period',
        lancada: 'Launched',
        ibs: 'IBS',
        cbs: 'CBS',
      },
      badges: {
        launched: 'Launched',
        notLaunched: 'Not launched',
      },
      actions: {
        launchExpense: 'Launch NFe Expense',
        generateDanfe: 'Generate DANFE',
        downloadXml: 'Download XML',
      },
      emptyState: {
        titleNoIssuer: 'Select the Issuer',
        descriptionNoIssuer: 'Select the Issuer to filter and list the received NFS-e.',
        titleEmpty: 'No NFS-e synced yet.',
        descriptionEmpty: 'Use "Search DFe" to sync this Issuer\'s documents.',
        titleFiltered: 'No NFS-e found.',
        descriptionFiltered: 'Try adjusting the filters or the informed period.',
      },
      error: {
        message: 'Could not load the received NFS-e.',
        retry: 'Try again',
      },
      downloadXmlError: 'Could not download this NFS-e XML.',
      downloadXmlSuccess: 'XML downloaded successfully',
      generateDanfeError: 'Could not generate this NFS-e DANFE.',
    },
    filter: {
      title: 'Filter Received NFSe',
      issuer: 'Select the Issuer',
      issuerPlaceholder: 'Search fiscal issuer...',
      issuerRequired: 'Required to list',
      search: 'Search',
      searchPlaceholder: 'Search by provider or Tax ID',
      dateFrom: 'From Date',
      dateTo: 'To Date',
      dateRangeInvalid: 'The end date is earlier than the start date.',
      launched: 'Launched',
      launchedAll: 'All',
      launchedOptions: {
        yes: 'Yes',
        no: 'No',
      },
    },
    syncScreen: {
      pageTitle: 'Search DFe',
      pageSubtitle: 'Query the electronic fiscal documents received by this Issuer.',
      issuer: 'Select the Issuer',
      issuerPlaceholder: 'Search fiscal issuer...',
      issuerRequired: 'Select a Fiscal Issuer',
      submitButton: 'Query DF-e',
      loadingMessage: 'Querying the national webservice... this may take a few seconds or minutes.',
      successToast: 'document(s) synced',
      errorToast: 'Could not query the DF-e for this Issuer.',
      certificateMissingError:
        'This Issuer has no A1 digital certificate registered. Register the certificate to query DF-e.',
      certificateMissingLink: 'Go to the Issuer certificate',
      emptyIssuerState: 'Select an Issuer to query the DF-e.',
      successNone: 'no new NFS-e',
      environmentHomologation: '(homologation)',
      retryButton: 'Try again',
      issuerLink: 'View issuer record',
      timeoutError: 'The query could not be completed in time. Please try again.',
    },
    expenseDraft: {
      successMessage: 'Expense draft calculated successfully',
      noPermissionReason: 'You need permission to create expenses to launch this NFS-e.',
    },
  },
  parameterWeight: {
    singularLabel: 'Weight Parameter',
    pluralLabel: 'Weight Parameters',
    list: {
      pageTitle: 'Weight Parameters',
      pageSubtitle: 'Manage the weight ranges used in herd management.',
      deletedToast: 'Weight parameter removed successfully',
      table: {
        code: 'Code',
        description: 'Description',
        date: 'Date',
        info: 'Weight Range',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No weight parameter registered.',
        descriptionEmpty: 'Start by adding the first weight range.',
        titleFiltered: 'No parameter found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Weight Parameter',
      },
    },
    filter: {
      title: 'Filter weight parameters',
      search: 'Search',
      searchPlaceholder: 'Search by description or code',
      dateFrom: 'From',
      dateTo: 'To',
      dateRangeInvalid: 'The end date must be equal to or after the start date',
    },
    deleteBlocked: {
      title: 'Cannot delete',
      description:
        'There are records linked to this weight parameter. Remove or reassign the links below before deleting',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        batches: 'Linked batch(es)',
      },
    },
    form: {
      title: {
        create: 'New Weight Parameter',
        edit: 'Edit Weight Parameter',
      },
      subtitle: {
        create: 'Register a new weight range for herd management.',
        edit: 'Update the weight range data.',
      },
      fields: {
        description: 'Description',
        date: 'Date',
        initialWeight: 'Initial Weight',
        finalWeight: 'Final Weight',
        code: 'Code',
        employee: 'Responsible',
        responsible: 'Responsible',
      },
      placeholders: {
        description: 'E.g.: Calf - Weaning',
      },
      hints: {
        codeAutoGenerated: 'The code will be generated automatically when saving.',
        employeeHistoric: 'Responsible (historic): {name}',
      },
      validation: {
        dateInvalid: 'Enter a valid date',
        dateRequired: 'Date is required',
        dateOutOfRange: 'The date must be between 01/01/1900 and 12/31/2100',
        weightInvalid: 'Enter a valid weight',
        weightRequired: 'Weight is required',
        weightMin: 'Weight cannot be negative',
        finalWeightMustBeGreater: 'Final weight must be greater than initial weight',
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 40 characters',
      },
    },
  },
  paymentTerm: {
    singularLabel: 'Payment Term',
    pluralLabel: 'Payment Terms',
    list: {
      pageTitle: 'Payment Terms',
      pageSubtitle: 'Manage the payment terms used in accounts payable and receivable.',
      deletedToast: 'Payment term removed successfully',
      table: {
        description: 'Description',
        condition: 'Condition',
        type: 'Type',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: { edit: 'Edit', delete: 'Delete' },
      emptyState: {
        titleEmpty: 'No payment terms registered.',
        descriptionEmpty: 'Start by adding your first payment term.',
        titleFiltered: 'No payment terms found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Payment Term',
      },
    },
    filter: {
      title: 'Filter payment terms',
      search: 'Search',
      searchPlaceholder: 'Search by description',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: { active: 'Active', inactive: 'Inactive' },
      type: 'Type',
      typeAll: 'All',
      typeOptions: { purchase: 'Purchase', sale: 'Sale', both: 'Both' },
    },
    form: {
      title: { create: 'New Payment Term', edit: 'Edit Payment Term' },
      subtitle: {
        create: 'Register a new payment term for use in accounts payable and receivable.',
        edit: 'Update the payment term data.',
      },
      fields: {
        description: 'Description',
        condition: 'Condition (days)',
        type: 'Type',
        isEnabled: 'Status',
        outDay: 'Out day',
      },
      placeholders: { description: 'E.g.: 30/60/90 days', condition: 'E.g.: 10,20,30' },
      typeOptions: { purchase: 'Purchase', sale: 'Sale', both: 'Both' },
      outDayOptions: { yes: 'Yes', no: 'No' },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
        conditionRequired: 'Condition is required',
        conditionMaxLength: 'Condition must be at most 100 characters',
        conditionInvalid: 'Please follow the comma-separated days pattern: 10,20,30.',
        typeRequired: 'Type is required',
      },
    },
  },
  // Base Registrations — Settings — Permissions (Permission, execution 032,
  // TASK-FE-2400/2404). 4 screens: List (optional search, contract §7.2) +
  // Create/Edit (2 fields) + Detail (4 fields, faithful to `show.blade.php`).
  permission: {
    singularLabel: 'Permission',
    pluralLabel: 'Permissions',
    list: {
      pageTitle: 'Permissions',
      pageSubtitle: 'Manage the system permission catalog.',
      deletedToast: 'Permission removed successfully',
      table: { name: 'Name', description: 'Description' },
      actions: { view: 'View', edit: 'Edit', delete: 'Delete' },
      emptyState: {
        titleEmpty: 'No permissions registered.',
        descriptionEmpty: 'Start by registering the first permission.',
        titleFiltered: 'No permissions found.',
        descriptionFiltered: 'Try adjusting the search terms.',
        cta: 'New Permission',
      },
      search: { placeholder: 'Search by name or description...' },
    },
    form: {
      title: { create: 'New Permission', edit: 'Edit Permission' },
      subtitle: {
        create: 'Register a new permission.',
        edit: 'Update the permission data.',
      },
      fields: { name: 'Name', description: 'Description' },
      validation: {
        nameRequired: 'Name is required',
        nameMaxLength: 'Name must be at most 60 characters',
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 191 characters',
      },
    },
    detail: {
      pageTitle: 'Permission',
      fields: {
        name: 'Name',
        description: 'Description',
        createdAt: 'Created At',
        updatedAt: 'Updated At',
      },
      actions: { edit: 'Edit' },
      notFound: {
        title: 'Permission not found',
        description: 'The requested permission does not exist or was removed.',
        back: 'Back',
      },
    },
  },
  // Base Registrations — Settings — Terms and Conditions (PlatformDocument,
  // execution 032, TASK-FE-2500/2501/2502). SINGLE screen (singleton
  // settings-form, NO list, NO `/new`/`:uuid`) — 2 independent cards
  // ("AGRO365 Terms of Use" / "AGRO365 Privacy Policy"), each with its own
  // upload + metadata + "Save" button.
  platformDocuments: {
    singularLabel: 'Terms and Conditions',
    page: {
      title: 'Terms and Conditions',
      subtitle: 'Manage the institutional PDF documents shown to users.',
    },
    cards: {
      termsOfUse: {
        title: 'AGRO365 Terms of Use',
        uploadHint: 'Attach as PDF. Max. 2MB.',
        uploadedAt: 'Uploaded on {date}',
        uploadedAtWithAuthor: 'Uploaded on {date} by {author}',
        emptyState: 'No document uploaded yet.',
      },
      privacyPolicy: {
        title: 'AGRO365 Privacy Policy',
        uploadHint: 'Attach as PDF. Max. 2MB.',
        uploadedAt: 'Uploaded on {date}',
        uploadedAtWithAuthor: 'Uploaded on {date} by {author}',
        emptyState: 'No document uploaded yet.',
      },
    },
    errors: {
      loadFailed: {
        title: 'Unable to load the documents',
        description: 'Please try again in a few moments.',
      },
    },
  },
  reversalExpense: {
    singularLabel: 'Reversal',
    pluralLabel: 'Reversals',
    list: {
      pageTitle: 'Reversal',
      pageSubtitle:
        'Manage the reversal types used to classify ancillary charges of Billing and Transfer.',
      deletedToast: 'Reversal removed successfully',
      table: {
        description: 'Description',
        useKg: 'Uses Kg',
        isEnabled: 'Status',
        value: 'Value',
        active: 'Active',
        inactive: 'Inactive',
        yes: 'Yes',
        no: 'No',
      },
      actions: { edit: 'Edit', delete: 'Delete' },
      emptyState: {
        titleEmpty: 'No reversals registered.',
        descriptionEmpty: 'Start by adding your first reversal.',
        titleFiltered: 'No reversals found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add Reversal',
      },
    },
    filter: {
      title: 'Filter reversals',
      search: 'Search',
      searchPlaceholder: 'Search by description',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: { active: 'Active', inactive: 'Inactive' },
    },
    form: {
      title: { create: 'New Reversal', edit: 'Edit Reversal' },
      subtitle: {
        create: 'Register a new reversal type.',
        edit: 'Update the reversal data.',
      },
      fields: { description: 'Description', isEnabled: 'Status', value: 'Value', useKg: 'Uses Kg' },
      placeholders: { description: 'E.g.: DARF Reversal' },
      useKgOptions: { yes: 'Yes', no: 'No' },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must have at most 30 characters',
        valueRequired: 'Value is required',
        valueInvalid: 'Enter a valid numeric value',
        valueMin: 'Value cannot be negative',
      },
    },
  },
  serviceExpense: {
    singularLabel: 'Service',
    pluralLabel: 'Services',
    list: {
      pageTitle: 'Services',
      pageSubtitle:
        'Manage the service types used to classify ancillary charges of Billing and Transfer.',
      deletedToast: 'Service removed successfully',
      table: {
        description: 'Description',
        useKg: 'Uses Kg',
        isEnabled: 'Status',
        payTeam: 'Team Payment',
        hasCommission: 'Has Commission',
        value: 'Value',
        active: 'Active',
        inactive: 'Inactive',
        yes: 'Yes',
        no: 'No',
      },
      actions: { edit: 'Edit', delete: 'Delete' },
      emptyState: {
        titleEmpty: 'No services registered.',
        descriptionEmpty: 'Start by adding your first service.',
        titleFiltered: 'No services found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add Service',
      },
    },
    filter: {
      title: 'Filter services',
      search: 'Search',
      searchPlaceholder: 'Search by description',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: { active: 'Active', inactive: 'Inactive' },
    },
    form: {
      title: { create: 'New Service', edit: 'Edit Service' },
      subtitle: {
        create: 'Register a new service type.',
        edit: 'Update the service data.',
      },
      fields: {
        description: 'Description',
        isEnabled: 'Status',
        value: 'Reference Value',
        useKg: 'Uses Kg',
        payTeam: 'Team Payment',
        hasCommission: 'Has Commission',
        commission: 'Commission(%)',
      },
      placeholders: { description: 'E.g.: Tree pruning' },
      useKgOptions: { yes: 'Yes', no: 'No' },
      payTeamOptions: { yes: 'Yes', no: 'No' },
      hasCommissionOptions: { yes: 'Yes', no: 'No' },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must have at most 30 characters',
        valueRequired: 'Value is required',
        valueInvalid: 'Enter a valid numeric value',
        valueMin: 'Value cannot be negative',
        commissionRequired: 'Commission is required',
        commissionInvalid: 'Enter a valid numeric value',
        commissionMin: 'Commission cannot be negative',
      },
    },
  },
  systemUpdate: {
    singularLabel: 'System Update',
    pluralLabel: 'System Updates',
    list: {
      pageTitle: 'System Updates',
      pageSubtitle: 'Manage the announcements and changelog shown to users.',
      deletedToast: 'System update deleted successfully',
      table: {
        releaseDate: 'Release Date',
        description: 'Description',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No system updates registered.',
        descriptionEmpty: 'Start by adding the first announcement.',
        cta: 'New Update',
      },
    },
    form: {
      title: { create: 'New Update', edit: 'Edit Update' },
      subtitle: {
        create: 'Register a new system announcement.',
        edit: 'Update the announcement data.',
      },
      fields: {
        releaseDate: 'Release Date',
        description: 'Description',
      },
      placeholders: {
        description: 'Describe the update...',
      },
      validation: {
        descriptionRequired: 'Description is required',
      },
    },
    detail: {
      pageTitle: 'System Update',
      fields: {
        releaseDate: 'Release Date',
        description: 'Description',
      },
      actions: {
        edit: 'Edit',
      },
      notFound: {
        title: 'Update not found',
        description: 'The requested system update does not exist or was removed.',
        back: 'Back',
      },
    },
    pendingModal: {
      title: 'System Update',
      dismiss: 'Close',
    },
  },
  // Tenants (Contratante, TASK-TN-FE-01/02) — full CRUD, fidelity to the
  // legacy form `agro365/resources/views/tenants/_forms.blade.php`.
  tenant: {
    singularLabel: 'Tenant',
    pluralLabel: 'Tenants',
    list: {
      pageTitle: 'Tenants',
      pageSubtitle: 'Manage the platform tenants (customers).',
      deletedToast: 'Tenant removed successfully',
      table: {
        nickname: 'Company Name',
        nif: 'Tax ID',
        status: 'Status',
        dueDate: 'Due Date',
        dueDateIndeterminate: 'Undetermined',
      },
      actions: {
        edit: 'Edit',
        view: 'View',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No tenant registered.',
        descriptionEmpty: 'Start by adding the first tenant.',
        titleFiltered: 'No tenant found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Tenant',
      },
      deleteConfirm: {
        title: 'Delete tenant',
        description: 'Are you sure you want to delete the tenant',
        warning:
          'This action is irreversible: the farms and all data linked to this tenant will also be removed.',
      },
    },
    filter: {
      title: 'Filter tenants',
      search: 'Search',
      searchPlaceholder: 'Search by name, company name or tax ID',
      searchMaxLength: 'Search accepts at most 60 characters.',
      status: 'Status',
      statusAll: 'All',
      signature: 'Subscription',
      signatureAll: 'All',
      dueMonth: 'Expiration month',
      dueMonthAll: 'All',
      dueDay: 'Due day',
      dueDayAll: 'All',
      dtAccession: 'Accession date',
      startDate: 'Registered from',
      endDate: 'Registered until',
      role: 'Assignment',
      roleAll: 'All',
      plan: 'Plan',
      planAll: 'All',
      months: {
        january: 'January',
        february: 'February',
        march: 'March',
        april: 'April',
        may: 'May',
        june: 'June',
        july: 'July',
        august: 'August',
        september: 'September',
        october: 'October',
        november: 'November',
        december: 'December',
      },
    },
    status: {
      active: 'Enabled',
      defaulting: 'Defaulting',
      suspended: 'Suspended',
      cancelled: 'Cancelled',
    },
    signature: {
      trial: 'Trial',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      semiannual: 'Semiannual',
      annual: 'Annual',
      biannual: 'Biannual',
      undetermined: 'Undetermined',
    },
    dueDay: {
      dayPrefix: 'Day',
    },
    form: {
      title: {
        create: 'New Tenant',
        edit: 'Edit Tenant',
        view: 'View Tenant',
      },
      subtitle: {
        create: 'Register a new platform tenant.',
        edit: 'Update the tenant data.',
      },
      fields: {
        countryId: 'Country',
        nif: 'Tax ID',
        nickname: 'Company Name',
        name: 'Trade Name',
        email: 'Email',
        phone: 'Phone',
        cellphone: 'Mobile',
        roleId: 'Role',
        planUuid: 'Plan',
        listAllFarms: 'List All Farms',
        qtdFarms: 'Farms Qty.',
        qtdUsers: 'Users Qty.',
        exportXls: 'Export XLS',
        zipCode: 'ZIP Code',
        address: 'Address',
        city: 'City',
        contact: 'Contact',
        contactPhone: 'Contact Phone',
        status: 'Status',
        usesCashBook: 'Uses Cash Book',
        useFiscal: 'Fiscal/Non-Fiscal',
        signature: 'Subscription',
        dtAccession: 'Accession Date',
        dueDate: 'Subscription Due Date',
        dueDay: 'Due Day',
        value: 'Value',
        generateFinancial: 'Generate Financial NFe',
        generateTicket: 'Generate Invoice/Batch',
        cancellationReason: 'Cancellation Reason',
        centers: 'Cost Centers',
        qtdIssuers: 'Issuers Qty.',
        qtdNfe: 'NF-e Qty.',
        qtdCte: 'CT-e Qty.',
        qtdMdfe: 'MDF-e Qty.',
      },
      placeholders: {
        countryId: 'Select the country',
        roleId: 'Select the role',
        planUuid: 'Select the plan',
        city: 'Select the city',
        status: 'Select the status',
        signature: 'Select the subscription',
        dueDay: 'Select the day',
        centersSearch: 'Search cost center',
        zipCode: '00000-000',
      },
      booleanOptions: {
        yes: 'Yes',
        no: 'No',
      },
      centersField: {
        selectAll: 'Select all',
        deselectAll: 'Deselect all',
        selectedCount: 'Selected',
        empty: 'No cost center found.',
      },
      cepAutofill: {
        invalidFormat: {
          title: 'Invalid zip code format.',
          description: 'Enter the full zip code in the 00000-000 format.',
        },
        notFound: {
          title: 'Zip code not found.',
          description: 'Please fill in the address manually.',
        },
        cityNotResolved: {
          title: 'City not resolved automatically',
          description:
            'Address filled in, but the city could not be identified — please select it manually.',
        },
        networkError: {
          title: 'Failed to look up the zip code',
          description: 'We could not look up the zip code right now. Fill in the address manually.',
        },
      },
      nifAutofill: {
        alreadyTenant: {
          title: 'Person is already a tenant',
          description:
            'This person is already registered as a tenant. The data was filled in; review it before saving.',
        },
        cnpjNotFound: {
          title: 'CNPJ not found.',
          description:
            'The tax authority returned no data for this CNPJ. Please fill in the data manually.',
        },
        cnpjUnavailable: {
          title: 'CNPJ lookup unavailable',
          description:
            'We could not reach the tax authority right now. Please fill in the data manually.',
        },
        rateLimited: {
          title: 'Too many lookups in a row',
          description: 'Please wait a moment before looking up another Tax ID.',
        },
        networkError: {
          title: 'Failed to look up the Tax ID',
          description: 'We could not fetch the data right now. Please fill in the data manually.',
        },
      },
      validation: {
        countryIdRequired: 'Country is required',
        nifRequired: 'Tax ID is required',
        nifInvalid: 'Invalid Tax ID',
        nicknameRequired: 'Company name is required',
        nicknameMaxLength: 'Company name must be at most 60 characters',
        nameRequired: 'Trade name is required',
        nameMaxLength: 'Trade name must be at most 30 characters',
        emailRequired: 'Email is required',
        emailInvalid: 'Invalid email',
        emailMaxLength: 'Email must be at most 89 characters',
        zipCodeMaxLength: 'ZIP code must be at most 9 characters',
        cellphoneMaxLength: 'Cellphone must be at most 15 characters',
        contactPhoneMaxLength: 'Contact phone must be at most 15 characters',
        phoneRequired: 'Phone is required',
        phoneMaxLength: 'Phone must be at most 15 characters',
        roleIdRequired: 'Select a role',
        planRequired: 'Select a plan',
        qtdFarmsRequired: 'Farms quantity is required',
        qtdFarmsInvalid: 'Invalid quantity',
        qtdFarmsMin: 'Quantity must be at least 1',
        qtdUsersRequired: 'Users quantity is required',
        qtdUsersInvalid: 'Invalid quantity',
        qtdUsersMin: 'Quantity must be at least 1',
        exportXlsRequired: 'Select an option',
        addressRequired: 'Address is required',
        addressMaxLength: 'Address must be at most 120 characters',
        cityRequired: 'Select a city',
        contactMaxLength: 'Contact must be at most 120 characters',
        statusRequired: 'Select a status',
        useFiscalRequired: 'Select an option',
        signatureRequired: 'Select a subscription',
        dtAccessionRequired: 'Accession date is required',
        dueDateRequired: 'Due date is required',
        dueDayRequired: 'Select the due day',
        valueRequired: 'Value is required',
        valueInvalid: 'Invalid value',
        valueMin: 'Value cannot be negative',
        generateFinancialRequired: 'Select an option',
        generateTicketRequired: 'Select an option',
        cancellationReasonRequired: 'Cancellation reason is required',
        centersRequired: 'Select at least one cost center',
        qtdIssuersRequired: 'Issuers quantity is required',
        qtdIssuersInvalid: 'Invalid quantity',
        qtdIssuersMin: 'Quantity must be at least 1',
        qtdNfeRequired: 'NF-e quantity is required',
        qtdNfeInvalid: 'Invalid quantity',
        qtdNfeMin: 'Quantity must be at least 1',
        qtdCteRequired: 'CT-e quantity is required',
        qtdCteInvalid: 'Invalid quantity',
        qtdCteMin: 'Quantity must be at least 1',
        qtdMdfeRequired: 'MDF-e quantity is required',
        qtdMdfeInvalid: 'Invalid quantity',
        qtdMdfeMin: 'Quantity must be at least 1',
      },
    },
  },
  tenantParameters: {
    singularLabel: 'Settings',
    pluralLabel: 'Settingss',
    form: {
      title: 'Settings',
      subtitle: 'Configure the general parameters of the tenant.',
      sections: {
        fiscais: 'Tax',
      },
      fields: {
        calcIcmsDesonerado: 'ICMS tax-exempt calculation and deduction',
      },
      booleanOptions: {
        yes: 'Yes',
        no: 'No',
      },
      validation: {
        calcIcmsDesoneradoRequired: 'Select an option',
      },
      noFarmSelected: {
        title: 'Select a farm',
        description:
          'Settings are shared across all farms of the tenant, but access requires an active farm to be selected.',
      },
      savedToast: 'Settings updated successfully.',
    },
  },
  typeTitle: {
    singularLabel: 'Title Type',
    pluralLabel: 'Title Types',
    list: {
      pageTitle: 'Title Types',
      pageSubtitle: 'Manage the title types used in financial entries.',
      deletedToast: 'Title type removed successfully',
      table: {
        description: 'Description',
        type: 'Type',
        factor: 'Factor',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No title types registered.',
        descriptionEmpty: 'Start by adding your first title type.',
        titleFiltered: 'No title types found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Title Type',
      },
    },
    filter: {
      title: 'Filter title types',
      search: 'Search',
      searchPlaceholder: 'Search by description',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
      type: 'Type',
      typeAll: 'All',
      typeOptions: {
        payable: 'Payable',
        receivable: 'Receivable',
        both: 'Both',
      },
    },
    form: {
      title: {
        create: 'New Title Type',
        edit: 'Edit Title Type',
      },
      subtitle: {
        create: 'Register a new title type for use in financial entries.',
        edit: 'Update the title type data.',
      },
      fields: {
        description: 'Description',
        type: 'Type',
        factor: 'Factor',
        isEnabled: 'Status',
      },
      placeholders: {
        description: 'E.g.: Invoice, Bill, Check',
      },
      typeOptions: {
        payable: 'Payable',
        receivable: 'Receivable',
        both: 'Both',
      },
      factorOptions: {
        add: 'Add',
        subtract: 'Subtract',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
        typeRequired: 'Type is required',
        factorRequired: 'Factor is required',
      },
    },
  },
  // ============================================
  // Cadastros Base — Pecuários — Lote/Módulo (BatchGrazing, execution 029,
  // TASK-FE-2000) — N:N Batch×Grazing link, NO edit (API has no PUT/PATCH,
  // D1 of the API contract) — row action is View+Delete. Deletion is
  // NON-DESTRUCTIVE (D3/D12 of the API contract — closes the link with an
  // exit record, never erases history), mirror
  // `contrato-fe-convencoes-chokepoints.md §5.1`.
  // ============================================
  batchGrazing: {
    singularLabel: 'Batch / Module',
    pluralLabel: 'Batches / Module',
    list: {
      pageTitle: 'Batch / Module',
      pageSubtitle: 'Manage the links between animal batches and grazing modules.',
      deletedToast: 'Batch/Module link closed successfully',
      table: {
        code: 'Code',
        grazing: 'Module',
        batches: 'Linked Batches',
        date: 'Date',
        employee: 'Responsible',
        animalQuantity: 'Animal Qty',
        uaQuantity: 'AU Qty',
        stockingRate: 'Stocking Rate/AU',
      },
      actions: {
        view: 'View',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No Batch/Module link registered.',
        descriptionEmpty: 'Start by adding your first link.',
        cta: 'New Batch/Module',
      },
    },
    deleteDialog: {
      title: 'Close link',
      description:
        'The link will be closed and an exit record will be kept in the history — no data is deleted',
      warningText:
        'This action is not destructive: the exit history remains available on the record',
      confirm: 'Close link',
    },
    removeBatchDialog: {
      title: 'Remove batch from link',
      description: 'This batch leaves the link, but the exit history is kept — no data is deleted',
      warningText:
        'This action is not destructive: the exit history remains available on the record',
      confirm: 'Remove batch',
    },
    form: {
      title: {
        create: 'New Batch / Module',
      },
      subtitle: {
        create: 'Link one or more batches to a grazing module.',
      },
      fields: {
        code: 'Code',
        date: 'Date',
        employee: 'Responsible',
        grazing: 'Module',
        batches: 'Batch',
        hectares: 'Hectares',
        animalQuantity: 'Animal Qty',
        uaQuantity: 'AU Qty',
        stockingRate: 'Stocking Rate/AU',
      },
      placeholders: {
        code: 'Automatically generated',
        grazing: 'Select the grazing module',
        batches: 'Select one or more batches',
      },
      hints: {
        codeGenerated: 'Automatically generated',
        metricsPending: 'Calculated after saving',
      },
      validation: {
        dateRequired: 'Date is required',
        grazingRequired: 'Module is required',
        batchesRequired: 'Batches are required',
        batchesMin: 'Select at least one batch',
      },
    },
    detail: {
      sections: {
        generalData: 'General Data',
        metrics: 'Metrics',
        batchesLinked: 'Linked Batches',
      },
      fields: {
        code: 'Code',
        grazing: 'Module',
        date: 'Date',
        employee: 'Responsible',
        hectares: 'Hectares',
        animalQuantity: 'Animal Qty',
        uaQuantity: 'AU Qty',
        stockingRate: 'Stocking Rate/AU',
      },
      actions: {
        removeBatch: 'Remove',
        deleteLink: 'Delete link',
      },
      notFound: {
        title: 'Link not found',
        description: 'The Batch/Module link you are looking for does not exist or was removed.',
        back: 'Back',
      },
    },
  },
  // ============================================
  // Cadastros Base — Pecuários — Lote/Área (BatchArea, execution 029,
  // TASK-FE-2100) — structural sibling of BatchGrazing (same anatomy,
  // swapping Module for Area). "AU/Support" exists here (unlike
  // Batch/Module) and is shown LITERALLY (heads/hectare, D9 of the API
  // contract) — unit note tooltip at `hints.uaSupportTooltip`.
  // ============================================
  batchArea: {
    singularLabel: 'Batch / Area',
    pluralLabel: 'Batches / Area',
    list: {
      pageTitle: 'Batch / Area',
      pageSubtitle: 'Manage the links between animal batches and areas.',
      deletedToast: 'Batch/Area link closed successfully',
      table: {
        code: 'Code',
        area: 'Area',
        batches: 'Linked Batches',
        date: 'Date',
        employee: 'Responsible',
        animalQuantity: 'Animal Qty',
        uaQuantity: 'AU Qty',
        stockingRate: 'Stocking Rate/AU',
      },
      actions: {
        view: 'View',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No Batch/Area link registered.',
        descriptionEmpty: 'Start by adding your first link.',
        cta: 'New Batch/Area',
      },
      filter: {
        title: 'Filters',
        batch: 'Batch',
        batchPlaceholder: 'Select the batch',
        area: 'Area',
        areaPlaceholder: 'Select the area',
      },
    },
    deleteDialog: {
      title: 'Close link',
      description:
        'The link will be closed and an exit record will be kept in the history — no data is deleted',
      warningText:
        'This action is not destructive: the exit history remains available on the record',
      confirm: 'Close link',
    },
    removeBatchDialog: {
      title: 'Remove batch from link',
      description: 'This batch leaves the link, but the exit history is kept — no data is deleted',
      warningText:
        'This action is not destructive: the exit history remains available on the record',
      confirm: 'Remove batch',
    },
    form: {
      title: {
        create: 'New Batch / Area',
      },
      subtitle: {
        create: 'Link one or more batches to an area.',
      },
      fields: {
        code: 'Code',
        date: 'Date',
        employee: 'Responsible',
        area: 'Area',
        batches: 'Batch',
        hectares: 'Hectares',
        uaSupport: 'AU/Support',
        animalQuantity: 'Animal Qty',
        uaQuantity: 'AU Qty',
        stockingRate: 'Stocking Rate/AU',
      },
      placeholders: {
        code: 'Automatically generated',
        area: 'Select the area',
        batches: 'Select one or more batches',
      },
      hints: {
        codeGenerated: 'Automatically generated',
        metricsPending: 'Calculated after saving',
        uaSupportTooltip: 'Calculated as heads ÷ hectare, not AU — kept by the owner’s decision.',
      },
      validation: {
        dateRequired: 'Date is required',
        areaRequired: 'Area is required',
        batchesRequired: 'Batches are required',
        batchesMin: 'Select at least one batch',
      },
    },
    detail: {
      sections: {
        generalData: 'General Data',
        metrics: 'Metrics',
        batchesLinked: 'Linked Batches',
      },
      fields: {
        code: 'Code',
        area: 'Area',
        date: 'Date',
        employee: 'Responsible',
        animalQuantity: 'Animal Qty',
        totalWeight: 'Total Weight (kg)',
        averageWeight: 'Average Weight (kg)',
        averageUaPerBatch: 'Total AU/Batch',
        hectares: 'Hectares',
      },
      hints: {
        averageUaPerBatchTooltip: 'Average AU per animal, aggregated.',
      },
      actions: {
        removeBatch: 'Remove',
        deleteLink: 'Delete link',
      },
      notFound: {
        title: 'Link not found',
        description: 'The Batch/Area link you are looking for does not exist or was removed.',
        back: 'Back',
      },
    },
  },
  // ============================================
  // Cadastros Base — Pecuários — Cochos (Trough, execution 029,
  // TASK-FE-2200) — full CRUD (real create/edit, API HAS PUT) + NEW view
  // (cards). Area/Grazing Module/Feedlot Corral location trio with
  // client-side XOR rule and "keep vs. unlink" semantics for the Feedlot
  // Corral (D-FE-1 of the screen contract — explicit "Remove link" button).
  // ============================================
  trough: {
    singularLabel: 'Trough',
    pluralLabel: 'Troughs',
    list: {
      pageTitle: 'Troughs',
      pageSubtitle: 'Manage the troughs used to feed the herd.',
      deletedToast: 'Trough removed successfully',
      table: {
        code: 'Code',
        description: 'Description',
        type: 'Type',
        location: 'Location',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No trough registered.',
        descriptionEmpty: 'Start by adding your first trough.',
        titleFiltered: 'No trough found.',
        descriptionFiltered: 'Adjust the search filters and try again.',
        cta: 'New Trough',
      },
    },
    filter: {
      title: 'Filters',
      search: 'Search',
      searchPlaceholder: 'Search by code, description, area or module',
    },
    typeOptions: {
      covered: 'Covered',
      uncovered: 'Uncovered',
    },
    activeOptions: {
      yes: 'Yes',
      no: 'No',
    },
    form: {
      title: {
        create: 'New Trough',
        edit: 'Edit Trough',
      },
      subtitle: {
        create: 'Register a new trough to feed the herd.',
        edit: 'Update the trough data.',
      },
      fields: {
        code: 'Code',
        type: 'Type',
        description: 'Description',
        totalArea: 'Area (Cm)',
        grazing: 'Grazing Module',
        area: 'Area',
        feedlotCorral: 'Feedlot Corral',
        active: 'Active',
      },
      placeholders: {
        type: 'Select the type',
        description: 'Enter the trough description',
        totalArea: 'Enter the area in cm',
        grazing: 'Select the grazing module',
        area: 'Select the area',
        feedlotCorral: 'Select the feedlot corral',
      },
      hints: {
        codeGenerated: 'Automatically generated',
        locationExclusive:
          'Area and Grazing Module are mutually exclusive — selecting one clears the other.',
        feedlotCorralKeep: 'Leave blank to keep the current feedlot corral.',
      },
      actions: {
        removeFeedlotCorral: 'Remove link',
      },
      validation: {
        typeRequired: 'Type is required',
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
        totalAreaRequired: 'Area is required',
        totalAreaMin: 'Area must be greater than or equal to zero',
        activeRequired: 'Status is required',
      },
    },
    detail: {
      sections: {
        generalData: 'General Data',
        location: 'Location',
      },
      fields: {
        code: 'Code',
        type: 'Type',
        description: 'Description',
        totalArea: 'Area (Cm)',
        area: 'Area',
        grazing: 'Grazing Module',
        feedlotCorral: 'Feedlot Corral',
      },
      emptyLocation: 'No location linked',
      actions: {
        edit: 'Edit',
      },
      notFound: {
        title: 'Trough not found',
        description: 'The trough you are looking for does not exist or was removed.',
        back: 'Back',
      },
    },
  },
  // ============================================
  // Cadastros Base — Pecuários — Bebedouros (DrinkingFountain, execution
  // 029, TASK-FE-2300) — DELTA over Trough (same anatomy): "Volume(L)"
  // label instead of "Area(Cm)" (same physical column `total_area`) + extra
  // optional `length`/"Length(cm)" field. NEW menu item (see
  // navigationTree.ts/navigationPermissions.ts/languageSidebar.ts,
  // `contrato-fe-convencoes-chokepoints.md §7`).
  // ============================================
  drinkingFountain: {
    singularLabel: 'Drinking Fountain',
    pluralLabel: 'Drinking Fountains',
    list: {
      pageTitle: 'Drinking Fountains',
      pageSubtitle: 'Manage the drinking fountains used to feed the herd.',
      deletedToast: 'Drinking fountain removed successfully',
      table: {
        code: 'Code',
        description: 'Description',
        type: 'Type',
        location: 'Location',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No drinking fountain registered.',
        descriptionEmpty: 'Start by adding your first drinking fountain.',
        titleFiltered: 'No drinking fountain found.',
        descriptionFiltered: 'Adjust the search filters and try again.',
        cta: 'New Drinking Fountain',
      },
    },
    filter: {
      title: 'Filters',
      search: 'Search',
      searchPlaceholder: 'Search by code, description, area or module',
    },
    typeOptions: {
      covered: 'Covered',
      uncovered: 'Uncovered',
    },
    activeOptions: {
      yes: 'Yes',
      no: 'No',
    },
    form: {
      title: {
        create: 'New Drinking Fountain',
        edit: 'Edit Drinking Fountain',
      },
      subtitle: {
        create: 'Register a new drinking fountain to feed the herd.',
        edit: 'Update the drinking fountain data.',
      },
      fields: {
        code: 'Code',
        type: 'Type',
        description: 'Description',
        totalArea: 'Volume (L)',
        length: 'Length (cm)',
        grazing: 'Grazing Module',
        area: 'Area',
        feedlotCorral: 'Feedlot Corral',
        active: 'Active',
      },
      placeholders: {
        type: 'Select the type',
        description: 'Enter the drinking fountain description',
        totalArea: 'Enter the volume in liters',
        length: 'Enter the length in cm (optional)',
        grazing: 'Select the grazing module',
        area: 'Select the area',
        feedlotCorral: 'Select the feedlot corral',
      },
      hints: {
        codeGenerated: 'Automatically generated',
        locationExclusive:
          'Area and Grazing Module are mutually exclusive — selecting one clears the other.',
        feedlotCorralKeep: 'Leave blank to keep the current feedlot corral.',
      },
      actions: {
        removeFeedlotCorral: 'Remove link',
      },
      validation: {
        typeRequired: 'Type is required',
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
        totalAreaRequired: 'Volume is required',
        totalAreaMin: 'Volume must be greater than or equal to zero',
        lengthMin: 'Length must be greater than or equal to zero',
        activeRequired: 'Status is required',
      },
    },
    detail: {
      sections: {
        generalData: 'General Data',
        location: 'Location',
      },
      fields: {
        code: 'Code',
        type: 'Type',
        description: 'Description',
        totalArea: 'Volume (L)',
        length: 'Length (cm)',
        area: 'Area',
        grazing: 'Grazing Module',
        feedlotCorral: 'Feedlot Corral',
      },
      emptyLocation: 'No location linked',
      actions: {
        edit: 'Edit',
      },
      notFound: {
        title: 'Drinking fountain not found',
        description: 'The drinking fountain you are looking for does not exist or was removed.',
        back: 'Back',
      },
    },
  },
};
