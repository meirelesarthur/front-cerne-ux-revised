// src/constants/languages/languagePtBr/languageRequestPurchases.ts
// Tradução pt-BR do módulo "Solicitação de Compras" (RequestPurchase —
// Administrativo / Suprimentos, esteira 97-Esteiras/022, TASK-RP-FE-03). Ver
// `@/@types/language/module-request-purchases` para o contrato completo.

import { ModuleRequestPurchases } from '@/@types/language/module-request-purchases';

export const languageRequestPurchases: ModuleRequestPurchases = {
  requestPurchase: {
    singularLabel: 'Solicitação de Compra',
    pluralLabel: 'Solicitações de Compra',
    titleModule: 'Solicitação de Compras',

    // ⚠️ ADITIVO (TASK-CQ-FE-15) — ver nota em
    // `ModuleRequestPurchases.requestPurchase.legend`.
    legend: {
      label: 'Legenda',
    },

    list: {
      pageTitle: 'Solicitações de Compra',
      pageSubtitle: 'Gerencie as solicitações de compra da fazenda.',
      table: {
        code: 'Código',
        type: 'Tipo',
        requestDate: 'Dt. Pedido',
        justification: 'Descrição/Chamado',
        duration: 'Duração',
        requester: 'Solicitante',
        responsible: 'Responsável Atual',
        farm: 'Fazenda',
        status: 'Status',
        priority: 'Prioridade',
        quotations: 'Cotações',
        actions: {
          view: 'Visualizar',
          edit: 'Editar',
          delete: 'Excluir',
        },
      },
      emptyState: {
        titleEmpty: 'Nenhuma solicitação cadastrada',
        titleFiltered: 'Nenhuma solicitação encontrada',
        descriptionEmpty: 'Cadastre a primeira Solicitação de Compra.',
        descriptionFiltered: 'Ajuste os filtros para encontrar o que procura.',
        cta: 'Nova Solicitação',
      },
      deletedToast: 'Registro deletado com sucesso.',
      deleteConfirm: {
        title: 'Você está certo ?',
        description: 'Uma vez deletado, você não poderá recuperar esse item novamente!',
        confirm: 'Excluir',
        cancel: 'Cancelar',
      },
    },

    filter: {
      title: 'Filtrar Solicitações',
      search: 'Buscar',
      searchPlaceholder: 'Pesquisar por descrição/chamado/código',
      type: 'Tipo',
      status: 'Status',
      dateFrom: 'Data inicial',
      dateTo: 'Data final',
      farm: 'Fazenda',
      requester: 'Solicitante',
      priority: 'Prioridade',
      responsible: 'Responsável Atual',
    },

    form: {
      title: {
        create: 'Nova Solicitação de Compra',
        edit: 'Editar Solicitação de Compra',
        view: 'Visualizar Solicitação de Compra',
      },
      subtitle: {
        create: 'Cadastre uma nova solicitação de compra.',
        edit: 'Atualize os dados da solicitação de compra.',
        view: 'Visualize os dados da solicitação de compra.',
      },
      tabs: {
        general: 'Dados Gerais',
        items: 'Itens',
        attachments: 'Anexos',
        history: 'Histórico',
        quotations: 'Cotações',
      },
      fields: {
        type: 'Tipo',
        requestDate: 'Data do Pedido',
        justification: 'Justificativa',
        description: 'Descrição/Chamado',
        priority: 'Prioridade',
        authorizer: 'Encarregado',
        harvest: 'Safra',
        nfe: 'NF-e',
        observation: 'Observação',
        code: 'Código',
        requester: 'Solicitante',
      },
      placeholders: {
        type: 'Selecione o tipo',
        justification: 'Descreva o motivo da solicitação',
        description: 'Descreva os detalhes da solicitação',
        authorizer: 'Selecione o encarregado',
        harvest: 'Busque uma safra',
        nfe: 'Número da nota fiscal',
        observation: 'Observações adicionais',
      },
      itemsSection: {
        addButton: '+ Adicionar Item',
        removeButton: 'Remover',
        emptyLabel: 'Nenhum item adicionado',
        fields: {
          product: 'Produto',
          quantity: 'Quantidade',
          amount: 'Valor',
          name: 'Nome',
          nif: 'CPF',
          phone: 'Telefone',
          description: 'Descrição',
          observation: 'Observação',
          serviceDescription: 'Descrição do Serviço',
          contractServiceDescription: 'Descrição de serviços',
          dailyQuantity: 'Quantidade de Diárias',
          deliveryDate: 'Data de Entrega',
        },
      },
      attachmentsSection: {
        addButton: '+ Adicionar Anexo',
        removeButton: 'Remover',
        emptyLabel: 'Nenhum anexo adicionado',
        fields: {
          name: 'Descrição do Anexo',
          file: 'Arquivo',
        },
        // ⚠️ ADITIVO (TASK-RP-FE-07) — ver nota em
        // `@/@types/language/module-request-purchases`.
        fileUpload: {
          dropzoneTitle: 'Arraste um arquivo ou clique para selecionar',
          dropzoneDraggingTitle: 'Solte o arquivo aqui',
          changeFileLabel: 'Trocar arquivo',
          removeFileLabel: 'Remover arquivo',
          replaceFileLabel: 'Substituir arquivo',
          existingFileLabel: 'Arquivo atual',
          errorTypeMessage: 'Tipo de arquivo não aceito.',
          errorSizeMessage: 'Arquivo excede o tamanho máximo.',
        },
      },
      historySection: {
        emptyLabel: 'Nenhum trâmite registrado',
        columns: {
          status: 'Status',
          justify: 'Descrição/Justificativa',
          user: 'Responsável',
          date: 'Data',
          elapsed: 'Tempo Gasto',
        },
      },
      guards: {
        addBlockedTitle: 'Atenção',
        addBlockedDescription: 'Preencha todos os campos antes de adicionar novos.',
        removeConfirmTitle: 'Você está certo ?',
        removeConfirmDescription: 'Deseja remover esse item mesmo?',
        removeConfirm: 'Remover',
        removeCancel: 'Cancelar',
        lastItemTitle: 'Atenção',
        lastItemDescription: 'Você deve ter ao menos um item na lista',
        productAdd: 'Cadastrar produto',
        productEdit: 'Editar produto',
      },
      viewSections: {
        classification: 'Classificação',
        classificationOptions: { N: 'Não Classificado', C: 'CAPEX', O: 'OPEX' },
        financialDueDate: 'Venc. Financeiro',
        finalizationNote: 'Observação Final',
        responsible: 'Responsável Atual',
        duration: 'Duração',
        priority: 'Prioridade',
        type: 'Tipo',
        authorizationTitle: 'Autorização',
        authorizationDate: 'Data da Autorização',
        finalJustification: 'Comentário da Aprovação',
        authorizer: 'Autorizador',
        receiptTitle: 'Recebimento',
        receiptDate: 'Data do Recebimento',
        receiptNote: 'Observação do Recebimento',
        childrenTitle: 'Sub Solicitações',
        ratioTitle: 'Rateio',
        ratioCategory: 'Categoria',
        ratioCenter: 'Centro de Custo',
        ratioPercent: 'Porcentagem',
        approvedQuotationTitle: 'Cotação Aprovada',
        notInformed: 'Não informado',
      },
      // ⚠️ ADITIVO (TASK-RP-FE-09) — ver nota em
      // `@/@types/language/module-request-purchases`.
      hints: {
        typeLockedOnEdit:
          'O tipo não pode ser alterado após a criação da solicitação (regra de negócio, não é falta de permissão).',
        authorizerLoadError: 'Não foi possível carregar os encarregados.',
        codePreview: 'Código previsto; o definitivo é atribuído ao salvar.',
        codePreviewUnavailable: 'Não foi possível calcular o código previsto.',
      },
      validation: {
        typeRequired: 'Tipo é obrigatório',
        requestDateRequired: 'Data da Solicitação é obrigatória',
        justificationRequired: 'Justificativa é obrigatória',
        justificationMaxLength: 'Justificativa deve ter no máximo 800 caracteres',
        descriptionRequired: 'Descrição é obrigatória',
        descriptionMaxLength: 'Descrição deve ter no máximo 800 caracteres',
        itemsMinOne: 'Adicione ao menos um item',
        productRequiredForType: 'Produto é obrigatório para este tipo de solicitação',
        quantityRequiredForType: 'Quantidade é obrigatória para este tipo de solicitação',
        amountRequiredForType: 'Valor é obrigatório para este tipo de solicitação',
        nameRequiredForType: 'Nome é obrigatório para este tipo de solicitação',
        nifRequiredForType: 'NIF é obrigatório para este tipo de solicitação',
        phoneRequiredForType: 'Telefone é obrigatório para este tipo de solicitação',
        descriptionRequiredForType: 'Descrição é obrigatória para este tipo de solicitação',
        serviceDescriptionRequiredForType:
          'Descrição do Serviço é obrigatória para este tipo de solicitação',
        dailyQuantityRequiredForType:
          'Quantidade de Diárias é obrigatória para este tipo de solicitação',
        attachmentFileRequiredForType: 'Arquivo é obrigatório para este tipo de solicitação',
        attachmentNameRequiredWithFile: 'Descrição do Anexo é obrigatória quando há arquivo',
        nifMaxLength: 'NIF deve ter no máximo 20 caracteres',
        phoneMaxLength: 'Telefone deve ter no máximo 15 caracteres',
        fileMaxLength: 'Arquivo deve ter no máximo 10240 KB',
        observationMaxLength: 'Observação deve ter no máximo 800 caracteres',
        itemDescriptionMaxLength: 'Descrição do item deve ter no máximo 60 caracteres',
        itemServiceDescriptionMaxLength: 'Descrição do serviço deve ter no máximo 200 caracteres',
        itemObservationMaxLength: 'Observação do item deve ter no máximo 90 caracteres',
        authorizerRequired: 'Informe o Encarregado',
        attachmentsMinOne: 'Adicione ao menos um anexo',
        attachmentNameRequiredForType: 'Descrição do Anexo é obrigatória para este tipo de solicitação',
        attachmentNameMaxLength: 'Descrição do Anexo deve ter no máximo 120 caracteres',
      },
    },

    actions: {
      receiveToast: 'Solicitação recebida com sucesso.',
      transferToast: 'Solicitação transferida com sucesso.',
      changeStatusToast: 'Status alterado com sucesso.',
      finishToast: 'Solicitação finalizada com sucesso.',
      createdWithCodeToast: 'Solicitação {code} criada com sucesso.',
      quotationJustificationToast: 'Justificativa de cotação adicionada com sucesso.',
      transferJustifyRequired: 'Justificativa é obrigatória para transferir',
      changeStatusRequired: 'Selecione o novo status',
      // ⚠️ ADITIVO (TASK-RP-FE-09) — ver nota em
      // `@/@types/language/module-request-purchases`.
      receiveButton: 'Receber',
      transferButton: 'Transferir',
      changeStatusButton: 'Voltar Etapa',
      finishButton: 'Finalizar',
      quotationJustificationButton: 'Justificativa de Cotação',
      transferDialogTitle: 'Transferir Solicitação',
      transferJustifyLabel: 'Justificativa da Transferência',
      changeStatusDialogTitle: 'Mudar Status da Solicitação',
      changeStatusNewStatusLabel: 'Novo Status',
      changeStatusJustifyLabel: 'Justificativa',
      quotationJustificationDialogTitle: 'Adicionar Justificativa de Cotação',
      quotationJustificationLabel: 'Justificativa da Cotação',
    },

    typeOptions: {
      produto: 'Produto',
      servico: 'Serviço',
      adiantamento: 'Adiantamento',
      reembolso: 'Reembolso',
      diaria: 'Diária',
      empreitada: 'Empreita',
      compraEfetuada: 'Compra Efetuada',
      frete: 'Frete',
      manutencao: 'Manutenção',
      emergencial: 'Emergencial',
      despesaFixa: 'Despesas Fixas',
    },

    statusOptions: {
      solicitacao: 'Solicitação',
      cotacaoEmAndamento: 'Cotação em Andamento',
      aguardandoAprovacao: 'Aguardando Aprovação',
      aguardandoCiencia: 'Aguardando Ciência',
      pedidoNaoAprovado: 'Pedido Não Aprovado',
      aguardandoCompra: 'Aguardando a Compra',
      compraEfetuada: 'Compra Efetuada',
      compraRecebida: 'Compra Recebida',
      pedidoFinalizado: 'Pedido Finalizado',
      pedidoCancelado: 'Pedido Cancelado',
      analisarProcesso: 'Analisar Processo',
    },

    priorityOptions: {
      alta: 'Alta',
      media: 'Média',
      baixa: 'Baixa',
    },

    // ⚠️ ADITIVO (TASK-RP-FE-02) — labels do enum `RequestItemStatus`, ver
    // nota em `ModuleRequestPurchases.requestPurchase.itemStatusOptions`.
    itemStatusOptions: {
      pendente: 'Pendente',
      entregue: 'Entregue',
      cancelado: 'Cancelado',
    },

    // ⚠️ ADITIVO (TASK-RP-FE-13, GRUPO B) — ver nota em
    // `ModuleRequestPurchases.requestPurchase.myProcesses`.
    myProcesses: {
      titleModule: 'Meus Processos',
      pageTitle: 'Meus Processos',
      pageSubtitle: 'Solicitações de compra sob sua responsabilidade.',
      emptyState: {
        titleEmpty: 'Nenhum processo sob sua responsabilidade',
        descriptionEmpty: 'Solicitações atribuídas a você aparecerão aqui.',
      },
      table: {
        quotationsReceived: 'Cot. Recebidas',
      },
      actions: {
        view: 'Visualizar',
        changeStatus: 'Voltar Etapa',
        slaReport: 'Relatório SLA',
        // ADENDO (`TASK-MP-FE-03`) — 2 chaves NOVAS; as demais 5 ações do
        // dropdown completo reusam chaves já existentes (ver nota no tipo).
        quote: 'Cotar Pedido',
        sendForApproval: 'Enviar para Aprovação',
        // ADENDO (`TASK-MP-FE-04`) — 2 chaves NOVAS; "Editar" reusa
        // `list.table.actions.edit`, já existente (zero duplicação).
        authorize: 'Autorizar',
        acknowledge: 'Acusar Ciência',
      },
    },

    // ⚠️ ADITIVO (TASK-RP-FE-13, GRUPO B) — ver nota em
    // `ModuleRequestPurchases.requestPurchase.rejected`.
    rejected: {
      titleModule: 'Rejeitados e Cancelados',
      pageTitle: 'Rejeitados / Cancelados',
      pageSubtitle: 'Solicitações de compra rejeitadas ou canceladas.',
      emptyState: {
        titleEmpty: 'Nenhuma solicitação rejeitada ou cancelada',
        descriptionEmpty: 'Solicitações rejeitadas ou canceladas aparecerão aqui.',
      },
      actions: {
        slaReport: 'Relatório SLA',
      },
    },

    // ⚠️ ADITIVO (TASK-CQ-FE-13) — ver nota em
    // `ModuleRequestPurchases.requestPurchase.inQuotation`.
    inQuotation: {
      titleModule: 'Cotações',
      pageTitle: 'Cotações',
      pageSubtitle: 'Solicitações de compra em cotação em toda a fazenda.',
      emptyState: {
        titleEmpty: 'Nenhuma solicitação em cotação',
        descriptionEmpty: 'Solicitações em cotação aparecerão aqui.',
      },
    },

    // ⚠️ ADITIVO (TASK-CPS-FE-01, esteira 036) — ver nota em
    // `ModuleRequestPurchases.requestPurchase.inPurchase`.
    inPurchase: {
      titleModule: 'Compras',
      pageTitle: 'Compras',
      pageSubtitle: 'Solicitações de compra em compra em toda a fazenda.',
      emptyState: {
        titleEmpty: 'Nenhuma solicitação em compra',
        descriptionEmpty: 'Solicitações em compra aparecerão aqui.',
      },
      table: {
        duration: 'Duração',
      },
      actions: {
        view: 'Ver Solicitação',
        whatsapp: 'Enviar por WhatsApp',
        email: 'Enviar por E-mail',
        downloadPdf: 'Baixar PDF',
        sendOrder: 'Enviar pedido de compras.',
        informStatus: 'Informar Status',
        createSubRequest: 'Criar Sub Solicitação',
        // ADITIVO (TASK-CPS-FE-06) — dialog reaproveita `actions.changeStatus*`.
        changeStatus: 'Voltar Etapa',
      },
      dialogs: {
        // ADITIVO (TASK-CPS-FE-06) — só o estado vazio é próprio desta fila.
        changeStatus: {
          noTransitions: 'Nenhuma transição de status disponível para esta solicitação.',
        },
        informStatus: {
          title: 'Informar Status da Compra',
          fields: {
            status: 'Status',
            financialDueDate: 'Venc. Financeiro',
            justify: 'Observações',
            itemDeliveryDates: 'Datas de Previsão dos Itens',
            code: 'Código',
            responsible: 'Responsável',
            itemsTitle: 'Itens da Solicitação',
            itemColumns: {
              item: 'Item',
              quantity: 'Quantidade',
              description: 'Descrição',
              deliveryDate: 'Dt. Entrega',
            },
          },
          statusOptions: {
            effected: 'Compra Efetuada',
            cancelled: 'Pedido Cancelado',
          },
          validation: {
            statusRequired: 'Status é obrigatório',
            justifyRequired: 'Justificativa é obrigatória',
            justifyMax: 'Justificativa deve ter no máximo 400 caracteres',
          },
        },
        separate: {
          title: 'Criar Sub Solicitação',
          subtitle: 'Selecione a cotação e os produtos/serviços que irão para a sub solicitação.',
          selectAll: 'Selecionar todos',
          deselectAll: 'Desmarcar todos',
          selectedCount: 'itens selecionados',
          itemsMinError: 'Selecione ao menos um item',
          confirmButton: 'Criar Sub Solicitação',
          headerTitle: 'Informação do Pedido',
          observation: 'Observações',
          finalizationNote: 'Observação Final',
          movementsTitle: 'Movimentações',
          quotationsTitle: 'Cotações',
        },
      },
      toasts: {
        informStatusSuccess: 'Registro atualizado com sucesso.',
        separateSuccess: 'Sub solicitação criada com sucesso.',
        whatsappGenerating: 'Gerando link do WhatsApp...',
        emailQueued: 'E-mail enfileirado para envio.',
        pdfReady: 'PDF pronto para download.',
        actionError: 'Não foi possível concluir a ação. Tente novamente.',
      },
    },

    // ADITIVO (execução 081, T-081-FE-01) — ver nota em
    // `ModuleRequestPurchases.requestPurchase.supply`.
    supply: {
      columns: {
        code: 'Código',
        type: 'Tipo',
        requestDate: 'Dt. Pedido',
        description: 'Descrição/Chamado',
        duration: 'Duração',
        requester: 'Solicitante',
        responsible: 'Responsável Atual',
        responsibleShort: 'Resp. Atual',
        farm: 'Fazenda',
        action: 'Ação',
        receivedQuotations: 'Cot. Recebidas',
        nfe: 'Nº NFe',
        updatedAt: 'Dt. Atualização',
        launched: 'Lançado',
      },
      filters: {
        searchPlaceholder: 'Pesquisar por descrição/chamado/código',
        status: 'Status',
        type: 'Tipo',
        farm: 'Fazenda',
        requester: 'Solicitante',
        priority: 'Prioridade',
        dateStart: 'Pedido / Dt. Início',
        dateEnd: 'Pedido / Dt. Fim',
        responsible: 'Responsável Atual',
        apply: 'Filtrar',
        clear: 'Limpar',
      },
      list: {
        empty: 'Nenhuma informação cadastrada.',
        recordsCount: 'N. Registros: {total}',
        legend: 'Legenda',
        redoIndicator: 'Refazer',
      },
      actions: {
        view: 'Visualizar',
        slaReport: 'Relatório SLA',
        edit: 'Editar',
        delete: 'Excluir',
        receive: 'Receber Solicitação',
        transfer: 'Transferir Responsável',
        stepBack: 'Voltar Etapa',
        quote: 'Cotar Pedido',
        sendToAuthorization: 'Enviar Autorização',
        authorize: 'Autorizar',
        acknowledge: 'Acusar ciência',
        informStatus: 'Informar Status',
        createSub: 'Criar Sub Solicitação',
        downloadFile: 'Download Arquivo',
        confirmReceipt: 'Confirmar Recebimento',
        generateFinancial: 'Gerar Financeiro',
        finalize: 'Finalizar Pedido',
        quotationsMap: 'Mapa de Cotações',
      },
      transferDialog: {
        title: 'Transferir Responsável',
        newResponsible: 'Novo Responsável',
        newResponsiblePlaceholder: 'Selecione',
        justify: 'Justificativa',
        required: 'Este campo deve ser preenchido.',
        noUsers: 'Nenhum usuário disponível',
        loadError: 'Não foi possível carregar os usuários.',
        retry: 'Tentar novamente',
        success: 'Solicitação alterada com sucesso.',
      },
      stepBackDialog: {
        title: 'Voltar Etapa da Solicitação',
        code: 'Código',
        requestDate: 'Dt. Pedido',
        duration: 'Duração',
        requester: 'Solicitante',
        farm: 'Fazenda',
        currentStatus: 'Status Atual',
        newStatus: 'Mudar para Status',
        newStatusPlaceholder: 'Selecione',
        justify: 'Justificativa',
        justifyRequired: 'A justificativa deve ser preenchida.',
        noTransitions: 'Nenhuma etapa anterior disponível para esta solicitação.',
        loadError: 'Não foi possível carregar os usuários.',
        retry: 'Tentar novamente',
        success: 'Status atualizado com sucesso!',
        error: 'Ocorreu um erro ao atualizar status da solicitação!',
        cancel: 'Cancelar',
        save: 'Salvar',
      },
      deniedModal: {
        title: 'Sua(s) solicitação(ões) foram negada(s):',
        link: 'Clique aqui para ver',
        close: 'Fechar',
      },
      quotationsMap: {
        button: 'Mapa de Cotações',
        downloading: 'Gerando o Mapa de Cotações...',
        success: 'Mapa de Cotações gerado com sucesso.',
        filename: 'mapa-de-cotacoes.xlsx',
      },
    },
  },
};
