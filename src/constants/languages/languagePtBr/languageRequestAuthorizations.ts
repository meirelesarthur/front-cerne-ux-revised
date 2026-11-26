// src/constants/languages/languagePtBr/languageRequestAuthorizations.ts
// Tradução pt-BR do módulo "Autorização" (RequestAuthorization — Administrativo
// / Suprimentos, esteira 97-Esteiras/038, TASK-AUTH-FE-01). Ver
// `@/@types/language/module-request-authorizations` para o contrato completo e
// a nota de convivência (arquivo dedicado, não acrescentado a
// `languageRequestPurchases.ts`, que está sob edição concorrente da execução 039).

import { ModuleRequestAuthorizations } from '@/@types/language/module-request-authorizations';

export const languageRequestAuthorizations: ModuleRequestAuthorizations = {
  requestAuthorization: {
    singularLabel: 'Autorização',
    pluralLabel: 'Autorizações',
    titleModule: 'Autorização',
    pageTitle: 'Autorização',
    pageSubtitle: 'Solicitações de compra aguardando aprovação ou ciência.',

    list: {
      table: {
        code: 'Código',
        status: 'Status',
        requestDate: 'Dt. Pedido',
        description: 'Descrição/Chamado',
        duration: 'Duração',
        requester: 'Solicitante',
        responsible: 'Responsável Atual',
        farm: 'Fazenda',
        actions: {
          view: 'Visualizar',
        },
      },
      emptyState: {
        titleEmpty: 'Nenhuma pendência de autorização',
        titleFiltered: 'Nenhuma solicitação encontrada',
        descriptionEmpty: 'Solicitações aguardando aprovação ou ciência aparecerão aqui.',
        descriptionFiltered: 'Ajuste os filtros para encontrar o que procura.',
      },
    },

    filter: {
      title: 'Filtrar Autorizações',
      search: 'Buscar',
      searchPlaceholder: 'Pesquisar por descrição/chamado/código',
      type: 'Tipo',
      status: 'Status',
      dateFrom: 'Data inicial',
      dateTo: 'Data final',
    },

    validation: {
      finalJustificationRequired: 'Justificativa é obrigatória',
      justifyRequired: 'Justificativa é obrigatória',
      justifyTooLong: 'A justificativa deve ter no máximo 400 caracteres',
      authorizerRequired: 'Autorizador é obrigatório',
      responsibleRequired: 'Responsável é obrigatório',
      statusRequired: 'Status é obrigatório',
      quantityRequired: 'Quantidade é obrigatória',
      quantityMin: 'Quantidade deve ser maior que zero',
      commentRequired: 'Comentário é obrigatório',
      categoryRequired: 'Categoria financeira é obrigatória',
      centerRequired: 'Centro de custo é obrigatório',
      percentRequired: 'Percentual é obrigatório',
      percentSumInvalid: 'A soma dos percentuais do rateio deve ser 100%',
    },

    detail: {
      approvalTitle: 'Autorização de Compra',
      acknowledgeTitle: 'Acusar Ciência',
      errorState: {
        title: 'Não foi possível carregar a solicitação',
        description: 'Verifique sua conexão e tente novamente.',
        retry: 'Tentar novamente',
      },

      info: {
        title: 'Informações da Solicitação',
        code: 'Código',
        requestDate: 'Data do Pedido',
        duration: 'Duração',
        type: 'Tipo',
        priority: 'Prioridade',
        nfe: 'Nfe',
        requester: 'Solicitante',
        responsible: 'Responsável Atual',
        justification: 'Justificativa',
        description: 'Descrição/Chamado',
        observation: 'Observação',
        finalizationNote: 'Observação Final',
        quotationJustification: 'Justificativa da cotação',
      },

      attachments: {
        title: 'Anexos',
        empty: 'Nenhum anexo.',
      },

      movements: {
        title: 'Movimentações',
      },

      items: {
        title: 'Itens para Aprovação',
        readOnlyTitle: 'Produtos/Serviços',
        hint: 'Selecione os itens que deseja autorizar para compra e as cotação que deseja aprovar',
        recordsCount: 'N. Registros:',
        table: {
          select: 'Selecionar',
          product: 'Produto',
          service: 'Serviço',
          serviceDescription: 'Descrição do serviço',
          description: 'Descrição',
          name: 'Nome',
          quantity: 'Qtd',
          value: 'Valor',
          dailyQuantity: 'Quantidade de Diárias',
          observation: 'Observação',
          actions: 'Ações',
        },
        editButton: 'Editar',
        empty: 'Nenhuma informação cadastrada.',
      },

      editItem: {
        title: 'Editar Item',
        quantityLabel: 'Quantidade',
        submit: 'Salvar',
        toast: 'Item atualizado com sucesso.',
      },

      quotations: {
        title: 'Cotações',
        hint: 'Selecione as formas de pagamento que deseja das cotações',
        recordsCount: 'N. Registros:',
        table: {
          select: 'Selecionar',
          date: 'Dt. Cotação',
          provider: 'Fornecedor',
          payment: 'Forma de pagamento',
          total: 'Vl.Total',
          net: 'Valor com Desconto',
          responsible: 'Responsável',
          actions: 'Ações',
        },
        choosePaymentButton: 'Escolher a forma de pagamento',
        viewButton: 'Visualizar',
        empty: 'Nenhuma informação cadastrada.',
        errorState: {
          title: 'Não foi possível carregar as cotações',
          description: 'Verifique sua conexão e tente novamente.',
          retry: 'Tentar novamente',
        },
      },

      choosePayment: {
        title: 'Formas de pagamento',
        table: {
          method: 'Forma de pagamento',
          installments: 'Parcelas',
          interval: 'Intervalo (dias)',
          installmentValue: 'Valor da Parcela',
          total: 'Total',
          actions: 'Ações',
        },
        selectButton: 'Selecionar',
        empty: 'Nenhuma forma de pagamento disponível para esta cotação.',
        selectedToast: 'Forma de pagamento selecionada com sucesso.',
      },

      ratio: {
        title: 'Rateio',
        classificationLabel: 'Classificação',
        classificationHelp:
          'CAPEX: Investimentos de longo prazo, como aquisição de bens que serão usados por mais de um ano (equipamentos, prédios, etc.).\nOPEX: Despesas operacionais recorrentes, como salários, aluguel, contas de utilidade, manutenção e outros custos diários.',
        classificationOptions: { N: 'Não Classificado', C: 'CAPEX', O: 'OPEX' },
        harvestLabel: 'Safra',
        harvestPlaceholder: 'Selecione',
        categoryLabel: 'Categoria',
        categoryPlaceholder: 'Digite ao menos 3 letras',
        categoryMinChars: 'Digite ao menos 3 letras para buscar.',
        centerLabel: 'Centro de Custo',
        centerPlaceholder: 'Selecione',
        percentLabel: 'Porcentagem (%)',
        addRowButton: 'Adicionar Item',
        removeRowButton: 'Remover',
        totalLabel: 'Total',
      },

      clientValidation: {
        warningTitle: 'Atenção',
        commentRequired: 'Informe um comentário',
        quotationRequired: 'Selecione pelo menos uma cotação',
        itemsRequired: 'Você deve selecionar os itens para autorizar.',
        singleItemQuotations: 'Apenas uma cotação pode ser selecionada para autorização de um único item por solicitação.',
        ratioSumInvalid: 'A soma das porcentagens do Rateio deve ser igual a 100.',
        categoryRequired: 'Selecione uma categoria',
        centerRequired: 'Selecione um centro de custo',
        ratioOverflow: 'A soma dos valores da porcentagem ultrapassam 100%.',
      },

      justify: {
        label: 'Adicionar Comentário/Justificativa',
        addComment: 'Adicionar Comentário',
        commentToast: 'Comentário adicionado com sucesso.',
      },

      actions: {
        updateToast: 'Registro atualizado com sucesso.',
        transfer: 'Transf. Responsável',
        transferToast: 'Solicitação alterada com sucesso.',
        back: 'Voltar Etapa',
        next: 'Próxima Etapa',
        reject: 'Reprovar',
        autoPromoteError: 'Não foi possível atualizar a solicitação automaticamente. Recarregue a página.',
      },
    },

    sendForAuthorization: {
      title: 'Enviar para Autorização',
      authorizerLabel: 'Autorizador',
      authorizerPlaceholder: 'Selecione',
      justifyLabel: 'Comentário/Justificativa',
      emptyEligibleState: {
        description: 'Nenhum autorizador elegível no momento para esta solicitação.',
      },
      sendButton: 'Enviar',
    },
  },
};
