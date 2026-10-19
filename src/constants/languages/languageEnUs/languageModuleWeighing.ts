// src/constants/languages/languageEnUs/languageModuleWeighing.ts
// Tradução EN-US do módulo PESAGEM RODOVIÁRIA (ModuleWeighing — Operacional,
// execução 044, F-045, TASK-MWG-FE-01). Mirror EXATO da estrutura de
// `languagePtBr/languageModuleWeighing.ts` — ver aquele arquivo para o
// racional completo. `singularLabel`/`pluralLabel` deste idioma alimentam a
// `queryKey.moduleWeighing.*` (padrão canônico, chave em inglês).

import { ModuleModuleWeighing } from '@/@types/language/module-module-weighing';

export const languageModuleWeighing: ModuleModuleWeighing = {
  moduleWeighing: {
    singularLabel: 'Road Weighing',
    pluralLabel: 'Road Weighings',
    titleModule: 'Road Weighing',
    common: {
      table: {
        actions: 'Actions',
      },
      toast: {
        deleteSuccess: 'Road weighing deleted successfully.',
      },
      deleteDialog: {
        title: 'Confirm deletion',
        descriptionTemplate:
          'Road weighing {code} will be permanently deleted. This action cannot be undone.',
      },
      buttons: {
        new: 'New Weighing',
        save: 'Save',
        cancel: 'Cancel',
      },
      status: {
        preCadastro: 'Pre-Registration',
        pesagemInicial: 'Initial Weighing',
        classificacao: 'Classification',
        pesagemFinal: 'Final Weighing',
        finalizado: 'Finished',
      },
      type: {
        vendaSaida: 'Sale/Outbound',
        compraEntrada: 'Purchase/Inbound',
        avulsa: 'Standalone',
        entradaColheita: 'Harvest Inbound',
        entradaTerceiros: 'Third-Party Inbound',
      },
      category: {
        externa: 'External',
        interna: 'Internal',
      },
    },
    list: {
      pageTitle: 'Road Weighing',
      pageSubtitle: 'Manage the farm road weighings.',
      reportButton: 'Report',
      table: {
        status: 'Status',
        code: 'Code',
        responsible: 'Responsible',
        date: 'Date',
        warehouse: 'Warehouse',
        product: 'Product',
        type: 'Type',
        category: 'Category',
      },
      actions: {
        edit: 'Edit',
        nextStep: 'Next Step',
        finalize: 'Finalize',
        issueNfe: 'Issue Invoice',
        issueTransfer: 'Issue Transfer Note',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No road weighing registered.',
        descriptionEmpty: 'Start by adding the first weighing.',
        titleFiltered: 'No record found.',
        descriptionFiltered: 'Try adjusting the filters.',
      },
      filter: {
        title: 'Filter weighings',
        responsible: 'Responsible',
        equipment: 'Equipment',
        warehouse: 'Warehouse',
        product: 'Product',
        provider: 'Provider',
      },
      deleteDialog: {
        title: 'Confirm deletion',
        descriptionTemplate:
          'Weighing {code} will be permanently deleted. This action cannot be undone.',
      },
      error: {
        message: 'Could not load the data.',
        retry: 'Try again',
      },
      legend: {
        label: 'Legend',
      },
    },
    create: {
      title: {
        create: 'New Road Weighing',
        edit: 'Edit Road Weighing',
      },
      fields: {
        code: 'Code',
        date: 'Date',
        product: 'Product',
        measurement: 'Measurement',
        area: 'Area',
        warehouse: 'Warehouse',
        equipment: 'Equipment/Vehicle',
        provider: 'Driver',
        providerBuy: 'Provider',
        client: 'Client',
        farmTo: 'Destination farm',
        employee: 'Responsible',
        hasClassification: 'Classify by quality?',
        discountTable: 'Discount table',
        providerLot: 'Provider lot',
        expirationDate: 'Expiration date',
        note: 'Note',
        type: 'Type',
        category: 'Category',
      },
      hints: {
        codeGeneratedOnSave: 'Generated automatically',
      },
      validation: {
        requiredField: 'Required field.',
        clientRequired: 'Client is required for external Sale/Outbound or Third-Party Inbound.',
        providerBuyRequired: 'Provider is required for external Purchase/Inbound.',
        farmToRequired: 'Destination farm is required for internal weighing.',
        expirationDateRequired: 'Expiration date is required for products with lot control.',
      },
      toasts: {
        createdSuccess: 'Road weighing created successfully.',
        updatedSuccess: 'Road weighing updated successfully.',
      },
      duplicateLotWarning: 'This lot was already used in another recent weighing.',
    },
    wizard: {
      stepCounter: {
        label: 'Step',
        of: 'of',
      },
      footer: {
        back: 'Back',
        next: 'Next',
      },
      fields: {
        grossWeight: 'Gross Weight',
        tareWeight: 'Tare',
        netWeightPreview: 'Net Weight (preview)',
        warehouse: 'Warehouse',
      },
      stepTitles: {
        tare: 'Vehicle Tare',
        gross: 'Total Weight',
      },
      validation: {
        requiredField: 'Required field.',
        weightRange: 'Enter a valid weight (greater than zero).',
        netWeightNegative: 'Net weight cannot be negative.',
      },
      toasts: {
        advancedSuccess: 'Step recorded successfully.',
      },
    },
    classification: {
      discountTable: 'Discount table',
      keys: {
        impureza: 'Impurity',
        umidade: 'Moisture',
        quebrado: 'Broken',
        esverdeado: 'Greenish',
        avariado: 'Damaged',
        taxaRecepcao: 'Reception rate',
      },
      percentLabel: '%',
      appliedLabel: 'Apply',
      appliedManualLabel: 'Applied discount (%)',
      discountPreviewTitle: 'Discount preview',
      discountPreviewTotal: 'Total discount (preview)',
      validation: {
        percentRange: 'Percentage must be between 0 and 100.',
      },
    },
    finish: {
      title: 'Finalize Road Weighing',
      summary: {
        grossWeight: 'Gross Weight',
        tareWeight: 'Tare',
        discount: 'Classification Discount',
        netWeight: 'Net Weight',
      },
      dfeList: {
        title: 'Eligible DFe for linking',
        emptyUnavailable: 'DFe list unavailable at the moment.',
        number: 'Number',
        issuer: 'Issuer',
        issueDate: 'Issue date',
        select: 'Select',
      },
      confirmButton: 'Confirm Finalization',
      toasts: {
        finalizedSuccess: 'Road weighing finalized successfully.',
      },
    },
    report: {
      pageTitle: 'Road Weighing Report',
      pageSubtitle: 'Generate the farm road weighings report.',
      filters: {
        startDate: 'Start date',
        endDate: 'End date',
        type: 'Type',
        category: 'Category',
        warehouse: 'Warehouse',
        product: 'Product',
        client: 'Client',
      },
      exportPdfButton: 'Download PDF',
      exportXlsxButton: 'Download Excel',
      toasts: {
        success: 'Report generated successfully.',
        generateError: 'Could not generate the report.',
      },
      validation: {
        startDateRequired: 'Start date is required.',
        endDateRequired: 'End date is required.',
        endDateBeforeStart: 'End date must be on or after the start date.',
      },
      columns: {
        grossOrNetLabel: 'Gross Weight',
      },
    },
    detail: {
      printButton: 'Print',
      fields: {
        code: 'Code',
        date: 'Date',
        product: 'Product',
        grossWeight: 'Gross Weight',
        tareWeight: 'Tare',
        netWeight: 'Net Weight',
        measurement: 'Measurement',
        discount: 'Classification Discount',
        averageCost: 'Average Cost',
        total: 'Total',
      },
      history: {
        title: 'History',
        datetime: 'Date/Time',
        status: 'Status',
        inputType: 'Source',
        inputTypeAuto: 'Automatic',
        inputTypeManual: 'Manual',
      },
      notFound: {
        title: 'Weighing not found',
        description:
          'The requested weighing does not exist or you do not have permission to view it.',
        backAction: 'Back',
      },
    },
    dialogs: {
      warehouse: {},
      product: {},
      equipment: {},
      provider: {},
      client: {},
    },
    scaleConnection: {
      connecting: 'Connecting to the scale...',
      connected: 'Scale connected',
      disconnected: 'Scale disconnected',
      payloadError: 'Could not read the weight from the scale. Type it manually.',
      captureButton: 'Capture weight',
    },
    scaleTutorial: {
      title: 'How to connect the scale',
      helpButton: 'Scale help',
      instructions:
        'Download and install the scale connector on the computer connected to the physical ' +
        'scale. With the connector running, click "Capture weight" on this screen to read the ' +
        'value automatically. If the scale does not connect, you can still type the weight manually.',
      statusLabel: 'Connection status',
      downloadButton: 'Download connector',
    },
  },
};
