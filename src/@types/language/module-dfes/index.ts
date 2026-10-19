// src/@types/language/module-dfes/index.ts
// Interface de tradução do módulo "DFe Recebidas" (Dfe — domínio Fiscal,
// execução 044, TASK-DFE-FE-03). Espelha estruturalmente
// `languageBaseRegistrations.nfse` (mesmo domínio Fiscal, mesmo tipo de tela
// — documento fiscal de terceiro, sem CRUD) — NÃO reaproveita o namespace
// `baseRegistrations` (Dfe é módulo próprio, top-level, mirror `nfes`/
// `module-nfes`), só a FORMA de `list`/`filter`/`syncScreen`.
//
// 4 telas (CONTRATO-TELA-DFE-FE.md §3): index (grid+filtro+manifestação+
// toggles, TASK-DFE-FE-04/05/06), "Buscar DFe" (sync, TASK-DFE-FE-07),
// Relatório (TASK-DFE-FE-10), Retorno (vínculo, TASK-DFE-FE-09). Chaves de
// `manifest`/`report`/`return` são consumidas pelas Tarefas correspondentes
// (ainda não materializadas neste batch) — a fundação já fecha o dicionário
// inteiro para não reabrir este arquivo a cada Tarefa subsequente.

export interface ModuleDfes {
  dfe: {
    singularLabel: string;
    pluralLabel: string;

    // ============================================
    // Listagem — /fiscal/dfes (TASK-DFE-FE-04/05/06)
    // ============================================
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        integrationStatus: string; // LST-01
        emissor: string; // LST-03 (fornecedor/razao_social)
        // Colunas ADICIONADAS na TASK-DFE-FE-05 — a fundação (TASK-DFE-FE-03)
        // não declarava `ieFornecedor`/`ieDestinatario`, mas o contrato legado
        // (`contrato-dfe-norm.md`, LST-04/LST-05) exige as 2 colunas de
        // Inscrição Estadual (Fornecedor/Destinatário) na grid — sem elas a
        // regra "12 colunas, nenhuma omitida" (DoD da Tarefa) não fecha.
        ieFornecedor: string; // LST-04 (issue_ie)
        ieDestinatario: string; // LST-05 (ie)
        cpfCnpj: string; // sem coluna própria no legado (só no filtro) — mantido para reuso futuro
        numero: string; // LST-06 (number)
        valor: string; // LST-07
        dtEmissao: string; // LST-08
        manifesto: string; // LST-09 (badge tipo_evento)
        prazoManifesto: string; // LST-10 (badge CALC-01)
        lancada: string; // LST-11 (launched_in)
        chave: string; // LST-12 é a coluna "acoes" no legado — `chave` aqui é usado à parte (tooltip/nome de arquivo de download), não uma 13ª coluna de grid
      };
      manifestoOptions: {
        naoManifestada: string;
        ciencia: string;
        confirmacao: string;
        desconhecimento: string;
        naoRealizada: string;
      };
      prazoManifesto: {
        manifestado: string;
        restamDias: string; // template — receber {{days}} via interpolação manual
        encerrado: string;
      };
      launchedOptions: {
        produto: string;
        animal: string;
        despesa: string;
        abate: string;
        naoLancada: string;
      };
      actions: {
        manifestar: string;
        alternarPessoal: string;
        alternarRemessa: string;
        lancarProduto: string;
        lancarAnimal: string;
        lancarDespesa: string;
        lancarRetorno: string;
        gerarDanfe: string;
        baixarXml: string;
      };
      bulkSelection: {
        limitExceeded: string; // toast ao ultrapassar 20 (ACT-05/IG-06/IG-08)
        selectAllDisabledHint: string; // "Selecionar todos" só ≤20 itens
      };
      emptyState: {
        titleNoIssuer: string;
        descriptionNoIssuer: string;
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
      };
      error: {
        message: string;
        retry: string;
      };
      downloadXmlError: string;
      downloadXmlSuccess: string;
      generateDanfeError: string;
      toggleSuccess: string;
      toggleError: string;
      launchXmlDownloadError: string;
      // TASK-DFE-FE-08 — fallback genérico dos 3 handlers de lançamento
      // cross-módulo (Produto/Animal/Despesa) quando o servidor não devolve
      // `message` de negócio (ex.: falha de rede no download do XML) —
      // `extractApiErrorMessage` tenta a mensagem real primeiro.
      launchGenericError: string;
    };

    // ============================================
    // Filtro do index — FilterSideDfe (TASK-DFE-FE-04)
    // ============================================
    filter: {
      title: string;
      issuer: string;
      issuerPlaceholder: string;
      issuerRequired: string;
      search: string;
      searchPlaceholder: string;
      dateFrom: string;
      dateTo: string;
      dateRangeInvalid: string;
      launched: string;
      launchedAll: string;
      launchedOptions: {
        yes: string;
        no: string;
      };
      status: string;
      statusAll: string;
      isPersonal: string;
      isPersonalAll: string;
      isShipment: string;
      isShipmentAll: string;
    };

    // ============================================
    // "Buscar DFe" — sincronização SEFAZ (TASK-DFE-FE-07)
    // ============================================
    syncScreen: {
      pageTitle: string;
      pageSubtitle: string;
      issuer: string;
      issuerPlaceholder: string;
      issuerRequired: string;
      submitButton: string;
      loadingMessage: string;
      successToast: string;
      errorToast: string;
      certificateMissingError: string;
      certificateMissingLink: string;
      syncInProgress: string;
      environmentMissingError: string;
      environmentMissingLink: string;
      emptyIssuerState: string;
    };

    // ============================================
    // Manifestação SEFAZ — modal individual/lote (TASK-DFE-FE-06)
    // ============================================
    manifest: {
      modalTitle: string;
      modalTitleBatch: string; // template — receber {{count}} via interpolação manual
      description: string;
      fields: {
        evento: string;
        eventoPlaceholder: string;
        justificativa: string;
        justificativaPlaceholder: string;
      };
      confirmButton: string;
      cancelButton: string;
      successMessage: string;
      errorMessage: string;
      validation: {
        eventoRequired: string;
        justificativaRequired: string;
        justificativaMin: string;
      };
      eventOptions: {
        ciencia: string;
        confirmacao: string;
        desconhecimento: string;
        naoRealizada: string;
      };
      deadlineDisabledHint: string; // CALC-02/03, só modo individual
    };

    // ============================================
    // Relatório PDF/Excel (TASK-DFE-FE-10)
    // ============================================
    report: {
      pageTitle: string;
      pageSubtitle: string;
      fields: {
        issuer: string;
        issuerPlaceholder: string;
        issuerRequired: string;
        dateEmissionFrom: string;
        dateEmissionTo: string;
        dateLaunchFrom: string;
        dateLaunchTo: string;
        launched: string;
        launchedAll: string;
        reportType: string;
      };
      reportTypeOptions: {
        pdf: string;
        excel: string;
      };
      submitButton: string;
      loadingMessage: string;
      successToast: string;
      errorToast: string;
      issuerRequiredError: string;
    };

    // ============================================
    // Vínculo de Retorno — DfeReturnLinking (TASK-DFE-FE-09)
    // ============================================
    return: {
      pageTitle: string;
      pageSubtitle: string;
      filter: {
        type: string;
        typeAll: string;
        typeOptions: {
          sale: string;
          slaughterMap: string;
        };
        date: string;
        search: string;
        searchPlaceholder: string;
      };
      table: {
        code: string;
        client: string;
        date: string;
        amount: string;
      };
      emptyState: {
        title: string;
        description: string;
      };
      acceptSuggestionButton: string;
      suggestionsTitle: string;
      notReturnError: string; // fallback — a API devolve a mensagem real
      alreadyLaunchedError: string; // fallback — idem
      loadError: string;
      linkAndFinishButton: string;
      backButton: string;
    };
  };
}
