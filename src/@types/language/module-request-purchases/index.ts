// src/@types/language/module-request-purchases/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Solicitação de Compras" (RequestPurchase —
// Administrativo / Suprimentos, esteira 97-Esteiras/022, TASK-RP-FE-03).
// Mirror estrutural de `ModuleFunctions`/`ModuleEquipments` (chave singular
// `requestPurchase`, mesmo padrão de `function`/`equipment`).
//
// ⚠️ Correção de premissa (transparência): a ficha da Tarefa sugeria o
// namespace aninhado `administrativo.solicitacao`, mirror de uma suposta
// convenção "administrativo.funcoes". Verificação real contra
// `@/@types/language/index.d.ts`: NÃO existe nenhum namespace `administrativo`
// — todos os módulos (`functions`, `equipments`, `harvests`, etc.) são chaves
// PLANAS de primeiro nível em `LanguageDate`. Este arquivo segue a convenção
// real (chave plana `requestPurchases`), não a suposição da ficha — mesma
// classe de divergência já registrada no contrato de tela §2 (Autorizadores).
//
// `singularLabel`/`pluralLabel` alimentam `queryKey.requestPurchases.*`
// (`TASK-RP-FE-04`, convenção canônica derivada da tradução — NUNCA string
// literal). O conteúdo mora em
// src/constants/languages/{idioma}/languageRequestPurchases.ts.
// -----------------------------------------------------------------------------

