// src/constants/languages/languagePtBr/languageXmlDocuments.ts
// Tradução PT-BR do módulo "Arquivos XML" (F-133, Gestão Fiscal, esteira
// 97-Esteiras/008, Tarefa 36). Mirror estrutural de `languageDfes.ts` (mesmo
// domínio Fiscal); `spa-contract-arquivos-xml.md` como fonte de fidelidade.

import { ModuleXmlDocuments } from '@/@types/language/module-xml-documents';

export const languageXmlDocuments: ModuleXmlDocuments = {
  singularLabel: 'Arquivo XML',
  pluralLabel: 'Arquivos XML',
  issuersLabel: 'Emissores de Arquivos XML',

  pageTitle: 'Arquivos XML',
  pageSubtitle:
    'Consulte os documentos fiscais eletrônicos (NFe, MDFe, DFe, NFSe) de um emissor e período.',

  filter: {
    issuer: 'Emissor',
    issuerPlaceholder: 'Selecione o emissor',
    startDate: 'Emitido de',
    endDate: 'Emitido até',
    document: 'Tipo de Documento',
    status: 'Status',
    launched: 'Lançada',
    launchedPlaceholder: 'Todas',
    submitButton: 'Consultar',
    clearButton: 'Limpar',
    incompleteWarning: 'Informe emissor, período, tipo e status para consultar.',
  },

  documentTypeOptions: {
    todos: 'Todos',
    nfe: 'NFe',
    mdfe: 'MDFe',
    dfe: 'DFe',
    nfse: 'NFSe',
  },

  statusOptions: {
    aprovado: 'Aprovado',
    cancelado: 'Cancelado',
  },

  launchedOptions: {
    yes: 'Sim',
    no: 'Não',
  },

  list: {
    table: {
      counterpartyName: 'Nome / Razão Social',
      chave: 'Chave',
      amount: 'Valor',
      state: 'Estado',
      emittedAt: 'Data Emissão',
    },
    groupFooterCount: '{{count}} docs',
  },

  totalsLabel: 'Total geral',
  awaitingFiltersTitle: 'Aguardando filtros',
  awaitingFiltersDescription:
    'Informe emissor, período, tipo e status e clique em Consultar para listar os arquivos XML.',
  emptyTitle: 'Nenhum documento encontrado.',
  emptyDescription: 'Nenhum documento no período para os filtros informados.',
  errorMessage: 'Não foi possível consultar os arquivos XML.',

  copiedKeyLabel: 'Chave copiada!',
  copyKeyError: 'Não foi possível copiar a chave.',

  actions: {
    downloadZip: 'Baixar ZIP',
    sendEmail: 'Enviar por e-mail',
    noun: 'selecionados',
    clearSelection: 'Limpar seleção',
    selectAllInGroup: 'Selecionar todos deste grupo',
    downloadSuccess: 'ZIP baixado com sucesso.',
    downloadError: 'Não foi possível baixar o ZIP dos arquivos XML.',
    sendEmailSuccess:
      'Envio dos arquivos XML por e-mail enfileirado com sucesso. Os contadores vinculados ao emissor receberão o ZIP por e-mail em instantes.',
    sendEmailError: 'Não foi possível enfileirar o envio dos arquivos XML por e-mail.',
    notExportableReason: 'O XML deste tipo de documento ainda não está disponível para exportação.',
  },
};
