// src/constants/languages/languagePtBr/languageMaintenances.ts
// Tradução PT-BR do módulo Gestão de Frota — Manutenções (Maintenance, F-103)
// — Tarefas 43/44/45 (esteira 010).

import { ModuleMaintenances } from '@/@types/language/module-maintenances';

export const languageMaintenances: ModuleMaintenances = {
  maintenance: {
    singularLabel: 'Manutenção',
    pluralLabel: 'Manutenções',
    list: {
      pageTitle: 'Manutenções',
      pageSubtitle: 'Manutenções de frota por equipamento, com consumo de estoque e mão de obra.',
      deletedToast: 'Manutenção removida com sucesso',
      table: {
        code: 'Código',
        date: 'Data',
        requester: 'Requisitante',
        actions: 'Ações',
      },
      itemsTable: {
        equipment: 'Equipamento',
        warehouse: 'Armazém',
        product: 'Produto',
        measurement: 'Un. Medida',
        hourMeter: 'Horímetro',
        mileage: 'Km',
        quantity: 'Quantidade',
        amount: 'Vl. Unitário',
        totalAmount: 'Vl. Total',
        executor: 'Executor',
        laborCost: 'Custo Mão de Obra',
        note: 'Observação',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      filter: {
        title: 'Filtrar manutenções',
        equipment: 'Equipamento',
        equipmentPlaceholder: 'Buscar equipamento',
        startDate: 'Dt. início',
        endDate: 'Dt. fim',
      },
      emptyState: {
        title: 'Nenhuma manutenção cadastrada.',
        description: 'Comece adicionando sua primeira manutenção.',
        titleFiltered: 'Nenhuma manutenção encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar Nova',
      },
      errorState: {
        title: 'Não foi possível carregar as manutenções.',
        description: 'Verifique sua conexão e tente novamente.',
        retry: 'Tentar novamente',
      },
    },
    form: {
      title: {
        create: 'Nova Manutenção',
        edit: 'Editar Manutenção',
      },
      subtitle: {
        create: 'Cadastre uma nova manutenção de frota.',
        edit: 'Atualize os dados da manutenção.',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        requester: 'Requisitante',
      },
      items: {
        title: 'Itens',
        addItem: 'Adicionar Item',
        removeItem: 'Remover',
        emptyRow: 'Nenhum item adicionado.',
        fields: {
          equipment: 'Equipamento',
          hourMeter: 'Horímetro',
          mileage: 'Km',
          warehouse: 'Armazém',
          product: 'Produto',
          measurement: 'Un. Medida',
          quantity: 'Quantidade',
          stock: 'Estoque',
          note: 'Observação',
          executorType: 'Tipo de Executor',
          employee: 'Funcionário',
          employeeHours: 'Horas',
          provider: 'Fornecedor',
          providerTotal: 'Custo Total',
        },
        placeholders: {
          equipment: 'Buscar equipamento',
          warehouse: 'Buscar armazém',
          product: 'Buscar produto',
          measurement: 'Selecione a unidade',
          employee: 'Buscar funcionário',
          provider: 'Buscar fornecedor',
          requester: 'Buscar usuário',
        },
        executorTypeOptions: {
          employee: 'Funcionário',
          provider: 'Fornecedor',
        },
      },
      stockExceedsDialog: {
        title: 'Atenção',
        intro: 'A quantidade informada é maior que a quantidade em estoque.',
        informedQuantityLabel: 'Quantidade Informada',
        stockQuantityLabel: 'Quantidade em estoque',
        confirm: 'Fechar',
      },
      errors: {
        invalidFields: 'Revise os campos destacados.',
      },
    },
    detail: {
      title: 'Manutenção',
      sections: {
        header: 'Identificação',
        items: 'Itens',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
        generateFinancial: 'Gerar Financeiro',
      },
      notFound: {
        title: 'Manutenção não encontrada.',
        description: 'Verifique se ela ainda existe.',
        back: 'Voltar para a listagem',
      },
    },
    generateFinancial: {
      pageTitlePrefix: 'Gerar Financeiro — Manutenção',
      backToDetail: 'Voltar para a Manutenção',
      providerBlock: {
        fields: {
          provider: 'Fornecedor',
          number: 'Número do Título',
          typeTitle: 'Tipo de Título',
          proprietary: 'Proprietário',
          note: 'Observação',
          fiscalDocument: 'Documento Fiscal',
          total: 'Valor Total',
        },
        placeholders: {
          number: 'Número do título',
          typeTitle: 'Buscar tipo de título',
          proprietary: 'Buscar proprietário',
        },
      },
      apportionment: {
        title: 'Rateio',
        addButton: 'Adicionar Categoria',
        removeButton: 'Remover',
        emptyLabel: 'Nenhuma categoria adicionada.',
        sumBadgeLabel: 'Soma do rateio',
        sumNotClosed: 'A soma do rateio precisa fechar exatamente com o Valor Total.',
        fields: {
          category: 'Categoria Financeira',
          center: 'Centro de Custo',
          value: 'Valor',
        },
        placeholders: {
          category: 'Buscar categoria',
          center: 'Buscar centro de custo',
        },
      },
      installments: {
        title: 'Parcelamento',
        generateButton: 'Gerar Parcelas',
        addButton: 'Adicionar Parcela',
        removeButton: 'Remover',
        emptyLabel: 'Nenhuma parcela adicionada.',
        sumBadgeLabel: 'Soma das parcelas',
        overwriteConfirm: 'Já existem parcelas geradas. Deseja substituí-las?',
        fields: {
          installmentCount: 'Nº Parcelas',
          firstDueDate: 'Venc. 1ª PC',
          intervalDays: 'Intervalo (dias)',
          dueDate: 'Vencimento',
          value: 'Valor',
        },
      },
      errors: {
        alreadyGenerated: 'Esta Manutenção já teve o financeiro gerado.',
        noProviderItems: 'Esta Manutenção não possui itens com fornecedor.',
        apportionmentNotClosed: 'O rateio de um ou mais fornecedores não fecha com o Valor Total.',
        installmentsRequired: 'Gere ou adicione ao menos uma parcela para o fornecedor {provider}.',
        installmentsInvalid:
          'Informe vencimento e valor maior que zero em todas as parcelas do fornecedor {provider}.',
      },
      actions: {
        generate: 'Gerar',
        cancel: 'Cancelar',
      },
      notFound: {
        title: 'Manutenção não encontrada.',
        description: 'Verifique se ela ainda existe.',
        back: 'Voltar para a listagem',
      },
    },
  },
};
