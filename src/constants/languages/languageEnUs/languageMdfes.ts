// src/constants/languages/languageEnUs/languageMdfes.ts
// English (US) translation of the "MDFe" module (Mdfe — Fiscal-Transport
// domain, execution 045, Wave 1, TASK-MDFE-FE-01).

import { ModuleMdfes } from '@/@types/language/module-mdfes';

export const languageMdfes: ModuleMdfes = {
  mdfe: {
    titleModule: 'MDFe',
    singularLabel: 'MDFe',
    pluralLabel: 'MDFes',

    list: {
      pageTitle: 'MDFe',
      pageSubtitle: 'Manage Electronic Manifest of Fiscal Documents.',
      deletedToast: 'MDFe removed successfully',
      table: {
        integrationStatus: '',
        numero: '#',
        emissor: 'Issuer',
        dataInicioViagem: 'Trip start date',
        cnpjContratante: 'Contracting CNPJ',
        estado: 'Status',
        quantidadeCarga: 'Cargo qty.',
        valorCarga: 'Cargo value',
        mdfeNumero: 'MDFe number',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
        view: 'View',
        print: 'Print',
      },
      emptyState: {
        titleEmpty: 'No MDFe registered.',
        descriptionEmpty: 'Start by adding the first MDFe.',
        titleFiltered: 'No MDFe found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New MDFe',
      },
      naoEncerradosButton: 'Not closed',
      helpButton: 'Help',
      quotaBlockedMessage:
        'Your monthly MDFe issuance quota has been reached. Contact support to raise the limit.',
      printError: 'Could not generate the MDFe report.',
    },

    filter: {
      title: 'Filter MDFe',
      estado: 'Status',
      estadoAll: 'All',
      dataInicioViagemDe: 'Trip start from',
      dataInicioViagemAte: 'Trip start until',
      emissor: 'Issuer',
      veiculo: 'Vehicle',
    },

    estadoOptions: {
      novo: 'New',
      aprovado: 'Approved',
      rejeitado: 'Rejected',
      cancelado: 'Cancelled',
    },

    cargaPosteriorOptions: {
      yes: 'Yes',
      no: 'No',
    },

    typeEmissionOptions: {
      normal: 'Normal',
      contingencia: 'Contingency',
    },

    tabs: {
      geral: 'General',
      transporte: 'Transport',
      descarga: 'Unloading',
    },

    form: {
      title: { create: 'New MDFe', edit: 'Edit MDFe' },
      editBlockedToast: {
        title: 'Edit blocked',
        description: 'This MDFe can no longer be edited in its current state.',
      },
      subtitle: {
        create: 'Register a new Electronic Manifest of Fiscal Documents.',
        edit: 'Update the MDFe data.',
      },
      fields: {
        ufInicio: 'Start state',
        ufFim: 'End state',
        dataInicioViagem: 'Trip start date',
        cargaPosterior: 'Subsequent load',
        typeEmission: 'Issuance type',
        cnpjContratante: 'Contracting CNPJ',
        quantidadeCarga: 'Cargo quantity',
        valorCarga: 'Cargo value',
        produtoPredNome: 'Predominant product',
        produtoPredNcm: 'NCM',
        produtoPredCodBarras: 'Barcode',
        cepCarrega: 'Loading zip code',
        cepDescarrega: 'Unloading zip code',
        latitudeCarregamento: 'Loading latitude',
        longitudeCarregamento: 'Loading longitude',
        latitudeDescarregamento: 'Unloading latitude',
        longitudeDescarregamento: 'Unloading longitude',
        tpCarga: 'Cargo type',
        seguradoraNome: 'Insurer',
        seguradoraCnpj: 'Insurer CNPJ',
        numeroApolice: 'Policy number',
        numeroAverbacao: 'Endorsement number',
        infoComplementar: 'Additional information',
        infoAdicionalFisco: 'Additional information for tax authority',
        veiculoTracao: 'Traction vehicle',
        veiculoReboque: 'Trailer 1',
        veiculoReboque2: 'Trailer 2',
        veiculoReboque3: 'Trailer 3',
        tpEmit: 'Issuer type',
        tpTransp: 'Carrier type',
        lacRodo: 'Road seal',
        condutorNome: "Driver's name",
        condutorCpf: "Driver's CPF",
      },
      cancelButton: 'Cancel',
      saveDisabledTooltip: {
        prefix: 'To save, fill in: ',
        municipioCarregamento: 'Loading Municipality',
        infoDescarga: 'Unloading Information',
        condutorNome: "Driver's name",
        condutorCpf: "Driver's CPF",
      },
      saveButton: 'Save',
    },

    municipiosCarregamento: {
      sectionTitle: 'Loading cities',
      cidade: 'City',
      addButton: 'Add',
      removeButton: 'Remove',
      emptyText: 'No city added yet.',
      columnCidade: 'City',
    },

    percurso: {
      sectionTitle: 'Route (states)',
      uf: 'State',
      addButton: 'Add',
      removeButton: 'Remove',
      emptyText: 'No route state added yet.',
      columnUf: 'State',
    },

    ciot: {
      sectionTitle: 'CIOTs',
      codigo: 'Code',
      cpfCnpj: 'CPF/CNPJ',
      addButton: 'Add',
      removeButton: 'Remove',
      emptyText: 'No CIOT added yet.',
      stagingMessage: 'Inform code and document',
      columnCodigo: 'Code',
      columnCpfCnpj: 'CPF/CNPJ',
      codeLengthError: 'The CIOT must have exactly 12 numeric digits.',
      requiredForTpEmit:
        'Enter at least one CIOT: required for MDF-e of a transport service provider (issuer type 1 or 3).',
    },

    valePedagio: {
      sectionTitle: 'Toll voucher',
      cnpjFornecedor: 'Supplier CNPJ',
      cnpjFornecedorPagador: 'Paying supplier CNPJ',
      numeroCompra: 'Purchase number',
      valor: 'Amount',
      addButton: 'Add',
      removeButton: 'Remove',
      emptyText: 'No toll voucher added yet.',
      stagingMessage: 'Inform all toll voucher fields',
    },

    payment: {
      sectionTitle: 'Payments',
      responsibleName: "Responsible's name",
      responsibleCpfCnpj: "Responsible's CPF/CNPJ",
      paymentType: 'Payment type',
      componentType: 'Component type',
      amount: 'Amount',
      bankCode: 'Bank',
      agencyCode: 'Branch',
      cnpjIpef: 'IPEF CNPJ',
      pixKey: 'PIX key',
      additionalInfo: 'Additional information',
      addButton: 'Add',
      removeButton: 'Remove',
      emptyText: 'No payment added yet.',
      stagingMessage: 'Inform name, document and amount',
    },

    infoDescarga: {
      sectionTitle: 'Unloading information',
      tpUnidTransp: 'Transport unit type',
      idUnidTransp: 'Identification (plate)',
      quantidadeRateio: 'Apportionment quantity',
      cidade: 'Unloading city',
      chaveNfe: 'NFe key',
      segCodNfe: 'NFe security code',
      chaveCte: 'CTe key',
      segCodCte: 'CTe security code',
      addButton: 'Add',
      removeButton: 'Remove',
      emptyText: 'No unloading added yet.',
      stagingMessage: 'Inform unit type, identification, ratio quantity and city',
      incompletePairMessage: 'Inform the key and the security code together, or leave both blank',
      unidadeCarga: {
        sectionTitle: 'Cargo unit',
        idUnidadeCarga: 'Identification',
        quantidadeRateio: 'Apportionment quantity',
        addButton: 'Add',
        removeButton: 'Remove',
      },
      lacreUnidadeCarga: {
        sectionTitle: 'Cargo unit seal',
        numero: 'Number',
        addButton: 'Add',
        removeButton: 'Remove',
      },
      lacreTransporte: {
        sectionTitle: 'Transport seal',
        numero: 'Number',
        addButton: 'Add',
        removeButton: 'Remove',
      },
    },

    tpEmit: {
      prestadorServico: 'Service provider',
      transportadorProprio: 'Own carrier',
    },

    tpTransp: {
      etc: 'ETC',
      tac: 'TAC',
      ctc: 'CTC',
    },

    tipoCarga: {
      tc01: 'Bulk solid',
      tc02: 'Bulk liquid',
      tc03: 'Refrigerated',
      tc04: 'Containerized',
      tc05: 'General cargo',
      tc06: 'Neobulk',
      tc07: 'Hazardous (bulk solid)',
      tc08: 'Hazardous (bulk liquid)',
      tc09: 'Hazardous (refrigerated)',
      tc10: 'Hazardous (containerized)',
      tc11: 'Hazardous (general cargo)',
    },

    paymentType: {
      pago: 'Paid',
      aPagar: 'Payable',
    },

    componentType: {
      valePedagio: 'Toll voucher',
      impostosTaxas: 'Taxes/Fees',
      despesas: 'Expenses',
      outros: 'Other',
    },

    unidadeTransporte: {
      u1: 'Road tractor',
      u2: 'Road trailer',
      u3: 'Ship',
      u4: 'Barge',
      u5: 'Aircraft',
      u6: 'Rail car',
      u7: 'Other',
    },

    naoEncerrados: {
      pageTitle: 'Open MDFes',
      pageSubtitle: 'Check MDFes not yet closed by issuer.',
      emissorRequired: 'Select an issuer to search.',
      submitButton: 'Search',
      table: {
        chave: 'Key',
        protocolo: 'Protocol',
        mdfeNumero: 'MDFe number',
        createdAt: 'Created at',
      },
      encerrarButton: 'Close',
      encerrarTooltip: 'Available after SEFAZ issuance (Wave 2)',
      emptyState: {
        title: 'No open MDFe found.',
        description: 'Select an issuer and search again.',
      },
    },

    detail: {
      sections: { header: 'MDFe Data' },
      fields: { dataEmissao: 'Issue Date' },
      notFound: {
        title: 'MDFe not found.',
        description: 'The MDFe does not exist or was removed.',
        back: 'Back',
      },
      actions: { edit: 'Edit' },
    },

    emission: {
      panelTitle: 'SEFAZ Issuance',
      emitButton: 'Issue',
      emitSuccessToast: 'MDFe issued successfully.',
      emitGenericError: 'Could not issue the MDFe with SEFAZ.',
      emitModal: {
        title: 'Issue MDFe',
        description:
          'Confirm issuing this MDFe with SEFAZ? This action transmits the document and cannot be undone.',
        confirmButton: 'Confirm Issuance',
        issuerLabel: 'Issuer',
        issuerPlaceholder: 'Select the issuer',
        issuerRequired: 'Select the MDFe issuer',
        noIssuersAvailable: 'No issuer eligible for issuance was found.',
        loadIssuersError: 'Could not load the issuers.',
      },
      cancelButton: 'Cancel MDFe',
      cancelSuccessToast: 'MDFe cancelled successfully.',
      cancelGenericError: 'Could not cancel the MDFe with SEFAZ.',
      closeButton: 'Close',
      closeSuccessToast: 'MDFe closed successfully.',
      closeGenericError: 'Could not close the MDFe with SEFAZ.',
      closeModal: {
        title: 'Close MDFe',
        description: 'Confirm closing this MDFe with SEFAZ? This action cannot be undone.',
        confirmButton: 'Confirm Closing',
      },
      downloadXmlButton: 'Download XML',
      downloadXmlError: 'Could not download this MDFe XML.',
      motivoLabel: 'Reason',
      motivoRequired: 'Enter the cancellation reason.',
      motivoMinLength: 'The reason must have at least 15 characters.',
      fields: {
        mdfeNumero: 'MDFe Number',
        chave: 'Access Key',
        protocolo: 'Protocol',
        dateSendSefaz: 'SEFAZ Send Date',
      },
      cancelModal: {
        title: 'Cancel MDFe',
        description:
          'Enter the cancellation reason. This action transmits an event to SEFAZ and cannot be undone.',
        motivoPlaceholder: 'Describe the cancellation reason (minimum 15 characters)',
        confirmButton: 'Confirm Cancellation',
      },
    },
  },
};
