// src/constants/languages/languagePtBr/languageStockWriteoffs.ts
// Tradução PT-BR do módulo de BAIXA DE ESTOQUE (Administrativo). Esteira 038,
// fatia READ (TASK-FE-3001/3002/3003) + fatia WRITE (TASK-FE-3004/3005/3006).

import { ModuleStockWriteoffs } from '@/@types/language/module-stock-writeoffs';

export const languageStockWriteoffs: ModuleStockWriteoffs = {
  stockWriteoff: {
    singularLabel: 'Baixa de Estoque',
    pluralLabel: 'Baixas de Estoque',
    list: {
      pageTitle: 'Baixa de Estoque',
      pageSubtitle: 'Consulte e exclua baixas de estoque lançadas para a fazenda ativa.',
      reportButton: 'Relatório',
      table: {
        code: 'Código',
        user: 'Responsável',
        warehouse: 'Armazém',
        createdAt: 'Cadastrado em',
        type: 'Tipo',
        actions: {
          viewDetail: 'Ver Detalhe',
          delete: 'Excluir',
          emitNfe: 'Emitir NFe',
        },
      },
      emptyState: {
        title: 'Nenhuma baixa de estoque encontrada.',
        description: 'Ainda não há baixas de estoque lançadas para a fazenda ativa.',
        titleFiltered: 'Nenhuma baixa de estoque encontrada.',
        descriptionFiltered: 'Tente ajustar o período ou limpar o filtro.',
        cta: 'Nova baixa',
      },
      deletedToast: 'Baixa de estoque excluída com sucesso',
      deleteDialog: {
        description: 'Tem certeza que deseja excluir a baixa de estoque',
        warning:
          'Esta exclusão restaura o estoque debitado por esta baixa. É uma operação sem volta e pode impactar relatórios já emitidos.',
      },
    },
    filter: {
      title: 'Filtrar baixas de estoque',
      startDate: 'Data de cadastro (de)',
      endDate: 'Data de cadastro (até)',
      dateRangeInvalid: 'A data final não pode ser anterior à data inicial.',
    },
    detail: {
      sections: {
        identification: 'Identificação',
        items: 'Itens da Baixa',
      },
      fields: {
        code: 'Código',
        type: 'Tipo',
        typeNote: 'Observação do tipo',
        createdAt: 'Cadastrado em',
        user: 'Responsável',
        warehouse: 'Armazém',
        justification: 'Justificativa',
      },
      table: {
        product: 'Produto',
        quantity: 'Quantidade',
        value: 'Valor Unit.',
        amount: 'Valor Total',
        lot: 'Lote',
      },
      totals: {
        quantity: 'Total de Quantidade',
        amount: 'Total Geral',
      },
      itemsEmpty: {
        title: 'Nenhum item encontrado.',
        description: 'Esta baixa não possui itens registrados.',
      },
      notFound: {
        title: 'Baixa de estoque não encontrada.',
        description: 'Não há baixa de estoque para o identificador informado.',
        back: 'Voltar à listagem',
      },
      invalidParamsToast: {
        title: 'Parâmetros inválidos',
        description: 'O identificador da baixa é inválido para exibir o detalhe.',
      },
      noData: 'Não Possui',
      backButton: 'Voltar',
      actions: {
        emitNfe: 'Emitir NFe',
      },
    },
    typeOptions: {
      loss: 'Perda',
      deterioration: 'Deterioração',
      theft: 'Roubo',
      damage: 'Avaria',
      inventory: 'Inventário',
      accounting: 'Contabilização',
      pettyTheft: 'Furto',
      expirationDate: 'Prazo de Validade',
      freeGift: 'Brinde',
      donation: 'Doação',
      others: 'Outros',
      consumption: 'Consumo',
      paymentInProduct: 'Pagamento com Produto',
    },
    form: {
      title: 'Nova Baixa de Estoque',
      subtitle: 'Registre a baixa de itens do estoque da fazenda ativa.',
      header: {
        sectionTitle: 'Identificação',
        code: 'Código',
        user: 'Usuário',
        date: 'Data',
        type: 'Motivo de baixa',
        typePlaceholder: 'Selecione o motivo da baixa',
        typeNote: 'Observação',
        typeNotePlaceholder: 'Observação adicional sobre o motivo selecionado (opcional)',
        warehouse: 'Armazém',
        warehousePlaceholder: 'Selecione o armazém',
        justification: 'Justificativa',
        justificationPlaceholder: 'Descreva o motivo desta baixa de estoque',
        costCenter: 'Centro de Custo',
        costCenterPlaceholder: 'Selecione o centro de custo (opcional)',
        costCenterHint: 'Campo apenas informativo — não é persistido pelo sistema.',
      },
      items: {
        sectionTitle: 'Itens da Baixa',
        addItem: 'Adicionar Item',
        removeItem: 'Remover item',
        emptyRow: 'Nenhum item adicionado.',
        stock: 'Produto / Lote',
        stockPlaceholder: 'Selecione o armazém para listar os estoques',
        saldo: 'Saldo',
        unit: 'Unidade',
        lot: 'Lote',
        quantity: 'Quantidade',
        value: 'Valor Unit.',
        amount: 'Valor Total',
      },
      attachments: {
        sectionTitle: 'Anexos',
        addButton: 'Adicionar Anexo',
        removeButton: 'Remover anexo',
        emptyLabel: 'Nenhum anexo adicionado.',
        fields: {
          name: 'Nome',
          namePlaceholder: 'Nome do anexo',
          file: 'Arquivo',
        },
        fillBeforeAddError: 'Preencha o anexo atual antes de adicionar um novo.',
        defaultName: 'Não Informado',
        dropzoneTitle: 'Arraste um arquivo ou clique para selecionar',
        dropzoneDraggingTitle: 'Solte o arquivo aqui',
        changeLabel: 'Trocar arquivo',
        removeLabel: 'Remover arquivo',
        errorTypeMessage: 'Tipo de arquivo não aceito.',
        errorSizeMessage: 'O arquivo excede o tamanho máximo permitido (10MB).',
      },
      footer: {
        cancel: 'Cancelar',
        save: 'Salvar',
      },
      errors: {
        invalidFields: 'Verifique os campos destacados e tente novamente.',
      },
      createdToast: 'Baixa de estoque criada com sucesso',
    },
    report: {
      title: 'Relatório de Baixas de Estoque',
      subtitle: 'Gere o relatório em PDF das baixas de estoque da fazenda ativa.',
      filters: {
        warehouse: 'Armazém',
        warehousePlaceholder: 'Selecione o armazém',
        product: 'Produto',
        productPlaceholder: 'Selecione o produto (opcional)',
        startDate: 'Data inicial',
        endDate: 'Data final',
      },
      submit: 'Gerar Relatório',
      openError: 'Não foi possível gerar o relatório. Tente novamente.',
    },
    nfeHandoff: {
      button: 'Emitir NFe',
      alreadyEmittedWarning: {
        title: 'NFe já emitida',
        description: 'Esta baixa de estoque já possui uma NFe vinculada.',
      },
      draftErrorToast: {
        title: 'Não foi possível preparar a NFe',
        description:
          'Não foi possível carregar os dados da baixa para pré-preencher a NFe. Você ainda pode criar a NFe manualmente.',
      },
      linkedToast: 'NFe vinculada com sucesso',
      autoLinkErrorToast: {
        title: 'Não foi possível vincular a NFe à baixa',
        description:
          'A NFe foi salva normalmente, mas não foi possível vincular o registro à baixa de estoque de origem. A ação "Emitir NFe" pode continuar aparecendo nesta baixa.',
      },
    },
  },
};
