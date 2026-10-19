// src/@types/language/module-request-quotations/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Cotações" (RequestQuotation —
// Administrativo / Suprimentos, esteira 97-Esteiras/035, TASK-CQ-FE-01).
// Mirror estrutural de `ModuleRequestPurchases` (chave singular
// `requestQuotation`, mesmo padrão de `requestPurchase`) — chave PLANA de
// primeiro nível em `LanguageDate` (convenção real do projeto, ver nota em
// `module-request-purchases/index.ts`).
//
// `singularLabel`/`pluralLabel` alimentam `queryKey.requestQuotations.*`
// (convenção canônica derivada da tradução — NUNCA string literal). O
// conteúdo mora em
// src/constants/languages/{idioma}/languageRequestQuotations.ts.
//
// Escopo desta Tarefa (TASK-CQ-FE-01, fundação): só as chaves consumidas pela
// fábrica de opções (`statusOptions`/`paymentMethodOptions`) e pelo schema de
// validação do Dialog Criar/Editar (`form.validation`) — as demais telas
// (aba Cotações, dialogs de detalhe/saving/autorização/e-mail em lote,
// formulário público) abrem suas PRÓPRIAS chaves aditivas nas Tarefas
// subsequentes (TASK-CQ-FE-02..11), mesma disciplina incremental já usada em
// `ModuleRequestPurchases` (aditivos citados como tal, nunca inventados
// silenciosamente).
// -----------------------------------------------------------------------------

