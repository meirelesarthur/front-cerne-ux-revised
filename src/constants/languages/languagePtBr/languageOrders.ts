// src/constants/languages/languagePtBr/languageOrders.ts
// Tradução PT-BR do módulo "Pedidos" (Order — Operacional / Vendas, F-051,
// 97-Esteiras/043, PED-FE-01 — fundação).

import { ModuleOrders } from '@/@types/language/module-orders';

export const languageOrders: ModuleOrders = {
  order: {
    singularLabel: 'Pedido',
    pluralLabel: 'Pedidos',
    titleModule: 'Pedidos',

    list: {
      pageTitle: 'Pedidos',
      table: {
        columns: {
          status: 'Status',
          code: 'Nº',
          date: 'Data',
          client: 'Cliente',
          user: 'Responsável',
          total: 'Vl. Total',
          actions: 'Ações',
        },
        actions: {
          view: 'Ver',
          edit: 'Editar',
          delete: 'Excluir',
          print: 'Imprimir',
          generateSale: 'Gerar Venda',
          generateSaleTooltip: 'Disponível apenas para pedidos em aberto ou em processamento.',
          editDisabledTooltip: 'Só é possível editar pedidos em aberto ou em processamento.',
          deleteDisabledTooltip: 'Só é possível excluir pedidos em aberto ou em processamento.',
        },
      },
      emptyState: {
        titleEmpty: 'Nenhum pedido cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro pedido.',
        titleFiltered: 'Nenhum pedido encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar Pedido',
      },
      deletedToast: 'Pedido removido com sucesso',
      printErrorToast: 'Não foi possível gerar o PDF do pedido.',
      deleteConfirm: {
        title: 'Tem certeza?',
        description: 'Esta ação não poderá ser desfeita.',
      },
      error: {
        message: 'Não foi possível carregar os pedidos.',
        retry: 'Tentar novamente',
      },
    },

    filter: {
      title: 'Filtrar pedidos',
      search: 'Nº',
      searchPlaceholder: 'Buscar por número',
      product: 'Produto',
      productPlaceholder: 'Buscar por produto',
      client: 'Cliente',
      clientPlaceholder: 'Buscar por cliente',
      startDate: 'Data inicial',
      endDate: 'Data final',
      paginationQuantity: 'Registros por página',
    },

    detail: {
      notFound: {
        title: 'Pedido não encontrado',
        description: 'O pedido solicitado não existe ou foi removido.',
        back: 'Voltar para a listagem',
      },
      backButton: 'Voltar',
      editButton: 'Editar',
      printButton: 'Imprimir',
      generateSaleButton: 'Gerar Venda',
      sections: {
        header: 'Dados do Pedido',
        items: 'Itens',
        payment: 'Pagamento',
        totals: 'Totais',
      },
      emptyItems: 'Nenhum item cadastrado.',
      originBudgetLabel: 'Origem: Orçamento',
      dates: {
        createdAt: 'Criado em',
        updatedAt: 'Atualizado em',
      },
    },

    status: {
      emAberto: 'Em Aberto',
      emProcessamento: 'Em Processamento',
      finalizado: 'Finalizado',
      cancelado: 'Cancelado',
    },

    hasInputOptions: {
      sim: 'Sim',
      nao: 'Não',
    },

    fiscalDocumentOptions: {
      sim: 'Sim',
      nao: 'Não',
    },

    form: {
      title: {
        create: 'Novo Pedido',
        edit: 'Editar Pedido',
      },
      sections: {
        header: 'Dados do Pedido',
        items: 'Itens do Pedido',
        payment: 'Pagamento',
      },
      fields: {
        header: {
          code: 'Número',
          user: 'Responsável',
          date: 'Data',
          client: 'Cliente',
          note: 'Observação',
        },
        footer: {
          subtotal: 'Subtotal',
          freight: 'Frete',
          discount: 'Desconto',
          total: 'Total',
        },
        item: {
          sectionTitle: 'Itens do Pedido',
          product: 'Produto',
          productPlaceholder: 'Buscar produto',
          um: 'UM',
          quantity: 'Quantidade',
          price: 'Preço',
          discount: 'Desconto',
          discountPercent: 'Desconto %',
          total: 'Total',
          addItem: 'Adicionar item',
          removeItem: 'Remover item',
          addIncompleteError: 'Preencha todos os campos do item atual antes de adicionar outro.',
          removeLastError: 'É necessário manter pelo menos um item no pedido.',
          removeConfirm: {
            title: 'Remover item?',
            description: 'Este item será removido do pedido.',
          },
          productModal: {
            addAria: 'Adicionar novo produto',
            editAria: 'Editar produto selecionado',
          },
        },
        payment: {
          sectionTitle: 'Pagamento',
          paymentMethod: 'Forma de Pagamento',
          hasInput: 'Possui Entrada?',
          inputDate: 'Data da Entrada',
          inputValue: 'Valor da Entrada',
          installments: 'Nº de Parcelas',
          dueDate: 'Vencimento (1ª Parcela)',
          interval: 'Intervalo entre Parcelas (dias)',
          fiscalDocument: 'Dedutível',
          installmentsTable: {
            date: 'Data',
            value: 'Valor',
          },
          adjustRefusedToast: 'Ajuste inválido: a última parcela ficaria zerada ou negativa.',
        },
      },
      placeholders: {
        header: {
          client: 'Selecione o cliente',
        },
      },
      clientModal: {
        addAria: 'Adicionar novo cliente',
        editAria: 'Editar cliente selecionado',
      },
      unsavedChangesDialog: {
        title: 'Sair sem salvar?',
        description: 'Existem alterações não salvas neste formulário que serão perdidas',
        confirmButton: 'Sair sem salvar',
      },
      errors: {
        invalidFields: 'Verifique os campos obrigatórios destacados e tente novamente.',
      },
      noChangesToast: 'Nada para salvar — nenhuma alteração foi feita.',
      validation: {
        clientRequired: 'Selecione o cliente.',
        dateRequired: 'Informe a data.',
        freightMin: 'Informe um frete maior ou igual a zero.',
        itemsMin: 'Adicione ao menos um item.',
        itemProductRequired: 'Selecione o produto.',
        itemQuantityRequired: 'Informe a quantidade.',
        itemPriceRequired: 'Informe o preço.',
        itemDiscountExceedsTotal:
          'O valor do desconto não pode ser maior que o do valor total do produto!',
        itemDiscountPercentMax: 'A porcentagem do desconto não poder ser maior que 100!',
        noteMax: 'A observação deve ter no máximo 200 caracteres.',
        installmentInputDateRequired: 'Informe a data da entrada.',
        installmentInputValueRequired: 'Informe o valor da entrada.',
        paymentMethodRequired: 'Selecione a forma de pagamento.',
        installmentsRequired: 'Informe o número de parcelas.',
        dueDateRequired: 'Informe o vencimento da 1ª parcela.',
        installmentDateInvalid: 'Favor inserir uma data válida.',
        numberType: 'Informe um número válido.',
      },
    },

    generateSaleScreen: {
      pageTitle: 'Gerar Venda a partir do Pedido',
      backButton: 'Voltar',
      saveButton: 'Gerar Venda',
      sections: {
        order: 'Pedido de Origem',
        items: 'Itens Elegíveis',
      },
      orderFields: {
        code: 'Nº do Pedido',
        client: 'Cliente',
        status: 'Status',
      },
      item: {
        orderedQuantity: 'Qtd. Pedida',
        remainingQuantity: 'Saldo Disponível',
        availableStock: 'Saldo Disponível',
        stockLoadError: 'Não foi possível consultar o estoque deste item.',
      },
      emptyEligibleItems: {
        title: 'Nenhum item com saldo disponível.',
        description: 'Todos os itens deste pedido já foram totalmente vendidos.',
      },
      loadError: {
        message: 'Não foi possível carregar os dados do pedido para gerar a venda.',
        retry: 'Tentar novamente',
      },
      successToast: 'Venda gerada com sucesso a partir do pedido',
      validation: {
        itemsMin: 'Este pedido não possui itens elegíveis para gerar venda.',
        itemQuantityExceedsRemaining: 'A quantidade não pode ser maior que o saldo disponível.',
      },
    },
  },
};
