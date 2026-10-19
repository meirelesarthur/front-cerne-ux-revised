// src/constants/languages/languageEnUs/languageRequestAuthorizations.ts
// EN-US translation of the "Authorization" module (RequestAuthorization —
// Administrativo / Suprimentos, esteira 97-Esteiras/038, TASK-AUTH-FE-01).
// This locale is mandatory: `singularLabel`/`pluralLabel` feed the
// `requestAuthorizations` query keys (src/constants/query-key.ts).

import { ModuleRequestAuthorizations } from '@/@types/language/module-request-authorizations';

export const languageRequestAuthorizations: ModuleRequestAuthorizations = {
  requestAuthorization: {
    singularLabel: 'Authorization',
    pluralLabel: 'Authorizations',
    titleModule: 'Authorization',
    pageTitle: 'Authorization',
    pageSubtitle: 'Purchase requests awaiting approval or acknowledgement.',

    list: {
      table: {
        code: 'Code',
        status: 'Status',
        requestDate: 'Request Date',
        description: 'Description/Ticket',
        duration: 'Duration',
        requester: 'Requester',
        responsible: 'Current Responsible',
        farm: 'Farm',
        actions: {
          view: 'View',
        },
      },
      emptyState: {
        titleEmpty: 'No authorization pending',
        titleFiltered: 'No request found',
        descriptionEmpty: 'Requests awaiting approval or acknowledgement will appear here.',
        descriptionFiltered: 'Adjust the filters to find what you are looking for.',
      },
    },

    filter: {
      title: 'Filter Authorizations',
      search: 'Search',
      searchPlaceholder: 'Search by description/ticket/code',
      type: 'Type',
      status: 'Status',
      dateFrom: 'Start date',
      dateTo: 'End date',
    },

    validation: {
      finalJustificationRequired: 'Justification is required',
      justifyRequired: 'Justification is required',
      justifyTooLong: 'The justification must be at most 400 characters',
      authorizerRequired: 'Authorizer is required',
      responsibleRequired: 'Responsible is required',
      statusRequired: 'Status is required',
      quantityRequired: 'Quantity is required',
      quantityMin: 'Quantity must be greater than zero',
      commentRequired: 'Comment is required',
      categoryRequired: 'Financial category is required',
      centerRequired: 'Cost center is required',
      percentRequired: 'Percentage is required',
      percentSumInvalid: 'The sum of the apportionment percentages must be 100%',
    },

    detail: {
      approvalTitle: 'Purchase Authorization',
      acknowledgeTitle: 'Acknowledge Receipt',
      errorState: {
        title: 'Could not load the request',
        description: 'Check your connection and try again.',
        retry: 'Try again',
      },

      info: {
        title: 'Request Information',
        code: 'Code',
        requestDate: 'Request Date',
        duration: 'Duration',
        type: 'Type',
        priority: 'Priority',
        nfe: 'NF-e',
        requester: 'Requester',
        responsible: 'Current Responsible',
        justification: 'Justification',
        description: 'Description/Ticket',
        observation: 'Note',
        finalizationNote: 'Final Note',
        quotationJustification: 'Quotation justification',
      },

      attachments: {
        title: 'Attachments',
        empty: 'No attachments.',
      },

      movements: {
        title: 'Movements',
      },

      items: {
        title: 'Items for Approval',
        readOnlyTitle: 'Products/Services',
        hint: 'Select the items you want to authorize for purchase and the quotation you want to approve',
        recordsCount: 'Records:',
        table: {
          select: 'Select',
          product: 'Product',
          service: 'Service',
          serviceDescription: 'Service description',
          description: 'Description',
          name: 'Name',
          quantity: 'Qty',
          value: 'Value',
          dailyQuantity: 'Number of daily rates',
          observation: 'Note',
          actions: 'Actions',
        },
        editButton: 'Edit',
        empty: 'No information registered.',
      },

      editItem: {
        title: 'Edit Item',
        quantityLabel: 'Quantity',
        submit: 'Save',
        toast: 'Item updated successfully.',
      },

      quotations: {
        title: 'Quotations',
        hint: 'Select the payment methods you want from the quotations',
        recordsCount: 'Records:',
        table: {
          select: 'Select',
          date: 'Quotation Date',
          provider: 'Supplier',
          payment: 'Payment method',
          total: 'Total Amt.',
          net: 'Amount with Discount',
          responsible: 'Responsible',
          actions: 'Actions',
        },
        choosePaymentButton: 'Choose the payment method',
        viewButton: 'View',
        empty: 'No information registered.',
        errorState: {
          title: 'Could not load the quotations',
          description: 'Check your connection and try again.',
          retry: 'Try again',
        },
      },

      choosePayment: {
        title: 'Payment methods',
        table: {
          method: 'Payment method',
          installments: 'Installments',
          interval: 'Interval (days)',
          installmentValue: 'Installment Amount',
          total: 'Total',
          actions: 'Actions',
        },
        selectButton: 'Select',
        empty: 'No payment method available for this quotation.',
        selectedToast: 'Payment method selected successfully.',
      },

      ratio: {
        title: 'Allocation',
        classificationLabel: 'Classification',
        classificationHelp:
          'CAPEX: Long-term investments, such as acquiring assets used for more than a year (equipment, buildings, etc.).\nOPEX: Recurring operating expenses, such as salaries, rent, utilities, maintenance and other daily costs.',
        classificationOptions: { N: 'Not Classified', C: 'CAPEX', O: 'OPEX' },
        harvestLabel: 'Harvest',
        harvestPlaceholder: 'Select',
        categoryLabel: 'Category',
        categoryPlaceholder: 'Type at least 3 letters',
        categoryMinChars: 'Type at least 3 letters to search.',
        centerLabel: 'Cost Center',
        centerPlaceholder: 'Select',
        percentLabel: 'Percentage (%)',
        addRowButton: 'Add Item',
        removeRowButton: 'Remove',
        totalLabel: 'Total',
      },

      clientValidation: {
        warningTitle: 'Warning',
        commentRequired: 'Enter a comment',
        quotationRequired: 'Select at least one quotation',
        itemsRequired: 'You must select the items to authorize.',
        singleItemQuotations: 'Only one quotation can be selected to authorize a single item per request.',
        ratioSumInvalid: 'The sum of the Allocation percentages must be equal to 100.',
        categoryRequired: 'Select a category',
        centerRequired: 'Select a cost center',
        ratioOverflow: 'The sum of the percentage values exceeds 100%.',
      },

      justify: {
        label: 'Add Comment/Justification',
        addComment: 'Add Comment',
        commentToast: 'Comment added successfully.',
      },

      actions: {
        updateToast: 'Record updated successfully.',
        transfer: 'Transfer Responsible',
        transferToast: 'Request changed successfully.',
        back: 'Step Back',
        next: 'Next Step',
        reject: 'Reject',
        autoPromoteError: 'Could not update the request automatically. Reload the page.',
      },
    },

    sendForAuthorization: {
      title: 'Send for Authorization',
      authorizerLabel: 'Authorizer',
      authorizerPlaceholder: 'Select',
      justifyLabel: 'Comment/Justification',
      emptyEligibleState: {
        description: 'No eligible authorizer at the moment for this request.',
      },
      sendButton: 'Send',
    },
  },
};