export interface ModuleRequestPurchases {
  requestPurchase: {
    singularLabel: string;
    pluralLabel: string;
    /** Rótulo do módulo (heading de menu/breadcrumb) — mirror
     *  `languageGB.administrativo.titleModule` quando existir; aqui criado
     *  localmente (nenhum `titleModule` genérico foi encontrado em
     *  `@/@types/language/index.d.ts` para reaproveitar). */
    titleModule: string;

    // ============================================
    // LEGENDA DE STATUS (`TASK-CQ-FE-15`) — mirror do legado
    // `request-purchase/_legend.blade.php` (`trad.var_legenda`), achado de
    // homologação: perdida na migração da listagem (`FE-13`). Componente
    // dedicado (`RequestPurchaseStatusLegend.tsx`) reutilizável entre as
    // listagens de RequestPurchase — wired nesta Tarefa só em "Cotações".
    // ============================================
    legend: {
      label: string;
    };

    // ============================================
    // LISTAGEM (`TASK-RP-FE-08`)
    // ============================================
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        code: string;
        type: string;
        /** "Dt. Pedido" (ex-"Data da Solicitação") — só o rótulo mudou, o
         *  dado continua sendo `request_date`. */
        requestDate: string;
        /** "Descrição/Chamado" (ex-"Justificativa") — só o rótulo mudou, o
         *  dado continua sendo `justification`. */
        justification: string;
        /** ADITIVO — coluna "Duração", dado `duration_label`. */
        duration: string;
        /** ADITIVO — coluna "Solicitante", dado `user.name`. */
        requester: string;
        /** "Responsável Atual" (ex-"Responsável") — só o rótulo mudou, o
         *  dado continua sendo `responsible.name`. */
        responsible: string;
        /** ADITIVO — coluna "Fazenda", dado `farm.description`. */
        farm: string;
        status: string;
        priority: string;
        /** ADITIVO (TASK-CQ-FE-02, hub de Cotações) — coluna "Cotações",
         *  dado `quotations_count` (`RequestPurchaseResource::whenCounted`,
         *  só presente em `index()` — mirror `depreciations_count`). */
        quotations: string;
        actions: {
          view: string;
          edit: string;
          delete: string;
        };
      };
      emptyState: {
        titleEmpty: string;
        titleFiltered: string;
        descriptionEmpty: string;
        descriptionFiltered: string;
        cta: string;
      };
      deletedToast: string;
      /** 081/FE-05 — confirmação de exclusão com os literais do legado. */
      deleteConfirm: {
        title: string;
        description: string;
        confirm: string;
        cancel: string;
      };
    };

    // ============================================
    // FILTRO (drawer da listagem)
    // ============================================
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      type: string;
      status: string;
      dateFrom: string;
      dateTo: string;
      /** ADITIVO (TASK-CQ-FE-02, hub de Cotações, CL-058/CL-059) — 4 campos
       *  que faltavam no drawer (`SelectAsyncPaginate`/`Select`, mirror
       *  `FilterSideRomaneios.tsx`). `farm`/`requester`/`responsible` usam
       *  `*_uuid`+`*_label` companion no `RequestPurchaseFilterForm`
       *  (re-hidratação sem request extra, mesmo padrão de
       *  `TransferFilterForm`). */
      farm: string;
      requester: string;
      priority: string;
      responsible: string;
    };

    // ============================================
    // FORMULÁRIO ÚNICO (abas: Dados Gerais / Itens / Anexos / Histórico, `TASK-RP-FE-09`)
    // ============================================
    form: {
      title: { create: string; edit: string; view: string };
      subtitle: { create: string; edit: string; view: string };
      tabs: {
        general: string;
        items: string;
        attachments: string;
        history: string;
        /** ADITIVO (TASK-CQ-FE-03) — 5ª aba "Cotações", AUSENTE em modo
         *  criação (mesma regra de `history`). Conteúdo real da aba mora em
         *  `languageGB.requestQuotations.requestQuotation.tab.*`; esta chave
         *  é só o RÓTULO do `Tabs.Trigger` no formulário do pai. */
        quotations: string;
      };
      fields: {
        type: string;
        requestDate: string;
        justification: string;
        description: string;
        priority: string;
        authorizer: string;
        harvest: string;
        nfe: string;
        observation: string;
        /** 081/FE-05 — "Solicitante" somente leitura. */
        requester: string;
        /** UT-000743 — "Código" somente leitura (criar/editar/visualizar). */
        code: string;
      };
      placeholders: {
        type: string;
        justification: string;
        description: string;
        authorizer: string;
        harvest: string;
        nfe: string;
        observation: string;
      };
      itemsSection: {
        addButton: string;
        removeButton: string;
        emptyLabel: string;
        fields: {
          product: string;
          quantity: string;
          amount: string;
          name: string;
          nif: string;
          phone: string;
          /** ADITIVO — gap de caminho-de-escrita corrigido (Doc Bruta
           *  `RequestPurchase-Doc-Bruta.md` §12): visível/obrigatório em 8 dos
           *  11 tipos (P/M/U/S/A/R/F/E). */
          description: string;
          /** ADITIVO — visível/OPCIONAL somente no tipo Serviço (S). */
          observation: string;
          serviceDescription: string;
          /** 081/FE-05 — rótulo de C/B (legado: "Descrição de serviços"). */
          contractServiceDescription: string;
          dailyQuantity: string;
          deliveryDate: string;
        };
      };
      attachmentsSection: {
        addButton: string;
        removeButton: string;
        emptyLabel: string;
        fields: {
          name: string;
          file: string;
        };
        /** ⚠️ ADITIVO (`TASK-RP-FE-07`) — `TASK-RP-FE-03` não abriu chaves
         *  para os textos internos do `FileUpload` (dropzone/troca/
         *  substituição/erros de tipo-tamanho), mesma classe de aditivo já
         *  registrada em `itemStatusOptions` (`TASK-RP-FE-02`). Sem estas
         *  chaves, `RequestAttachmentRow.tsx` teria que renderizar os
         *  defaults em inglês hard-coded do componente (`FileUpload.tsx`,
         *  "nunca renderizados em produção" por convenção do projeto) — o
         *  que violaria a regra de zero string literal. Mirror
         *  `EquipamentoAnexosTab`/`languageEquipments.ts.form.attachmentRow`. */
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
      };
      historySection: {
        emptyLabel: string;
        columns: {
          status: string;
          justify: string;
          user: string;
          date: string;
          /** 081/FE-05 — "Tempo Gasto" (`elapsed_label` da API). */
          elapsed: string;
        };
      };
      /** 081/FE-05 — avisos e confirmações das linhas de item/anexo (legado). */
      guards: {
        addBlockedTitle: string;
        addBlockedDescription: string;
        removeConfirmTitle: string;
        removeConfirmDescription: string;
        removeConfirm: string;
        removeCancel: string;
        lastItemTitle: string;
        lastItemDescription: string;
        productAdd: string;
        productEdit: string;
      };
      /** 081/FE-05 — seções extras da visualização. */
      viewSections: {
        classification: string;
        classificationOptions: { N: string; C: string; O: string };
        financialDueDate: string;
        finalizationNote: string;
        responsible: string;
        duration: string;
        priority: string;
        type: string;
        authorizationTitle: string;
        authorizationDate: string;
        finalJustification: string;
        authorizer: string;
        receiptTitle: string;
        receiptDate: string;
        receiptNote: string;
        childrenTitle: string;
        ratioTitle: string;
        ratioCategory: string;
        ratioCenter: string;
        ratioPercent: string;
        approvedQuotationTitle: string;
        notInformed: string;
      };
      /** ⚠️ ADITIVO (`TASK-RP-FE-09`) — mesma classe de aditivo já registrada
       *  em `attachmentsSection.fileUpload`/`itemStatusOptions`: `TASK-RP-FE-03`
       *  não abriu chave para o texto explicativo do campo `type` travado
       *  (`disabled`) em modo edição (regra 14, imutabilidade) — sem ela, o
       *  formulário exibiria o campo desabilitado SEM nenhuma explicação ao
       *  usuário (violaria a leitura do dev da própria Tarefa: "não é
       *  ausência de permissão, é regra de negócio"). */
      hints: {
        typeLockedOnEdit: string;
        authorizerLoadError: string;
        /** UT-000743 — hint do código PREVISTO (modo criar). */
        codePreview: string;
        /** UT-000743 — falha/403 ao calcular o código previsto. */
        codePreviewUnavailable: string;
      };
      validation: {
        typeRequired: string;
        requestDateRequired: string;
        justificationRequired: string;
        justificationMaxLength: string;
        descriptionRequired: string;
        descriptionMaxLength: string;
        itemsMinOne: string;
        productRequiredForType: string;
        quantityRequiredForType: string;
        amountRequiredForType: string;
        nameRequiredForType: string;
        nifRequiredForType: string;
        phoneRequiredForType: string;
        descriptionRequiredForType: string;
        serviceDescriptionRequiredForType: string;
        dailyQuantityRequiredForType: string;
        attachmentFileRequiredForType: string;
        attachmentNameRequiredWithFile: string;
        nifMaxLength: string;
        phoneMaxLength: string;
        fileMaxLength: string;
        observationMaxLength: string;
        itemDescriptionMaxLength: string;
        itemServiceDescriptionMaxLength: string;
        itemObservationMaxLength: string;
        authorizerRequired: string;
        attachmentsMinOne: string;
        attachmentNameRequiredForType: string;
        attachmentNameMaxLength: string;
      };
    };

    // ============================================
    // AÇÕES DE TRÂMITE (receber/transferir/mudar status/finalizar/justificativa de cotação)
    // ============================================
    actions: {
      receiveToast: string;
      transferToast: string;
      changeStatusToast: string;
      finishToast: string;
      /** UT-000743 — toast do criar com o código DEFINITIVO (`{code}`). */
      createdWithCodeToast: string;
      quotationJustificationToast: string;
      transferJustifyRequired: string;
      changeStatusRequired: string;
      /** ⚠️ ADITIVO (`TASK-RP-FE-09`) — `TASK-RP-FE-03` só abriu os TOASTS de
       *  sucesso/erro das 5 ações de trâmite, não os RÓTULOS dos botões/
       *  diálogos que disparam cada ação (o formulário único, `TASK-RP-FE-09`,
       *  é quem primeiro precisa deles) — mesma classe de aditivo documentada
       *  em `form.attachmentsSection.fileUpload`. */
      receiveButton: string;
      transferButton: string;
      changeStatusButton: string;
      finishButton: string;
      quotationJustificationButton: string;
      transferDialogTitle: string;
      transferJustifyLabel: string;
      changeStatusDialogTitle: string;
      changeStatusNewStatusLabel: string;
      changeStatusJustifyLabel: string;
      quotationJustificationDialogTitle: string;
      quotationJustificationLabel: string;
    };

    // ============================================
    // OPÇÕES (fábricas em `@/constants/RequestPurchases/options`, `TASK-RP-FE-02`)
    // ============================================
    /** 11 labels — mirror `requestPurchaseType` enum. */
    typeOptions: {
      produto: string;
      servico: string;
      adiantamento: string;
      reembolso: string;
      diaria: string;
      empreitada: string;
      compraEfetuada: string;
      frete: string;
      manutencao: string;
      emergencial: string;
      despesaFixa: string;
    };

    /** 11 labels — mirror `requestPurchaseStatus` enum. */
    statusOptions: {
      solicitacao: string;
      cotacaoEmAndamento: string;
      aguardandoAprovacao: string;
      aguardandoCiencia: string;
      pedidoNaoAprovado: string;
      aguardandoCompra: string;
      compraEfetuada: string;
      compraRecebida: string;
      pedidoFinalizado: string;
      pedidoCancelado: string;
      analisarProcesso: string;
    };

    /** 3 labels — mirror `requestPurchasePriority` enum. */
    priorityOptions: {
      alta: string;
      media: string;
      baixa: string;
    };

    /** ⚠️ ADITIVO (`TASK-RP-FE-02`, mesma classe de aditivo já documentada em
     *  `ModuleEquipments.equipment.detail`/`.excel`): a ficha `TASK-RP-FE-03`
     *  não abriu labels próprios para o enum `RequestItemStatus` (só
     *  cabeçalho: type/status/priority) — mas a fábrica de opções de item
     *  (`request-item-status-options.ts`) exige rótulo derivado do i18n
     *  (regra de ouro, nunca string literal). 3 labels — mirror
     *  `requestItemStatus` enum. */
    itemStatusOptions: {
      pendente: string;
      entregue: string;
      cancelado: string;
    };

    // ============================================
    // "MEUS PROCESSOS" (`TASK-RP-FE-13`, GRUPO B) — reaproveita 100% do
    // `list.table`/`list.emptyState`/`filter` acima, só troca título/subtítulo
    // + `titleModule` dedicado (para derivar uma query-key/storageKey PRÓPRIA,
    // distinta de `requestPurchasesList`, evitando colisão de cache com a
    // listagem principal — `GetRequestPurchasesFE-04`/query-key.ts).
    // ============================================
    myProcesses: {
      /** Só para derivar `queryKey.requestPurchases.myProcessesList`/
       *  storageKey da grid — nunca renderizado. */
      titleModule: string;
      pageTitle: string;
      pageSubtitle: string;
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
      };
      /** ADITIVO (TASK-MP-FE-01, execução 039) — única coluna própria desta
       *  tela (o resto reaproveita `list.table.*`). */
      table: {
        quotationsReceived: string;
      };
      /** ADITIVO (TASK-MP-FE-01/02, execução 039) — ações de linha próprias
       *  desta tela (rótulo "Visualizar" substitui `list.table.actions.edit`
       *  aqui; "Voltar Etapa"/"Relatório SLA" reaproveitam o padrão já usado
       *  por `inPurchase`/`rejected`). */
      actions: {
        view: string;
        changeStatus: string;
        slaReport: string;
        /** ADENDO (`TASK-MP-FE-03`, decisão fechada do dono "replicar
         *  dropdown completo") — 2 chaves genuinamente NOVAS. As demais 5
         *  ações do dropdown completo (Excluir/Transferir/Informar Status/
         *  Sub Solicitação/Download) reusam `list.table.actions.delete`/
         *  `requestPurchase.actions.transferButton`/`inPurchase.actions.
         *  informStatus`/`createSubRequest`/`downloadPdf`, já existentes —
         *  sem chave nova para elas. */
        quote: string;
        sendForApproval: string;
        /** ADENDO (`TASK-MP-FE-04`, execução 039) — 2 chaves genuinamente
         *  NOVAS. "Editar" NÃO abre chave própria — reusa
         *  `list.table.actions.edit`, já existente (zero duplicação). */
        authorize: string;
        acknowledge: string;
      };
    };

    // ============================================
    // "REJEITADOS / CANCELADOS" (`TASK-RP-FE-13`, GRUPO B) — idem acima,
    // reaproveita `list.table`/`list.emptyState`/`filter`. Guard de rota/
    // permissão RESOLVIDO (GAP-UX-CPS-01, `97-Esteiras/036/GATE-DECISOES.md`)
    // — `request-purchases_view`, wired em `router/index.tsx`.
    // ============================================
    rejected: {
      titleModule: string;
      pageTitle: string;
      pageSubtitle: string;
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
      };
      actions: {
        /** ADITIVO (TASK-RC-FE-01, esteira 037) — "Relatório SLA" (mirror
         *  AM-01 do legado), SEMPRE visível (gate só por permissão
         *  `status-sla_report_view`, sem condição de status), navega para
         *  `/relatorios/suprimentos?uuid=${row.uuid}` (TASK-SLA-FE-02). */
        slaReport: string;
      };
    };

    // ============================================
    // "COTAÇÕES" (`TASK-CQ-FE-13`) — hub `/administrativo/cotacoes`,
    // TENANT-WIDE (não user-scoped como `list`), filtro `status IN [1,2]`
    // (`listRequestPurchasesInQuotation`, mirror `rejected`/`listRejected`).
    // Reaproveita 100% do `list.table`/`list.emptyState`/`filter` acima, só
    // troca título/subtítulo + `titleModule` dedicado (query-key/storageKey
    // PRÓPRIA, evita colisão de cache com `requestPurchasesList`).
    // ============================================
    inQuotation: {
      /** Só para derivar `queryKey.requestPurchases.inQuotationList`/
       *  storageKey da grid — nunca renderizado. */
      titleModule: string;
      pageTitle: string;
      pageSubtitle: string;
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
      };
    };

    // ============================================
    // "COMPRAS" (`TASK-CPS-FE-01`, esteira 97-Esteiras/036) — fila
    // `/administrativo/compras`, TENANT-WIDE (mirror `inQuotation` acima,
    // filtro `in-purchase` server-side). Reaproveita `list.table`/
    // `list.emptyState`/`filter` — só troca título/subtítulo + `titleModule`
    // dedicado (query-key/storageKey PRÓPRIA) e acrescenta a coluna/ações/
    // dialogs específicos desta tela (Informar Status / Criar Sub
    // Solicitação).
    // ============================================
    inPurchase: {
      /** Só para derivar `queryKey.requestPurchases.inPurchaseList`/
       *  storageKey da grid — nunca renderizado. */
      titleModule: string;
      pageTitle: string;
      pageSubtitle: string;
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
      };
      /** Única coluna ADITIVA vs a listagem já existente (`duration_label`,
       *  reaproveita `list.table.*` para o resto). */
      table: {
        duration: string;
      };
      actions: {
        /** ADITIVO (TASK-CPS-FE-02) — "Ver Solicitação" (AM-03 do legado),
         *  SEMPRE visível, navega para `/administrativo/solicitacao/${uuid}`
         *  (rota já existente/funcional — mirror `Rejeitados/index.tsx`). */
        view: string;
        whatsapp: string;
        email: string;
        downloadPdf: string;
        /** ADITIVO (execução 081, T-081-FE-09) — título dos ícones de envio do
         *  pedido na linha (legado LM-09: "Enviar pedido de compras."). */
        sendOrder: string;
        informStatus: string;
        createSubRequest: string;
        /** ADITIVO (TASK-CPS-FE-06) — item do dropdown que abre o dialog de
         *  rollback genérico (`change-status`, REAPROVEITADO de
         *  `changeRequestPurchaseStatus`/`RequestPurchaseChangeStatusPayload`,
         *  já usado por `CreateOrUpdateSolicitacao.tsx`). O TÍTULO/rótulos do
         *  dialog em si reaproveitam `actions.changeStatus*` (nível de módulo,
         *  não `inPurchase.*`) — só este rótulo de MENU é próprio da fila. */
        changeStatus: string;
      };
      dialogs: {
        /** ADITIVO (TASK-CPS-FE-06) — só o estado "sem transições" é próprio
         *  da fila Compras (a busca de `available_status_transitions` é
         *  dedicada, via `getRequestPurchase(uuid)` no `onOpen`, porque a
         *  linha da grade — `RequestPurchaseListItem` — não carrega esse
         *  campo, só `RequestPurchaseData`, o detalhe). O resto do dialog
         *  reaproveita `actions.changeStatus*`. */
        changeStatus: {
          noTransitions: string;
        };
        informStatus: {
          title: string;
          fields: {
            status: string;
            financialDueDate: string;
            justify: string;
            itemDeliveryDates: string;
            /** ADITIVO (execução 081) — campos somente leitura e tabela de itens do legado. */
            code: string;
            responsible: string;
            itemsTitle: string;
            itemColumns: {
              item: string;
              quantity: string;
              description: string;
              deliveryDate: string;
            };
          };
          /** Rótulos FIXOS de 7/10 (não `statusOptions` genérico do módulo —
           *  esta transição só tem 2 destinos possíveis nesta ação). */
          statusOptions: {
            effected: string;
            cancelled: string;
          };
          validation: {
            statusRequired: string;
            justifyRequired: string;
            justifyMax: string;
          };
        };
        separate: {
          title: string;
          subtitle: string;
          selectAll: string;
          deselectAll: string;
          selectedCount: string;
          itemsMinError: string;
          confirmButton: string;
          /** ADITIVO (execução 081, PS11) — cabeçalho, movimentações e aviso da tela de separação do legado. */
          headerTitle: string;
          observation: string;
          finalizationNote: string;
          movementsTitle: string;
          quotationsTitle: string;
        };
      };
      toasts: {
        informStatusSuccess: string;
        separateSuccess: string;
        whatsappGenerating: string;
        emailQueued: string;
        pdfReady: string;
        /** ADITIVO (TASK-CPS-FE-02) — fallback de erro compartilhado pelas 3
         *  ações de despacho (WhatsApp/E-mail/PDF) quando a resposta do
         *  servidor não trouxer uma `message` de negócio aproveitável (mirror
         *  `errorFallback` de `RequestQuotationEmailBatchModal.tsx`). */
        actionError: string;
      };
    };

    /**
     * ADITIVO (execução 081, T-081-FE-01) — catálogo de Suprimentos com os
     * LITERAIS DO LEGADO (rótulos, ações, filtros, toasts e diálogos
     * compartilhados). Consumido pelas listas de Solicitação, Meus Processos,
     * Rejeitados, Cotações e Compras e pelos componentes de
     * `components/Suprimentos/`. Os blocos antigos (`list`, `myProcesses`,
     * `inPurchase`...) continuam existindo até cada tela migrar para cá.
     */
    supply: {
      columns: {
        code: string;
        type: string;
        requestDate: string;
        description: string;
        duration: string;
        requester: string;
        responsible: string;
        responsibleShort: string;
        farm: string;
        action: string;
        receivedQuotations: string;
        nfe: string;
        updatedAt: string;
        launched: string;
      };
      filters: {
        searchPlaceholder: string;
        status: string;
        type: string;
        farm: string;
        requester: string;
        priority: string;
        dateStart: string;
        dateEnd: string;
        responsible: string;
        apply: string;
        clear: string;
      };
      list: {
        empty: string;
        recordsCount: string;
        legend: string;
        redoIndicator: string;
      };
      actions: {
        view: string;
        slaReport: string;
        edit: string;
        delete: string;
        receive: string;
        transfer: string;
        stepBack: string;
        quote: string;
        sendToAuthorization: string;
        authorize: string;
        acknowledge: string;
        informStatus: string;
        createSub: string;
        downloadFile: string;
        confirmReceipt: string;
        generateFinancial: string;
        finalize: string;
        quotationsMap: string;
      };
      transferDialog: {
        title: string;
        newResponsible: string;
        newResponsiblePlaceholder: string;
        justify: string;
        required: string;
        noUsers: string;
        loadError: string;
        retry: string;
        success: string;
      };
      stepBackDialog: {
        title: string;
        code: string;
        requestDate: string;
        duration: string;
        requester: string;
        farm: string;
        currentStatus: string;
        newStatus: string;
        newStatusPlaceholder: string;
        justify: string;
        justifyRequired: string;
        noTransitions: string;
        loadError: string;
        retry: string;
        success: string;
        error: string;
        cancel: string;
        save: string;
      };
      deniedModal: {
        title: string;
        link: string;
        close: string;
      };
      quotationsMap: {
        button: string;
        downloading: string;
        success: string;
        filename: string;
      };
    };
  };
}
