// src/@types/language/module-request-authorizations/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Autorização" (RequestAuthorization —
// Administrativo / Suprimentos, esteira 97-Esteiras/038, TASK-AUTH-FE-01).
//
// Namespace PRÓPRIO (`requestAuthorizations`), arquivo DEDICADO — decisão de
// estilo do Executor (nota i18n de convivência do Roteiro/Tarefa): o arquivo
// `languageRequestPurchases.ts` (3 idiomas) está sob edição concorrente da
// execução 039 (`TASK-MP-API-01`) e não commitada; isolar aqui evita tocar um
// arquivo já em edição, mesma disciplina de `module-transfers`/
// `module-work-teams` (módulos recentes que também nasceram como arquivo
// próprio em vez de acrescentar a um módulo vizinho já denso). `requestAuthorization`
// é uma FATIA nova sobre a MESMA entidade de domínio `RequestPurchase`, mas é
// um recurso HTTP/tela distintos (`request-authorizations`), por isso o
// namespace de tradução também é próprio (evita colisão de chave com
// `requestPurchases.requestPurchase`).
//
// `singularLabel`/`pluralLabel` alimentam `queryKey.requestAuthorizations.*`
// (`src/constants/query-key.ts`, PADRÃO CANÔNICO derivado da tradução,
// `get_pwa_constants_and_mappers_pattern` §6.1) — NÃO reusar
// `queryKey.requestPurchases.*` (recurso HTTP distinto, cache colidiria).
//
// TASK-AUTH-FE-01 cobre `singularLabel`/`pluralLabel` + `validation` (10
// schemas Yup de payload de escrita). TASK-AUTH-FE-02 acrescenta `titleModule`/
// `pageTitle`/`pageSubtitle`/`list`/`filter` (tela de listagem/fila). Status
// (`statusOptions`) NÃO é reproduzido aqui — Autorização reusa o MESMO enum
// `requestPurchaseStatus`/labels `languageGB.requestPurchases.requestPurchase.
// statusOptions.*` já existentes, restrito ao subconjunto {3,4,11} (BR-01,
// ver `request-authorization-status-options.ts`) — não cunhar tradução nova
// de status aqui.
// -----------------------------------------------------------------------------

export interface ModuleRequestAuthorizations {
  requestAuthorization: {
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;
    pageTitle: string;
    pageSubtitle: string;

    list: {
      table: {
        code: string;
        status: string;
        requestDate: string;
        description: string;
        duration: string;
        requester: string;
        responsible: string;
        farm: string;
        actions: {
          view: string;
        };
      };
      emptyState: {
        titleEmpty: string;
        titleFiltered: string;
        descriptionEmpty: string;
        descriptionFiltered: string;
      };
    };

    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      type: string;
      status: string;
      dateFrom: string;
      dateTo: string;
    };

    // Mensagens dos 10 schemas Yup de payload de escrita (TASK-AUTH-FE-01) —
    // `fieldValidationSchema`/`languageGB.defaltStrings.validations.*` cobre o
    // genérico (requiredField/invalidValue); as chaves abaixo são
    // ESPECÍFICAS do domínio de Autorização (mensagens que precisam nomear o
    // campo/regra de negócio).
    validation: {
      finalJustificationRequired: string;
      justifyRequired: string;
      justifyTooLong: string;
      authorizerRequired: string;
      responsibleRequired: string;
      statusRequired: string;
      quantityRequired: string;
      quantityMin: string;
      commentRequired: string;
      categoryRequired: string;
      centerRequired: string;
      percentRequired: string;
      percentSumInvalid: string;
    };

    // Tela de detalhe única (Aprovação e Ciência) — execução 081, T-081-FE-06.
    // Textos nos literais do legado (`_forms.blade.php`/`second.blade.php`).
    detail: {
      approvalTitle: string;
      acknowledgeTitle: string;
      errorState: {
        title: string;
        description: string;
        retry: string;
      };

      info: {
        title: string;
        code: string;
        requestDate: string;
        duration: string;
        type: string;
        priority: string;
        nfe: string;
        requester: string;
        responsible: string;
        justification: string;
        description: string;
        observation: string;
        finalizationNote: string;
        quotationJustification: string;
      };

      attachments: {
        title: string;
        empty: string;
      };

      movements: {
        title: string;
      };

      // Itens: Aprovação mostra seleção ("Itens para Aprovação"); a Ciência lista
      // só leitura ("Produtos/Serviços"). Cabeçalhos mudam por tipo (legado).
      items: {
        title: string;
        readOnlyTitle: string;
        hint: string;
        recordsCount: string;
        table: {
          select: string;
          product: string;
          service: string;
          serviceDescription: string;
          description: string;
          name: string;
          quantity: string;
          value: string;
          dailyQuantity: string;
          observation: string;
          actions: string;
        };
        editButton: string;
        empty: string;
      };

      editItem: {
        title: string;
        quantityLabel: string;
        submit: string;
        toast: string;
      };

      quotations: {
        title: string;
        hint: string;
        recordsCount: string;
        table: {
          select: string;
          date: string;
          provider: string;
          payment: string;
          total: string;
          net: string;
          responsible: string;
          actions: string;
        };
        choosePaymentButton: string;
        viewButton: string;
        empty: string;
        errorState: {
          title: string;
          description: string;
          retry: string;
        };
      };

      choosePayment: {
        title: string;
        table: {
          method: string;
          installments: string;
          interval: string;
          installmentValue: string;
          total: string;
          actions: string;
        };
        selectButton: string;
        empty: string;
        selectedToast: string;
      };

      ratio: {
        title: string;
        classificationLabel: string;
        classificationHelp: string;
        classificationOptions: { N: string; C: string; O: string };
        harvestLabel: string;
        harvestPlaceholder: string;
        categoryLabel: string;
        categoryPlaceholder: string;
        categoryMinChars: string;
        centerLabel: string;
        centerPlaceholder: string;
        percentLabel: string;
        addRowButton: string;
        removeRowButton: string;
        totalLabel: string;
      };

      // Validações de cliente do legado (swal "Atenção").
      clientValidation: {
        warningTitle: string;
        commentRequired: string;
        quotationRequired: string;
        itemsRequired: string;
        singleItemQuotations: string;
        ratioSumInvalid: string;
        categoryRequired: string;
        centerRequired: string;
        ratioOverflow: string;
      };

      justify: {
        label: string;
        addComment: string;
        commentToast: string;
      };

      actions: {
        updateToast: string;
        transfer: string;
        transferToast: string;
        back: string;
        next: string;
        reject: string;
        autoPromoteError: string;
      };
    };

    // Modal "Enviar para Autorização" (Ciência, `nextStatus == 3`, legado SEC).
    // A lista vem de `authorization_context.eligible_authorizers`.
    sendForAuthorization: {
      title: string;
      authorizerLabel: string;
      authorizerPlaceholder: string;
      justifyLabel: string;
      emptyEligibleState: {
        description: string;
      };
      sendButton: string;
    };
  };
}