export interface ModuleRequestQuotations {
  requestQuotation: {
    singularLabel: string;
    pluralLabel: string;

    // ============================================
    // FORMULÁRIO (Dialog Criar/Editar Cotação, TASK-CQ-FE-04) — só os 4
    // campos que o form interno edita (FIELD-01..04, mirror CL-025/026).
    // ============================================
    form: {
      fields: {
        provider: string;
        branch: string;
        requiresFile: string;
        note: string;
      };
      placeholders: {
        provider: string;
        branch: string;
        /** Placeholder do `branch_uuid` enquanto `disabled` por ausência de
         *  `provider_uuid` (CL-024, default de engenharia — roteiro
         *  frontend §2) — distingue "sem opções ainda" de "nenhuma filial". */
        branchNoProvider: string;
        note: string;
      };
      requiresFileOptions: {
        yes: string;
        no: string;
      };
      validation: {
        providerRequired: string;
        requiresFileRequired: string;
      };

      // ============================================
      // ADITIVO (TASK-CQ-FE-04) — Dialog Criar/Editar Cotação (Pattern 14,
      // `RequestQuotationFormDialog.tsx`). `createTitle` reaproveita a mesma
      // frase do botão da aba (`tab.addProviderButton`, AM-01) por
      // consistência textual — declarado aqui também porque o título do
      // Dialog é uma chave própria (i18n modular, nunca string literal).
      // ============================================
      createTitle: string;
      editTitle: string;
      createdToast: string;
      updatedToast: string;
      errorFallback: string;
    };

    // ============================================
    // OPÇÕES (fábricas em `@/constants/RequestQuotations/options`,
    // TASK-CQ-FE-01) — mirror `requestPurchaseStatusOptions`.
    // ============================================
    /** 3 labels — mirror `requestQuotationStatus` enum. */
    statusOptions: {
      aguardando: string;
      enviada: string;
      recebida: string;
    };

    /** 5 labels — mirror `requestQuotationPaymentMethod` enum. Aditivo já
     *  aberto na fundação (formulário público, TASK-CQ-FE-10, consome esta
     *  mesma fábrica — evita reabrir o pacote de i18n naquela Tarefa). */
    paymentMethodOptions: {
      aVista: string;
      boleto: string;
      cartao: string;
      pix: string;
      cheque: string;
    };

    // ============================================
    // ADITIVO (TASK-CQ-FE-03) — aba "Cotações" da tela única de Solicitação
    // (Pattern 12, Cards em Tab, `RequestQuotationTab.tsx`). Escopo desta
    // Tarefa: só a grade + pontos de ação; os textos dos Dialogs (criar/
    // editar/ver/saving/autorização/e-mail em lote) abrem suas PRÓPRIAS
    // chaves nas Tarefas subsequentes (TASK-CQ-FE-04..08), mesma disciplina
    // incremental já usada no restante deste módulo.
    // ============================================
    tab: {
      title: string;
      addProviderButton: string;
      sendEmailBatchButton: string;
      emptyState: {
        title: string;
        description: string;
      };
      card: {
        selectAriaLabel: string;
        fields: {
          creator: string;
          totalValue: string;
          netValue: string;
          saving: string;
          savingResponsible: string;
        };
        actions: {
          view: string;
          edit: string;
          editObservation: string;
          applySaving: string;
          sendForAuthorization: string;
          delete: string;
        };
      };
      deleteDialog: {
        title: string;
        description: string;
        warning: string;
      };
      deletedToast: string;
      deleteErrorFallback: string;
    };

    // ============================================
    // ADITIVO (execução 081, T-081-FE-08) — estágio de cotação: quadro de itens
    // (update-item), quadro do fornecedor, modal de WhatsApp, Sub Solicitação
    // na cotação e textos da fila de Cotações.
    // ============================================
    stage: {
      itemsBlock: {
        title: string;
        blockedNotice: string;
        columns: { product: string; quantity: string; description: string };
        saveButton: string;
        savedToast: string;
        errorFallback: string;
        quantityRequired: string;
        descriptionRequired: string;
        loadError: string;
        retry: string;
      };
      providerBoard: {
        title: string;
        corporateName: string;
        tradeName: string;
        email: string;
        phone: string;
        cellphone: string;
        city: string;
        loading: string;
        loadError: string;
      };
      whatsAppModal: {
        title: string;
        column: string;
        close: string;
        sendTo: string;
        supplierTag: string;
      };
      separate: {
        title: string;
        description: string;
        requestLabel: string;
        itemsLabel: string;
        searchPlaceholder: string;
        selectAllLabel: string;
        deselectAllLabel: string;
        selectedCountLabel: string;
        emptyLabel: string;
        itemsRequired: string;
        loadError: string;
        retry: string;
        submit: string;
        successToast: string;
        createdCode: string;
      };
      queue: {
        receivedToast: string;
        redoTooltip: string;
      };
    };

    // ============================================
    // ADITIVO (TASK-CQ-FE-05) — Dialog "Ver Cotação" (read-only,
    // `RequestQuotationDetailDialog.tsx`). Reaproveita `form.fields.{provider,
    // branch,requiresFile,note}` e `tab.card.fields.{totalValue,netValue,
    // saving,savingResponsible,creator}` já existentes (mesmo rótulo, mesmo
    // dado) — só as chaves EXCLUSIVAS desta tela abrem aqui (i18n modular,
    // nunca duplicar rótulo já aberto noutra seção do módulo).
    // ============================================
    detail: {
      title: string;
      fields: {
        quotationDate: string;
        expirationDate: string;
        /** Nome livre do FORNECEDOR preenchido no formulário público
         *  (`RequestQuotationData.reponsible`, grafia legada mantida 1:1 —
         *  ver comentário do tipo). NÃO confundir com `savingResponsible`. */
        providerResponsible: string;
        /** Observação geral deixada pelo fornecedor no formulário público
         *  (`RequestQuotationData.observation`) — distinta de `form.fields.note`
         *  (observação INTERNA, editável no Dialog Criar/Editar). */
        observation: string;
      };
      /** Exibida no lugar das Seções de itens/pagamentos quando
       *  `status !== recebida` (CL-036/038/039 — mirror `show.blade.php`,
       *  itens/pagamentos só existem depois que o fornecedor responde). */
      pendingReceiptNotice: string;
      itemsSection: {
        title: string;
        empty: string;
        columns: {
          description: string;
          brand: string;
          quantity: string;
          unitaryValue: string;
          total: string;
          observation: string;
        };
      };
      paymentsSection: {
        title: string;
        empty: string;
        columns: {
          paymentMethod: string;
          installments: string;
          interval: string;
          installmentValue: string;
          total: string;
        };
      };
      errorState: {
        title: string;
        description: string;
        retry: string;
      };
    };

    // ============================================
    // ADITIVO (TASK-CQ-FE-06) — Dialog "Aplicar Saving" (Pattern 14,
    // `RequestQuotationSavingDialog.tsx`). Reaproveita
    // `tab.card.fields.savingResponsible`/`form.fields.*` onde o rótulo já é
    // idêntico — só as chaves EXCLUSIVAS desta tela abrem aqui.
    // ============================================
    saving: {
      title: string;
      fields: {
        responsible: string;
        /** Rótulo "Valor com Desconto" — armadilha semântica preservada do
         *  legado (CL-045): o campo é o VALOR LÍQUIDO, não o desconto. */
        netValue: string;
        netValueHelper: string;
        /** Preview client-side (CV-04) — só leitura, servidor recalcula. */
        savingPreview: string;
      };
      placeholders: {
        responsible: string;
      };
      validation: {
        responsibleRequired: string;
        discountRequired: string;
        discountMin: string;
        /** Mirror da guarda de negócio server-side (CL-045,
         *  `total_value <= valor_liquido` → 422) — preview client-side, o
         *  servidor é a autoridade final. */
        discountMustBeLessThanTotal: string;
      };
      applyButton: string;
      appliedToast: string;
      errorFallback: string;
    };

    // ============================================
    // ADITIVO (TASK-CQ-FE-07) — Dialog "Enviar para Autorização" (Pattern 14,
    // `RequestQuotationAuthorizerDialog.tsx`, Dimensão B). Acionado pela ação
    // "Enviar para Autorização" (AM-12) do card de `tab.card.actions` (chave
    // já existente, reaproveitada — não duplicada aqui).
    // ============================================
    authorizer: {
      title: string;
      fields: {
        authorizer: string;
      };
      placeholders: {
        authorizer: string;
      };
      validation: {
        authorizerRequired: string;
      };
      /** Lista de elegíveis carregada e VAZIA (motor de elegibilidade
       *  server-side, CL-043, não encontrou nenhum autorizador condicional
       *  pendente nem principal) — estado real da API, nunca tratado como
       *  erro. */
      emptyEligibleState: {
        title: string;
        description: string;
      };
      /** Falha ao carregar a lista de elegíveis (`getEligibleAuthorizers`) —
       *  distinto do estado vazio acima. */
      loadErrorState: {
        title: string;
        description: string;
        retry: string;
      };
      sendButton: string;
      sentToast: string;
      errorFallback: string;
    };

    // ============================================
    // ADITIVO (TASK-CQ-FE-08) — Modal "Enviar E-mail em Lote"
    // (`RequestQuotationEmailBatchModal.tsx`, Dimensão B). Acionado pelo
    // botão `tab.sendEmailBatchButton` (chave já existente, reaproveitada,
    // habilitado só com `selectedUuids.length>=1`, IG-09). Componente
    // UX-GAP (roteiro frontend §1.2) — uma seção por cotação selecionada,
    // com um checkbox "incluir fornecedor" + `CheckboxListField` de
    // vendedores (`GET /providers/{uuid}`, `sellers[]`).
    // ============================================
    emailBatch: {
      title: string;
      description: string;
      /** Checkbox único "incluir e-mail do fornecedor" por cotação
       *  (`provider_selected` do payload, TASK-CQ-API-08). */
      providerRecipient: {
        label: string;
        /** Exibido quando `provider.email` vem `null` no Resource — não é
         *  bloqueio (o servidor tem fallback próprio, CL-050/AM-06 do
         *  Action real), só um aviso honesto de UI. */
        noEmailNotice: string;
      };
      /** `CheckboxListField` de vendedores por cotação (`seller_uuids[]`),
       *  itens vindos de `GET /providers/{uuid}` (`ProviderDetail.sellers`,
       *  mesmo endpoint já consumido pela cascata `branch_uuid`,
       *  CL-021/022). */
      sellers: {
        label: string;
        searchPlaceholder: string;
        selectAllLabel: string;
        deselectAllLabel: string;
        selectedCountLabel: string;
        emptyLabel: string;
        loadErrorLabel: string;
        retryLabel: string;
      };
      /** Aviso por cotação sem nenhum destinatário marcado — mirror do
       *  Action real (`resolveRecipients`==`[]` é silenciosamente ignorado,
       *  não é erro), só torna esse silêncio visível ao usuário ANTES do
       *  envio. */
      noRecipientsSelected: string;
      /** Guarda client-side antes do submit — nenhuma cotação com
       *  destinatário marcado em todo o lote (evita um POST que o servidor
       *  processaria como no-op total). NÃO é validação de e-mail (CL-050
       *  continua 100% server-side). */
      emptySelectionError: string;
      submitButton: string;
      sentToast: string;
      errorFallback: string;
      /** 422 `errors.invalid_emails[]` (`BusinessRuleException`,
       *  `SendRequestQuotationEmailBatchAction`, CL-050) — lista devolvida
       *  pelo servidor, o front NUNCA decide client-side quem é válido. */
      invalidEmailsError: {
        title: string;
        description: string;
        /** Uma linha por e-mail inválido, literal do legado
         *  ("Fornecedor {value} sem email cadastrado."). */
        line: string;
      };
    };

    // ============================================
    // ADITIVO (TASK-CQ-FE-09) — Botão "WhatsApp" por card (AM-06, composição
    // client-side, `buildRequestQuotationWhatsAppLink` em
    // `src/utils/requestQuotationWhatsApp.ts`). Mensagem mirror EV-081
    // (legado: `RequestQuotationController::whatsapp()`, server-rendered) —
    // divergência consciente já registrada no roteiro de API (§8.3): mesma
    // mensagem/destino, agora montada 100% no cliente. Marcação de
    // formatação do WhatsApp (`*negrito*`, `` ```monoespaçado``` ``, `_itálico_`)
    // fica no util, NUNCA aqui — estas chaves guardam só o TEXTO puro.
    // ============================================
    whatsApp: {
      /** Tooltip/aria-label do botão-ícone no card (mirror `.btn-whatsapp`). */
      buttonLabel: string;
      /** Primeira linha da mensagem ("Solicitação de orçamento"). */
      messageTitle: string;
      /** Rótulo dentro do bloco "#Fazenda {farm}#". */
      farmLabel: string;
      /** "Código da solicitação:". */
      purchaseCodeLabel: string;
      /** "Descrição/Chamado:". */
      descriptionLabel: string;
      /** Rótulo dentro do bloco "Fornecedor:\n{nome}". */
      providerLabel: string;
      /** Corpo do convite (itálico no WhatsApp). */
      invitationText: string;
      /** "O mesmo já está disponível no email" + e-mail do destinatário. */
      emailAvailableText: string;
      /** Instrução de preenchimento único (itálico). */
      fillInstructions: string;
      /** "Atenciosamente:" — assinatura, seguida do nome do CRIADOR da
       *  cotação (`quotation.user.name`), nunca do usuário logado. */
      regardsLabel: string;
      /** Precede a URL do formulário público (hash). */
      formLinkLabel: string;
      /** Cotação sem `provider` carregado (mirror IG-10, fallback "dados do
       *  fornecedor não foram encontrados"). */
      providerMissingError: string;
    };

    // ============================================
    // ADITIVO (TASK-CQ-FE-10) — Formulário PÚBLICO do fornecedor (hash,
    // `src/pages/Public/RequestQuotation/**`). Tela STANDALONE (sem chrome
    // do app) — NÃO reaproveita `form.*`/`tab.*` acima (contexto/audiência
    // totalmente distintos, mesmo pacote de idioma só por organização de
    // módulo).
    // ============================================
    publicForm: {
      pageTitle: string;
      /** Cabeçalho "Solicitação Nº {code} - {farm}" (legado). */
      requestHeader: string;
      descriptionLabel: string;
      providerLabel: string;
      fields: {
        /** Rótulo da coluna de itens do tipo P (legado: `type == 'P'`). */
        itemProduct: string;
        /** Rótulo da coluna de itens dos demais tipos. */
        itemService: string;
        /** Total geral (soma das linhas), somente leitura. */
        totalValue: string;
        /** Observação do cotador (`note`), somente leitura. */
        quotationNote: string;
        quantity: string;
        brand: string;
        unitaryValue: string;
        amount: string;
        observation: string;
        reponsible: string;
        expirationDate: string;
        file: string;
      };
      /** Alerta quando `requires_file`. */
      requiresFileAlert: string;
      placeholders: {
        brand: string;
        observation: string;
        reponsible: string;
      };
      paymentsSection: {
        title: string;
        addButton: string;
        removeButton: string;
        emptyLabel: string;
        cannotRemoveLastRow: string;
        incompleteRow: string;
        removeConfirm: {
          title: string;
          text: string;
        };
        fields: {
          paymentMethod: string;
          installments: string;
          interval: string;
          total: string;
          amount: string;
        };
        placeholders: {
          paymentMethod: string;
        };
      };
      fileUpload: {
        dropzoneTitle: string;
        dropzoneDraggingTitle: string;
        changeFileLabel: string;
        removeFileLabel: string;
        replaceFileLabel: string;
        existingFileLabel: string;
        errorTypeMessage: string;
        errorSizeMessage: string;
      };
      validation: {
        reponsibleRequired: string;
        reponsibleMax: string;
        expirationDateRequired: string;
        expirationDateInvalid: string;
        /** `after_or_equal:hoje` (Form Request real) — "mínimo hoje". */
        expirationDateMin: string;
        fileRequired: string;
        unitaryValueRequired: string;
        brandRequired: string;
        observationMax: string;
        paymentsMinOne: string;
        paymentMethodRequired: string;
        installmentsRequired: string;
        installmentsMin: string;
        intervalRequired: string;
        intervalMin: string;
        /** Total geral <= 0 (legado: "O valor deve ser maior que zero"). */
        totalValueMin: string;
      };
      submitButton: string;
      submittedToast: string;
      errorFallback: string;
      /** Estados de página inteira (`index.tsx`) — hash resolvendo/inválido/
       *  já finalizada/limite de tentativas. */
      loadingState: string;
      notFoundState: {
        title: string;
        description: string;
      };
      loadErrorState: {
        title: string;
        description: string;
        retry: string;
      };
      /** 409 `QUOTATION_ALREADY_SUBMITTED` (mirror EV-069, banner
       *  substitui o formulário — `status===recebida`). */
      alreadySubmittedState: {
        title: string;
        description: string;
      };
      /** 429 (`throttle:quotation-public`) — distinto de erro genérico de
       *  carregamento/submissão, mensagem própria (rate limit). */
      rateLimitedError: string;
    };
  };
}
