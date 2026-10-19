// src/constants/languages/languageEnUs/languageRequestQuotations.ts
// English (US) translation of the "Cotações" module (RequestQuotation —
// Administrativo / Suprimentos, esteira 97-Esteiras/035, TASK-CQ-FE-01). See
// `@/@types/language/module-request-quotations` for the full contract.

import { ModuleRequestQuotations } from '@/@types/language/module-request-quotations';

export const languageRequestQuotations: ModuleRequestQuotations = {
  requestQuotation: {
    singularLabel: 'Quotation',
    pluralLabel: 'Quotations',

    form: {
      fields: {
        provider: 'Provider',
        branch: 'Branch',
        requiresFile: 'Require the product technical information',
        note: 'Note',
      },
      placeholders: {
        provider: 'Search a provider',
        branch: 'Select the branch',
        branchNoProvider: 'Select a provider first',
        note: 'Additional notes',
      },
      requiresFileOptions: {
        yes: 'Yes',
        no: 'No',
      },
      validation: {
        providerRequired: 'Provider is required',
        requiresFileRequired: 'Requires File is required',
      },

      createTitle: 'Add Provider',
      editTitle: 'Edit Quotation',
      createdToast: 'Quotation created successfully!',
      updatedToast: 'Quotation updated successfully!',
      errorFallback: 'Could not save the quotation.',
    },

    statusOptions: {
      aguardando: 'Awaiting',
      enviada: 'Sent',
      recebida: 'Received',
    },

    paymentMethodOptions: {
      aVista: 'Cash',
      boleto: 'Bank Slip',
      cartao: 'Card',
      pix: 'Pix',
      cheque: 'Check',
    },

    tab: {
      title: 'Quotations',
      addProviderButton: 'Add Provider',
      sendEmailBatchButton: 'Send Batch E-mail',
      emptyState: {
        title: 'No quotations yet',
        description: 'Add a provider to start quoting this request.',
      },
      card: {
        selectAriaLabel: 'Select quotation',
        fields: {
          creator: 'Responsible',
          totalValue: 'Value',
          netValue: 'Value with Discount',
          saving: 'Saving',
          savingResponsible: 'Saving Responsible',
        },
        actions: {
          view: 'View',
          edit: 'Edit',
          editObservation: 'Edit Observation',
          applySaving: 'Apply Saving',
          sendForAuthorization: 'Send for Authorization',
          delete: 'Delete',
        },
      },
      deleteDialog: {
        title: 'Delete Quotation',
        description: 'Are you sure you want to delete the quotation from',
        warning: 'This action cannot be undone.',
      },
      deletedToast: 'Quotation deleted successfully!',
      deleteErrorFallback: 'Could not delete the quotation.',
    },

    stage: {
      itemsBlock: {
        title: 'Items',
        blockedNotice: 'Inform every product to proceed with the quotation',
        columns: { product: 'Product', quantity: 'Quantity', description: 'Description' },
        saveButton: 'Save',
        savedToast: 'Record updated successfully.',
        errorFallback: 'Could not update the items.',
        quantityRequired: 'This field must be filled in.',
        descriptionRequired: 'This field must be filled in.',
        loadError: 'Could not load the request items.',
        retry: 'Try again',
      },
      providerBoard: {
        title: 'About the provider',
        corporateName: 'Corporate Name',
        tradeName: 'Trade Name',
        email: 'E-mail',
        phone: 'Phone',
        cellphone: 'Mobile',
        city: 'City',
        loading: 'Loading provider data...',
        loadError: 'Could not load the provider data.',
      },
      whatsAppModal: {
        title: 'Send messages',
        column: 'Provider/Seller',
        close: 'Close',
        sendTo: 'Send message to',
        supplierTag: 'Provider',
      },
      separate: {
        title: 'Create Sub Request',
        description:
          'Select the products/services that will go to the sub request. The others stay in this request.',
        requestLabel: 'Request',
        itemsLabel: 'Items',
        searchPlaceholder: 'Search item',
        selectAllLabel: 'Select all',
        deselectAllLabel: 'Deselect all',
        selectedCountLabel: 'Selected',
        emptyLabel: 'No items found.',
        itemsRequired: 'Select at least one item',
        loadError: 'Could not load the request items.',
        retry: 'Try again',
        submit: 'Save',
        successToast: 'Sub request created successfully.',
        createdCode: 'New request code',
      },
      queue: {
        receivedToast: 'Request received successfully.',
        redoTooltip: 'Redo',
      },
    },

    detail: {
      title: 'Quotation Details',
      fields: {
        quotationDate: 'Quotation Date',
        expirationDate: 'Expiration Date',
        providerResponsible: 'Responsible (Provider)',
        observation: 'Provider Observation',
      },
      pendingReceiptNotice:
        'Items and payment methods become available once the provider answers the quotation.',
      itemsSection: {
        title: 'Items',
        empty: 'No items informed.',
        columns: {
          description: 'Description',
          brand: 'Brand',
          quantity: 'Quantity',
          unitaryValue: 'Unit Value',
          total: 'Total',
          observation: 'Observation',
        },
      },
      paymentsSection: {
        title: 'Payment Methods',
        empty: 'No payment method informed.',
        columns: {
          paymentMethod: 'Payment Method',
          installments: 'Installments',
          interval: 'Interval (days)',
          installmentValue: 'Installment Value',
          total: 'Total',
        },
      },
      errorState: {
        title: 'Could not load the quotation',
        description: 'An error occurred while fetching this quotation details.',
        retry: 'Try again',
      },
    },

    saving: {
      title: 'Apply Saving',
      fields: {
        responsible: 'Responsible',
        netValue: 'Value with Discount',
        netValueHelper: 'Final quotation value after the discount negotiated with the provider.',
        savingPreview: 'Saving (%)',
      },
      placeholders: {
        responsible: 'Search a responsible',
      },
      validation: {
        responsibleRequired: 'Responsible is required',
        discountRequired: 'Value with Discount is required',
        discountMin: 'Value with Discount cannot be negative',
        discountMustBeLessThanTotal:
          'Value with Discount must be less than the quotation total value',
      },
      applyButton: 'Apply Saving',
      appliedToast: 'Saving applied successfully!',
      errorFallback: 'Could not apply the saving.',
    },

    authorizer: {
      title: 'Send for Authorization',
      fields: {
        authorizer: 'Authorizer',
      },
      placeholders: {
        authorizer: 'Select an authorizer',
      },
      validation: {
        authorizerRequired: 'Authorizer is required',
      },
      emptyEligibleState: {
        title: 'No eligible authorizer',
        description: 'There are no authorizers available for this request at the moment.',
      },
      loadErrorState: {
        title: 'Could not load the authorizers',
        description: 'An error occurred while fetching the eligible authorizers.',
        retry: 'Try again',
      },
      sendButton: 'Send',
      sentToast: 'Request sent for authorization successfully!',
      errorFallback: 'Could not send for authorization.',
    },

    emailBatch: {
      title: 'Send E-mail in Batch',
      description:
        "Select the recipients for each selected quotation. Quotations with no recipient checked won't receive an e-mail.",
      providerRecipient: {
        label: 'Include provider e-mail',
        noEmailNotice: 'Provider has no e-mail registered.',
      },
      sellers: {
        label: 'Sellers',
        searchPlaceholder: 'Search seller',
        selectAllLabel: 'Select all',
        deselectAllLabel: 'Deselect all',
        selectedCountLabel: 'Selected',
        emptyLabel: 'No seller registered for this provider.',
        loadErrorLabel: "Error loading this provider's sellers.",
        retryLabel: 'Try again',
      },
      noRecipientsSelected: 'No recipient selected — this quotation will not receive an e-mail.',
      emptySelectionError: 'Select a provider.',
      submitButton: 'Send E-mails',
      sentToast: 'E-mails sent successfully',
      errorFallback: 'Could not send the batch e-mails.',
      invalidEmailsError: {
        line: 'Provider {value} has no e-mail registered.',
        title: 'Invalid e-mails found',
        description:
          'One or more selected recipients do not have a valid registered e-mail. Fix the provider/seller record and try again.',
      },
    },

    whatsApp: {
      buttonLabel: 'Send message via WhatsApp',
      messageTitle: 'Quotation request',
      farmLabel: 'Farm',
      purchaseCodeLabel: 'Request code:',
      descriptionLabel: 'Description/Ticket:',
      providerLabel: 'Provider:',
      invitationText:
        'We would like to request a quote for the items listed in the form available at the link at the end of this message.',
      emailAvailableText: 'It is also available at the e-mail',
      fillInstructions:
        'Please fill in the information carefully, the form can only be submitted once.',
      regardsLabel: 'Regards:',
      formLinkLabel: 'Form link:',
      providerMissingError: 'The provider data could not be found.',
    },

    publicForm: {
      pageTitle: 'Quotation Form',
      requestHeader: 'Request No. {code} - {farm}',
      descriptionLabel: 'Description/Ticket:',
      providerLabel: 'Provider:',
      fields: {
        itemProduct: 'Product',
        itemService: 'Services',
        totalValue: 'Total Amt.',
        quotationNote: 'Note',
        quantity: 'Quantity',
        brand: 'Brand',
        unitaryValue: 'Unit Value',
        amount: 'Total Value',
        observation: 'Observation',
        reponsible: 'Responsible (Provider)',
        expirationDate: 'Quotation Expiration Date',
        file: 'Attachment',
      },
      requiresFileAlert:
        'This quotation requires the product technical information attachment to be sent',
      placeholders: {
        brand: 'Product brand',
        observation: 'Notes about this item',
        reponsible: 'Name of who is answering',
      },
      paymentsSection: {
        title: 'Payment Conditions',
        addButton: 'Add Condition',
        removeButton: 'Remove',
        emptyLabel: 'No payment condition informed.',
        cannotRemoveLastRow: 'You must have at least one item in the list',
        incompleteRow: 'Fill in all fields before adding new ones.',
        removeConfirm: {
          title: 'Are you sure?',
          text: 'Do you really want to remove this item?',
        },
        fields: {
          paymentMethod: 'Payment Method',
          installments: 'Installments',
          interval: 'Interval (days)',
          total: 'Total Value',
          amount: 'Amount/Installment',
        },
        placeholders: {
          paymentMethod: 'Select the payment method',
        },
      },
      fileUpload: {
        dropzoneTitle: 'Drag a file or click to select',
        dropzoneDraggingTitle: 'Drop the file here',
        changeFileLabel: 'Change file',
        removeFileLabel: 'Remove file',
        replaceFileLabel: 'Replace file',
        existingFileLabel: 'Current file',
        errorTypeMessage: 'File type not accepted. Please upload a PDF.',
        errorSizeMessage: 'File exceeds the maximum allowed size (20MB).',
      },
      validation: {
        reponsibleRequired: 'Responsible is required',
        reponsibleMax: 'Responsible must be at most 120 characters',
        expirationDateRequired: 'Expiration Date is required',
        expirationDateInvalid: 'Invalid Expiration Date',
        expirationDateMin: 'Expiration Date cannot be earlier than today',
        fileRequired: 'Attachment is required',
        unitaryValueRequired: 'Unit Value is required',
        brandRequired: 'Brand is required',
        observationMax: 'Observation must be at most 60 characters',
        paymentsMinOne: 'Inform at least one payment condition',
        paymentMethodRequired: 'Payment Method is required',
        installmentsRequired: 'Installments is required',
        installmentsMin: 'Installments must be at least 1',
        intervalRequired: 'Interval is required',
        intervalMin: 'Interval cannot be negative',
        totalValueMin: 'The value must be greater than zero',
      },
      submitButton: 'Submit Quotation',
      submittedToast: 'Quotation submitted successfully!',
      errorFallback: 'Could not submit the quotation.',
      loadingState: 'Loading quotation form...',
      notFoundState: {
        title: 'Form not found',
        description: 'The link you accessed is invalid. Check the link you received and try again.',
      },
      loadErrorState: {
        title: 'Could not load the form',
        description: 'An error occurred while fetching this quotation data.',
        retry: 'Try again',
      },
      alreadySubmittedState: {
        title: 'Quotation Finalized.',
        description: '',
      },
      rateLimitedError: 'Too many attempts in a short time. Please wait a moment and try again.',
    },
  },
};
