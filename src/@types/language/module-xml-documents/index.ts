// src/@types/language/module-xml-documents/index.ts
// Interface de tradução do módulo "Arquivos XML" (F-133, Gestão Fiscal,
// esteira 97-Esteiras/008, Tarefa 36). Espelha estruturalmente `ModuleDfes`
// (mesmo domínio Fiscal) — módulo TOP-LEVEL próprio, mirror `dfes`/`nfes`.
//
// `states.*` NÃO existe de propósito — `state` é dado cru do servidor,
// heterogêneo por tipo de documento, e traduzi-lo inventaria vocabulário
// (AD-08 da API / AD-F05 do contrato de tela). `actions.*` já nasce aqui
// (2 chaves — baixar ZIP / enviar e-mail) para a Tarefa 37 não reabrir este
// arquivo.

export interface ModuleXmlDocuments {
  singularLabel: string;
  pluralLabel: string;
  issuersLabel: string; // alimenta a query key do lookup de emissores (E2)

  pageTitle: string;
  pageSubtitle: string;

  filter: {
    issuer: string;
    issuerPlaceholder: string;
    startDate: string;
    endDate: string;
    document: string;
    status: string;
    launched: string;
    launchedPlaceholder: string;
    submitButton: string;
    clearButton: string;
    incompleteWarning: string; // toaster.warning quando falta 1 dos 5 primeiros
  };

  documentTypeOptions: {
    todos: string;
    nfe: string;
    mdfe: string;
    dfe: string;
    nfse: string;
  };

  statusOptions: {
    aprovado: string;
    cancelado: string;
  };

  launchedOptions: {
    yes: string;
    no: string;
  };

  list: {
    table: {
      counterpartyName: string;
      chave: string;
      amount: string;
      state: string;
      emittedAt: string;
    };
    groupFooterCount: string; // template — receber {{count}} via interpolação manual
  };

  totalsLabel: string; // "Total geral"
  awaitingFiltersTitle: string;
  awaitingFiltersDescription: string;
  emptyTitle: string;
  emptyDescription: string;
  errorMessage: string;

  copiedKeyLabel: string; // toast de sucesso ao copiar a chave
  copyKeyError: string; // toast de erro (clipboard indisponível)

  // ============================================
  // Ações de exportação (Tarefa 37 — seleção + baixar ZIP + enviar e-mail)
  // ============================================
  actions: {
    downloadZip: string;
    sendEmail: string;
    noun: string; // substantivo invariante da contagem — "{count} {noun}" na barra (ex.: "selecionados")
    clearSelection: string; // aria-label do botão de fechar a barra / limpar seleção
    selectAllInGroup: string; // aria-label do checkbox "selecionar todos" de um grupo
    downloadSuccess: string;
    downloadError: string; // fallback quando a extração de 3 níveis (item 4) não resolve
    sendEmailSuccess: string; // reforça "enfileirado", nunca "enviado" (AD-F08)
    sendEmailError: string;
    notExportableReason: string; // motivo (Tooltip) da inelegibilidade de MDFe/DFe (GAP-XML-03)
  };
}
