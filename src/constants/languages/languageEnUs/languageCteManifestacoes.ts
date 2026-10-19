// src/constants/languages/languageEnUs/languageCteManifestacoes.ts
// English translation of the CT-e Manifestation module (CteManifestacao —
// Fiscal domain, execution 045, Wave 2, TASK-CTE-FE-12/13). This is also the
// source of `queryKey.cteManifestacoes.cteManifestacao`/`cteManifestacoesList`
// (singular/plural, canonical pattern — get_pwa_constants_and_mappers_pattern §6.1).

import { ModuleCteManifestacoes } from '@/@types/language/module-cte-manifestacoes';

export const languageCteManifestacoes: ModuleCteManifestacoes = {
  cteManifestacao: {
    singularLabel: 'CT-e Manifestation',
    pluralLabel: 'CT-e Manifestations',

    list: {
      pageTitle: 'CT-e Manifestation',
      pageSubtitle: 'Review and manifest disagreement on CT-e received from third parties.',
      helpLink: 'Help',
      consultarButton: 'Check for new documents',
      table: {
        nome: 'Supplier',
        documento: 'Tax ID',
        valor: 'Value',
        dataEmissao: 'Issue date',
        tipo: 'Manifestation',
        prazo: 'Manifestation deadline',
      },
      prazo: {
        manifestado: 'Manifested',
        diasRestantes: '{{days}} days left',
        encerrado: 'Closed',
      },
      actionsMenu: {
        manifestarDesacordo: 'Manifest disagreement',
        gerarDanfe: 'Generate DANFE',
        baixarXml: 'Download XML',
      },
      emptyState: {
        title: 'No manifestation found.',
        description: 'Use "Check for new documents" to fetch CT-e received from SEFAZ.',
      },
      error: {
        message: 'Could not load the CT-e manifestations.',
        retry: 'Try again',
      },
      danfeError: 'Could not generate the DANFE for this manifestation.',
      xmlError: 'Could not download the XML for this manifestation.',
    },

    filter: {
      title: 'Filter manifestations',
      issuer: 'Issuer',
      issuerPlaceholder: 'Select the issuer',
      search: 'Search',
      searchPlaceholder: 'Supplier name',
      startDate: 'Issued from',
      endDate: 'Issued until',
      dateRangeInvalid: 'The end date is before the start date.',
      dateFilterNotSupportedNotice:
        'Date filter is not supported by SEFAZ for this report — the fields below do not change the result.',
    },

    tipoOptions: {
      pendente: 'Pending',
      desacordo: 'Manifested (Disagreement)',
    },

    consultarDialog: {
      title: 'Check for new documents',
      description:
        'Fetches new CT-e received from SEFAZ for the selected issuer. Already imported documents are not duplicated.',
      issuer: 'Issuer',
      issuerPlaceholder: 'Select the issuer',
      issuerRequired: 'Select an issuer to check.',
      submitButton: 'Check',
      cancelButton: 'Cancel',
      errorMessage: 'Could not check for new documents.',
    },

    manifestarDialog: {
      title: 'Manifest disagreement',
      description:
        'Registers the "Service Rendered in Disagreement" manifestation with SEFAZ for this CT-e.',
      justificativa: 'Justification',
      justificativaPlaceholder: 'Describe the reason for the disagreement (minimum 15 characters)',
      submitButton: 'Manifest',
      cancelButton: 'Cancel',
      successMessage: 'Disagreement manifested successfully.',
      errorMessage: 'Could not manifest the disagreement.',
      validation: {
        justificativaRequired: 'Enter the justification.',
        justificativaMin: 'The justification must have at least 15 characters.',
      },
    },
  },
};

export default languageCteManifestacoes;
