// src/constants/languages/languageEnUs/languageDfes.ts
// English translation of the "DFe Recebidas" module (Dfe — Fiscal domain,
// execution 044, TASK-DFE-FE-03). Structural mirror of
// `languageBaseRegistrations.nfse` (same Fiscal domain).

import { ModuleDfes } from '@/@types/language/module-dfes';

export const languageDfes: ModuleDfes = {
  dfe: {
    singularLabel: 'Received DFe',
    pluralLabel: 'Received DFes',

    list: {
      pageTitle: 'Received DFes',
      pageSubtitle: 'Manage the electronic fiscal documents received via SEFAZ.',
      table: {
        integrationStatus: 'Status',
        emissor: 'Issuer',
        // LST-04/LST-05 (contrato-dfe-norm.md) — added in TASK-DFE-FE-05
        // (missing from the TASK-DFE-FE-03 foundation, gap closed here).
        ieFornecedor: 'Supplier State Reg.',
        ieDestinatario: 'Recipient State Reg.',
        cpfCnpj: 'Tax ID',
        numero: 'Number',
        valor: 'Amount',
        dtEmissao: 'Issue Date',
        manifesto: 'Manifest',
        prazoManifesto: 'Manifest Deadline',
        lancada: 'Launched',
        chave: 'Access Key',
      },
      manifestoOptions: {
        naoManifestada: 'Not manifested',
        ciencia: 'Awareness of Operation',
        confirmacao: 'Confirmation of Operation',
        desconhecimento: 'Unaware of Operation',
        naoRealizada: 'Operation Not Performed',
      },
      prazoManifesto: {
        manifestado: 'Manifested',
        restamDias: '{{days}} day(s) left',
        encerrado: 'Deadline closed',
      },
      launchedOptions: {
        produto: 'Product',
        animal: 'Animal',
        despesa: 'Expense',
        abate: 'Slaughter',
        naoLancada: 'Not launched',
      },
      actions: {
        manifestar: 'Manifest',
        alternarPessoal: 'Toggle personal',
        alternarRemessa: 'Toggle shipment',
        lancarProduto: 'Launch Product',
        lancarAnimal: 'Launch Animal',
        lancarDespesa: 'Launch Expense',
        lancarRetorno: 'Launch Return',
        gerarDanfe: 'Generate DANFE',
        baixarXml: 'Download XML',
      },
      bulkSelection: {
        limitExceeded: 'Select at most 20 documents at a time.',
        selectAllDisabledHint: '"Select all" is only available with up to 20 items on the page.',
      },
      emptyState: {
        titleNoIssuer: 'Select the Issuer',
        descriptionNoIssuer: 'Select the Issuer to filter and list the received DFes.',
        titleEmpty: 'No DFe synced yet.',
        descriptionEmpty: 'Use "Fetch DFe" to sync this Issuer’s documents.',
        titleFiltered: 'No DFe found.',
        descriptionFiltered: 'Try adjusting the filters or the informed period.',
      },
      error: {
        message: 'Could not load the received DFes.',
        retry: 'Try again',
      },
      downloadXmlError: 'Could not download this DFe’s XML.',
      downloadXmlSuccess: 'XML downloaded successfully',
      generateDanfeError: 'Could not generate this DFe’s DANFE.',
      toggleSuccess: 'Updated successfully',
      toggleError: 'Could not update this DFe.',
      launchXmlDownloadError: 'Could not download the XML to launch.',
      launchGenericError: 'Could not start launching this DFe.',
    },

    filter: {
      title: 'Filter Received DFes',
      issuer: 'Select the Issuer',
      issuerPlaceholder: 'Search fiscal issuer...',
      issuerRequired: 'Required for a better listing',
      search: 'Search',
      searchPlaceholder: 'Search by key, number or Tax ID',
      dateFrom: 'Issued from',
      dateTo: 'Issued until',
      dateRangeInvalid: 'The end date is before the start date.',
      launched: 'Launched',
      launchedAll: 'All',
      launchedOptions: {
        yes: 'Yes',
        no: 'No',
      },
      status: 'Manifest',
      statusAll: 'All',
      isPersonal: 'Personal',
      isPersonalAll: 'All',
      isShipment: 'Shipment',
      isShipmentAll: 'All',
    },

    syncScreen: {
      pageTitle: 'Fetch DFe',
      pageSubtitle: 'Query the electronic fiscal documents received by this Issuer.',
      issuer: 'Select the Issuer',
      issuerPlaceholder: 'Search fiscal issuer...',
      issuerRequired: 'Select a Fiscal Issuer',
      submitButton: 'Query DF-e',
      loadingMessage: 'Querying the national webservice... this may take a few seconds or minutes.',
      successToast: 'SEFAZ synchronization completed.',
      errorToast: 'Could not query DF-e for this Issuer.',
      certificateMissingError:
        'This Issuer has no A1 digital certificate registered. Register the certificate to query DF-e.',
      certificateMissingLink: 'Go to the Issuer’s certificate',
      syncInProgress: 'Synchronization for this issuer is already in progress.',
      environmentMissingError:
        'This Issuer has no SEFAZ environment (production/homologation) configured. Set the environment in the Issuer record.',
      environmentMissingLink: 'Go to the Issuer record',
      emptyIssuerState: 'Select an Issuer to query DF-e.',
    },

    manifest: {
      modalTitle: 'Manifest DFe',
      modalTitleBatch: 'Manifest {{count}} selected DFes',
      description: 'Select the manifest event to transmit to SEFAZ.',
      fields: {
        evento: 'Event',
        eventoPlaceholder: 'Select the event',
        justificativa: 'Justification',
        justificativaPlaceholder: 'Describe the reason (minimum 15 characters)',
      },
      confirmButton: 'Confirm Manifest',
      cancelButton: 'Cancel',
      successMessage: 'Manifest sent successfully',
      errorMessage: 'Could not send the manifest to SEFAZ.',
      validation: {
        eventoRequired: 'Select the manifest event',
        justificativaRequired: 'The justification is required for this event',
        justificativaMin: 'The justification must have at least 15 characters',
      },
      eventOptions: {
        ciencia: 'Awareness of Operation',
        confirmacao: 'Confirmation of Operation',
        desconhecimento: 'Unaware of Operation',
        naoRealizada: 'Operation Not Performed',
      },
      deadlineDisabledHint: 'Option unavailable — manifest deadline closed.',
    },

    report: {
      pageTitle: 'DFe/Launched',
      pageSubtitle: 'Generate the report of electronic fiscal documents and their launch status.',
      fields: {
        issuer: 'Select the Issuer',
        issuerPlaceholder: 'Search fiscal issuer...',
        issuerRequired: 'The Issuer is required to generate the report',
        dateEmissionFrom: 'Issued from',
        dateEmissionTo: 'Issued until',
        dateLaunchFrom: 'Launched from',
        dateLaunchTo: 'Launched until',
        launched: 'Launched',
        launchedAll: 'All',
        reportType: 'Report Type',
      },
      reportTypeOptions: {
        pdf: 'PDF',
        excel: 'Excel',
      },
      submitButton: 'Generate report',
      loadingMessage: 'Generating the report... this may take a few seconds.',
      successToast: 'Report generated successfully',
      errorToast: 'Could not generate the DFe report.',
      issuerRequiredError: 'Select the Issuer before generating the report.',
    },

    return: {
      pageTitle: 'Link Return',
      pageSubtitle: 'Select the pending sale to link with this return NFe.',
      filter: {
        type: 'Link Type',
        typeAll: 'All',
        typeOptions: {
          sale: 'Animal Sale',
          slaughterMap: 'Slaughter Map',
        },
        date: 'Date',
        search: 'Search',
        searchPlaceholder: 'Search by code or client',
      },
      table: {
        code: 'Code',
        client: 'Client',
        date: 'Date',
        amount: 'Amount',
      },
      emptyState: {
        title: 'No pending sale for this Issuer.',
        description: 'There are no sales pending finalization for this NFe’s Tax ID.',
      },
      acceptSuggestionButton: 'Accept suggestion',
      suggestionsTitle: 'Suggestions',
      notReturnError: 'This DF-e is not a return document.',
      alreadyLaunchedError: 'This DF-e has already been posted.',
      loadError: 'Could not load the return candidates.',
      linkAndFinishButton: 'Link and finish',
      backButton: 'Back',
    },
  },
};
