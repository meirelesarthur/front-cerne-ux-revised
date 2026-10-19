// src/constants/languages/languageEnUs/languageRequestPurchases.ts
// EN-US translation of the "Purchase Request" module (RequestPurchase —
// Administrative / Procurement, pipeline 97-Esteiras/022, TASK-RP-FE-03). See
// `@/@types/language/module-request-purchases` for the full contract.

import { ModuleRequestPurchases } from '@/@types/language/module-request-purchases';

export const languageRequestPurchases: ModuleRequestPurchases = {
  requestPurchase: {
    singularLabel: 'Purchase Request',
    pluralLabel: 'Purchase Requests',
    titleModule: 'Purchase Requests',

    // ADDITIVE (TASK-CQ-FE-15) — see note in
    // `ModuleRequestPurchases.requestPurchase.legend`.
    legend: {
      label: 'Legend',
    },

    list: {
      pageTitle: 'Purchase Requests',
      pageSubtitle: 'Manage the farm purchase requests.',
      table: {
        code: 'Code',
        type: 'Type',
        requestDate: 'Order Date',
        justification: 'Description/Ticket',
        duration: 'Duration',
        requester: 'Requester',
        responsible: 'Current Responsible',
        farm: 'Farm',
        status: 'Status',
        priority: 'Priority',
        quotations: 'Quotes',
        actions: {
          view: 'View',
          edit: 'Edit',
          delete: 'Delete',
        },
      },
      emptyState: {
        titleEmpty: 'No requests registered',
        titleFiltered: 'No requests found',
        descriptionEmpty: 'Register the first Purchase Request.',
        descriptionFiltered: 'Adjust the filters to find what you are looking for.',
        cta: 'New Request',
      },
      deletedToast: 'Record deleted successfully.',
      deleteConfirm: {
        title: 'Are you sure?',
        description: 'Once deleted, you will not be able to recover this item!',
        confirm: 'Delete',
        cancel: 'Cancel',
      },
    },

    filter: {
      title: 'Filter Requests',
      search: 'Search',
      searchPlaceholder: 'Search by justification',
      type: 'Type',
      status: 'Status',
      dateFrom: 'Start date',
      dateTo: 'End date',
      farm: 'Farm',
      requester: 'Requester',
      priority: 'Priority',
      responsible: 'Responsible',
    },

    form: {
      title: {
        create: 'New Purchase Request',
        edit: 'Edit Purchase Request',
        view: 'View Purchase Request',
      },
      subtitle: {
        create: 'Register a new purchase request.',
        edit: 'Update the purchase request data.',
        view: 'View the purchase request data.',
      },
      tabs: {
        general: 'General Data',
        items: 'Items',
        attachments: 'Attachments',
        history: 'History',
        quotations: 'Quotations',
      },
      fields: {
        type: 'Type',
        requestDate: 'Order Date',
        justification: 'Justification',
        description: 'Description/Ticket',
        priority: 'Priority',
        authorizer: 'Supervisor',
        harvest: 'Harvest',
        nfe: 'Invoice',
        observation: 'Observation',
        code: 'Code',
        requester: 'Requester',
      },
      placeholders: {
        type: 'Select the type',
        justification: 'Describe the reason for the request',
        description: 'Describe the request details',
        authorizer: 'Select the supervisor',
        harvest: 'Search a harvest',
        nfe: 'Invoice number',
        observation: 'Additional notes',
      },
      itemsSection: {
        addButton: '+ Add Item',
        removeButton: 'Remove',
        emptyLabel: 'No item added',
        fields: {
          product: 'Product',
          quantity: 'Quantity',
          amount: 'Amount',
          name: 'Name',
          nif: 'CPF',
          phone: 'Phone',
          description: 'Description',
          observation: 'Observation',
          serviceDescription: 'Service Description',
          contractServiceDescription: 'Service description',
          dailyQuantity: 'Daily Quantity',
          deliveryDate: 'Delivery Date',
        },
      },
      attachmentsSection: {
        addButton: '+ Add Attachment',
        removeButton: 'Remove',
        emptyLabel: 'No attachment added',
        fields: {
          name: 'Attachment Description',
          file: 'File',
        },
        // ADDITIVE (TASK-RP-FE-07) — see note in
        // `@/@types/language/module-request-purchases`.
        fileUpload: {
          dropzoneTitle: 'Drag a file or click to select',
          dropzoneDraggingTitle: 'Drop the file here',
          changeFileLabel: 'Change file',
          removeFileLabel: 'Remove file',
          replaceFileLabel: 'Replace file',
          existingFileLabel: 'Current file',
          errorTypeMessage: 'File type not accepted.',
          errorSizeMessage: 'File exceeds the maximum size.',
        },
      },
      historySection: {
        emptyLabel: 'No movement registered',
        columns: {
          status: 'Status',
          justify: 'Description/Justification',
          user: 'Responsible',
          date: 'Date',
          elapsed: 'Time Spent',
        },
      },
      guards: {
        addBlockedTitle: 'Attention',
        addBlockedDescription: 'Fill in all fields before adding new ones.',
        removeConfirmTitle: 'Are you sure?',
        removeConfirmDescription: 'Do you really want to remove this item?',
        removeConfirm: 'Remove',
        removeCancel: 'Cancel',
        lastItemTitle: 'Attention',
        lastItemDescription: 'You must have at least one item in the list',
        productAdd: 'Register product',
        productEdit: 'Edit product',
      },
      viewSections: {
        classification: 'Classification',
        classificationOptions: { N: 'Not Classified', C: 'CAPEX', O: 'OPEX' },
        financialDueDate: 'Financial Due Date',
        finalizationNote: 'Final Note',
        responsible: 'Current Responsible',
        duration: 'Duration',
        priority: 'Priority',
        type: 'Type',
        authorizationTitle: 'Authorization',
        authorizationDate: 'Authorization Date',
        finalJustification: 'Approval Comment',
        authorizer: 'Authorizer',
        receiptTitle: 'Receipt',
        receiptDate: 'Receipt Date',
        receiptNote: 'Receipt Note',
        childrenTitle: 'Sub Requests',
        ratioTitle: 'Apportionment',
        ratioCategory: 'Category',
        ratioCenter: 'Cost Center',
        ratioPercent: 'Percentage',
        approvedQuotationTitle: 'Approved Quotation',
        notInformed: 'Not informed',
      },
      // ADDITIVE (TASK-RP-FE-09) — see note in
      // `@/@types/language/module-request-purchases`.
      hints: {
        typeLockedOnEdit:
          'The type cannot be changed after the request is created (business rule, not a permission issue).',
        authorizerLoadError: 'Could not load the supervisors.',
        codePreview: 'Expected code; the final one is assigned on save.',
        codePreviewUnavailable: 'Could not calculate the expected code.',
      },
      validation: {
        typeRequired: 'Type is required',
        requestDateRequired: 'Request Date is required',
        justificationRequired: 'Justification is required',
        justificationMaxLength: 'Justification must be at most 800 characters',
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 800 characters',
        itemsMinOne: 'Add at least one item',
        productRequiredForType: 'Product is required for this request type',
        quantityRequiredForType: 'Quantity is required for this request type',
        amountRequiredForType: 'Amount is required for this request type',
        nameRequiredForType: 'Name is required for this request type',
        nifRequiredForType: 'NIF is required for this request type',
        phoneRequiredForType: 'Phone is required for this request type',
        descriptionRequiredForType: 'Description is required for this request type',
        serviceDescriptionRequiredForType: 'Service Description is required for this request type',
        dailyQuantityRequiredForType: 'Daily Quantity is required for this request type',
        attachmentFileRequiredForType: 'File is required for this request type',
        attachmentNameRequiredWithFile: 'Attachment Description is required when there is a file',
        nifMaxLength: 'NIF must be at most 20 characters',
        phoneMaxLength: 'Phone must be at most 15 characters',
        fileMaxLength: 'File must be at most 10240 KB',
        observationMaxLength: 'Observation must be at most 800 characters',
        itemDescriptionMaxLength: 'Item description must be at most 60 characters',
        itemServiceDescriptionMaxLength: 'Service description must be at most 200 characters',
        itemObservationMaxLength: 'Item observation must be at most 90 characters',
        authorizerRequired: 'Select the Supervisor',
        attachmentsMinOne: 'Add at least one attachment',
        attachmentNameRequiredForType: 'Attachment Description is required for this request type',
        attachmentNameMaxLength: 'Attachment Description must be at most 120 characters',
      },
    },

    actions: {
      receiveToast: 'Request received successfully.',
      transferToast: 'Request transferred successfully.',
      changeStatusToast: 'Status changed successfully.',
      finishToast: 'Request finished successfully.',
      createdWithCodeToast: 'Request {code} created successfully.',
      quotationJustificationToast: 'Quotation justification added successfully.',
      transferJustifyRequired: 'Justification is required to transfer',
      changeStatusRequired: 'Select the new status',
      // ADDITIVE (TASK-RP-FE-09) — see note in
      // `@/@types/language/module-request-purchases`.
      receiveButton: 'Receive',
      transferButton: 'Transfer',
      changeStatusButton: 'Step Back',
      finishButton: 'Finish',
      quotationJustificationButton: 'Quotation Justification',
      transferDialogTitle: 'Transfer Request',
      transferJustifyLabel: 'Transfer Justification',
      changeStatusDialogTitle: 'Change Request Status',
      changeStatusNewStatusLabel: 'New Status',
      changeStatusJustifyLabel: 'Justification',
      quotationJustificationDialogTitle: 'Add Quotation Justification',
      quotationJustificationLabel: 'Quotation Justification',
    },

    typeOptions: {
      produto: 'Product',
      servico: 'Service',
      adiantamento: 'Advance',
      reembolso: 'Reimbursement',
      diaria: 'Daily Rate',
      empreitada: 'Contract Work',
      compraEfetuada: 'Purchase Completed',
      frete: 'Freight',
      manutencao: 'Maintenance',
      emergencial: 'Emergency',
      despesaFixa: 'Fixed Expense',
    },

    statusOptions: {
      solicitacao: 'Request',
      cotacaoEmAndamento: 'Quotation In Progress',
      aguardandoAprovacao: 'Awaiting Approval',
      aguardandoCiencia: 'Awaiting Acknowledgment',
      pedidoNaoAprovado: 'Order Not Approved',
      aguardandoCompra: 'Awaiting Purchase',
      compraEfetuada: 'Purchase Completed',
      compraRecebida: 'Purchase Received',
      pedidoFinalizado: 'Order Finished',
      pedidoCancelado: 'Order Cancelled',
      analisarProcesso: 'Review Process',
    },

    priorityOptions: {
      alta: 'High',
      media: 'Medium',
      baixa: 'Low',
    },

    // ADDITIVE (TASK-RP-FE-02) — `RequestItemStatus` enum labels, see note in
    // `ModuleRequestPurchases.requestPurchase.itemStatusOptions`.
    itemStatusOptions: {
      pendente: 'Pending',
      entregue: 'Delivered',
      cancelado: 'Cancelled',
    },

    // ADDITIVE (TASK-RP-FE-13, GROUP B) — see note in
    // `ModuleRequestPurchases.requestPurchase.myProcesses`.
    myProcesses: {
      titleModule: 'My Processes',
      pageTitle: 'My Processes',
      pageSubtitle: 'Purchase requests under your responsibility.',
      emptyState: {
        titleEmpty: 'No process under your responsibility',
        descriptionEmpty: 'Requests assigned to you will show up here.',
      },
      table: {
        quotationsReceived: 'Received Quotes',
      },
      actions: {
        view: 'View',
        changeStatus: 'Revert Step',
        slaReport: 'SLA Report',
        // ADDENDUM (`TASK-MP-FE-03`) — 2 NEW keys; the other 5 actions of the
        // full dropdown reuse already-existing keys (see note on the type).
        quote: 'Quote Order',
        sendForApproval: 'Send for Approval',
        // ADDENDUM (`TASK-MP-FE-04`) — 2 NEW keys; "Edit" reuses
        // `list.table.actions.edit`, already existing (zero duplication).
        authorize: 'Authorize',
        acknowledge: 'Acknowledge',
      },
    },

    // ADDITIVE (TASK-RP-FE-13, GROUP B) — see note in
    // `ModuleRequestPurchases.requestPurchase.rejected`.
    rejected: {
      titleModule: 'Rejected and Cancelled',
      pageTitle: 'Rejected / Cancelled',
      pageSubtitle: 'Rejected or cancelled purchase requests.',
      emptyState: {
        titleEmpty: 'No rejected or cancelled request',
        descriptionEmpty: 'Rejected or cancelled requests will show up here.',
      },
      actions: {
        slaReport: 'SLA Report',
      },
    },

    // ADDITIVE (TASK-CQ-FE-13) — see note in
    // `ModuleRequestPurchases.requestPurchase.inQuotation`.
    inQuotation: {
      titleModule: 'Quotations',
      pageTitle: 'Quotations',
      pageSubtitle: 'Purchase requests in quotation across the whole farm.',
      emptyState: {
        titleEmpty: 'No request in quotation',
        descriptionEmpty: 'Requests in quotation will show up here.',
      },
    },

    // ADDITIVE (TASK-CPS-FE-01, pipeline 036) — see note in
    // `ModuleRequestPurchases.requestPurchase.inPurchase`.
    inPurchase: {
      titleModule: 'Purchases',
      pageTitle: 'Purchases',
      pageSubtitle: 'Purchase requests being purchased across the whole farm.',
      emptyState: {
        titleEmpty: 'No request being purchased',
        descriptionEmpty: 'Requests being purchased will show up here.',
      },
      table: {
        duration: 'Duration',
      },
      actions: {
        view: 'View Request',
        whatsapp: 'Send via WhatsApp',
        email: 'Send via Email',
        downloadPdf: 'Download PDF',
        sendOrder: 'Send purchase order.',
        informStatus: 'Inform Status',
        createSubRequest: 'Create Sub Request',
        // ADDITIVE (TASK-CPS-FE-06) — dialog reuses `actions.changeStatus*`.
        changeStatus: 'Revert Step',
      },
      dialogs: {
        // ADDITIVE (TASK-CPS-FE-06) — only the empty state is own to this queue.
        changeStatus: {
          noTransitions: 'No status transition available for this request.',
        },
        informStatus: {
          title: 'Inform Purchase Status',
          fields: {
            status: 'Status',
            financialDueDate: 'Financial Due Date',
            justify: 'Notes',
            itemDeliveryDates: 'Item Delivery Dates',
            code: 'Code',
            responsible: 'Responsible',
            itemsTitle: 'Request Items',
            itemColumns: {
              item: 'Item',
              quantity: 'Quantity',
              description: 'Description',
              deliveryDate: 'Delivery Date',
            },
          },
          statusOptions: {
            effected: 'Purchase Completed',
            cancelled: 'Order Cancelled',
          },
          validation: {
            statusRequired: 'Status is required',
            justifyRequired: 'Justification is required',
            justifyMax: 'Justification must be at most 400 characters',
          },
        },
        separate: {
          title: 'Create Sub Request',
          subtitle:
            'Select the quotation and the products/services that will go to the sub request.',
          selectAll: 'Select all',
          deselectAll: 'Deselect all',
          selectedCount: 'items selected',
          itemsMinError: 'Select at least one item',
          confirmButton: 'Create Sub Request',
          headerTitle: 'Order Information',
          observation: 'Notes',
          finalizationNote: 'Final Note',
          movementsTitle: 'Movements',
          quotationsTitle: 'Quotations',
        },
      },
      toasts: {
        informStatusSuccess: 'Record updated successfully.',
        separateSuccess: 'Sub request created successfully.',
        whatsappGenerating: 'Generating WhatsApp link...',
        emailQueued: 'E-mail queued for sending.',
        pdfReady: 'PDF ready for download.',
        actionError: 'Could not complete the action. Please try again.',
      },
    },

    // ADITIVO (execução 081, T-081-FE-01) — ver nota em
    // `ModuleRequestPurchases.requestPurchase.supply`.
    supply: {
      columns: {
        code: 'Code',
        type: 'Type',
        requestDate: 'Request Date',
        description: 'Description/Ticket',
        duration: 'Duration',
        requester: 'Requester',
        responsible: 'Current Responsible',
        responsibleShort: 'Curr. Resp.',
        farm: 'Farm',
        action: 'Action',
        receivedQuotations: 'Quotes Received',
        nfe: 'Invoice No.',
        updatedAt: 'Updated On',
        launched: 'Posted',
      },
      filters: {
        searchPlaceholder: 'Search by description/ticket/code',
        status: 'Status',
        type: 'Type',
        farm: 'Farm',
        requester: 'Requester',
        priority: 'Priority',
        dateStart: 'Request / Start Date',
        dateEnd: 'Request / End Date',
        responsible: 'Current Responsible',
        apply: 'Filter',
        clear: 'Clear',
      },
      list: {
        empty: 'No information registered.',
        recordsCount: 'No. of Records: {total}',
        legend: 'Legend',
        redoIndicator: 'Redo',
      },
      actions: {
        view: 'View',
        slaReport: 'SLA Report',
        edit: 'Edit',
        delete: 'Delete',
        receive: 'Receive Request',
        transfer: 'Transfer Responsible',
        stepBack: 'Go Back a Step',
        quote: 'Quote Order',
        sendToAuthorization: 'Send for Authorization',
        authorize: 'Authorize',
        acknowledge: 'Acknowledge',
        informStatus: 'Inform Status',
        createSub: 'Create Sub Request',
        downloadFile: 'Download File',
        confirmReceipt: 'Confirm Receipt',
        generateFinancial: 'Generate Financial',
        finalize: 'Finalize Order',
        quotationsMap: 'Quotation Map',
      },
      transferDialog: {
        title: 'Transfer Responsible',
        newResponsible: 'New Responsible',
        newResponsiblePlaceholder: 'Select',
        justify: 'Justification',
        required: 'This field is required.',
        noUsers: 'No users available',
        loadError: 'Could not load the users.',
        retry: 'Try again',
        success: 'Request changed successfully.',
      },
      stepBackDialog: {
        title: 'Go Back a Step on the Request',
        code: 'Code',
        requestDate: 'Request Date',
        duration: 'Duration',
        requester: 'Requester',
        farm: 'Farm',
        currentStatus: 'Current Status',
        newStatus: 'Change to Status',
        newStatusPlaceholder: 'Select',
        justify: 'Justification',
        justifyRequired: 'The justification is required.',
        noTransitions: 'No previous step available for this request.',
        loadError: 'Could not load the users.',
        retry: 'Try again',
        success: 'Status updated successfully!',
        error: 'An error occurred while updating the request status!',
        cancel: 'Cancel',
        save: 'Save',
      },
      deniedModal: {
        title: 'Your request(s) were denied:',
        link: 'Click here to see',
        close: 'Close',
      },
      quotationsMap: {
        button: 'Quotation Map',
        downloading: 'Generating the Quotation Map...',
        success: 'Quotation Map generated successfully.',
        filename: 'quotation-map.xlsx',
      },
    },
  },
};
