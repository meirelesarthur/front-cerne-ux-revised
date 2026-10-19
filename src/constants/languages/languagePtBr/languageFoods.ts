// src/constants/languages/languagePtBr/languageFoods.ts
// Tradução PT-BR do módulo "Formulação" (Food — Fábrica/Ração,
// TASK-FOOD-FE-01). Título de PÁGINA "Formulação" — o item de MENU
// existente é "Fábrica" (`adm-est-fab`, `navigationTree.ts`), agrupador de
// futuras telas do domínio (mesmo racional de "Mov. Caixa/Bancário" vs.
// "Movimentos" no módulo Movement).

import { ModuleFoods } from '@/@types/language/module-foods';

export const languageFoods: ModuleFoods = {
  food: {
    singularLabel: 'Formulação',
    pluralLabel: 'Formulações',
    list: {
      pageTitle: 'Formulação',
      pageSubtitle: 'Administre as fórmulas de ração da fábrica.',
      deletedToast: 'Formulação removida com sucesso',
      duplicatedToast: 'Formulação duplicada com sucesso',
      reportErrorToast: 'Não foi possível gerar o relatório da formulação.',
      columns: {
        code: 'Código',
        product: 'Produto',
        date: 'Data',
        quantity: 'Quantidade',
        measurement: 'Unidade',
        type: 'Tipo',
        status: 'Status',
        activeLabel: 'Ativo',
        inactiveLabel: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
        duplicate: 'Duplicar',
        report: 'Relatório',
      },
      emptyState: {
        titleEmpty: 'Nenhuma formulação cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira formulação.',
        titleFiltered: 'Nenhuma formulação encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar Formulação',
      },
    },
    filter: {
      title: 'Filtrar formulações',
      product: 'Produto',
      productPlaceholder: 'Buscar por ração',
      status: 'Status',
      statusAll: 'Todos',
      statusOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
      type: 'Tipo',
      typeAll: 'Todos',
    },
    form: {
      title: {
        create: 'Nova Formulação',
        edit: 'Editar Formulação',
      },
      fields: {
        code: 'Código',
        responsible: 'Responsável',
        date: 'Data',
        status: 'Ativo',
        product: 'Produto',
        quantity: 'Quantidade',
        measurement: 'Unidade',
        type: 'Tipo',
        feedstocks: 'Composição',
        feedstockProduct: 'Matéria-Prima',
        feedstockMeasurement: 'Unidade',
        feedstockPercentageP: 'Percentual (%)',
        feedstockPercentageU: 'Quantidade',
        total: 'Total',
        addFeedstock: 'Adicionar Matéria-Prima',
        removeFeedstock: 'Remover',
      },
      typeOptions: {
        percentage: 'Porcentagem',
        unit: 'Unidade',
      },
      hints: {
        quantityTooltip:
          'Esta é a medida padrão da fórmula. Se a fórmula foi criada para 1kg, mas você vai produzir 10kg, o sistema multiplicará os insumos por 10 automaticamente.',
      },
      validation: {
        productRequired: 'Selecione a ração.',
        dateRequired: 'Informe a data.',
        quantityMin: 'Informe uma quantidade maior que zero.',
        measurementRequired: 'Selecione a unidade.',
        typeRequired: 'Selecione o tipo.',
        feedstocksMin: 'Adicione ao menos uma matéria-prima.',
        feedstockProductRequired: 'Selecione a matéria-prima.',
        percentageMin: 'Informe um valor maior ou igual a zero.',
        percentageSumMustBe100: 'A soma dos percentuais deve ser igual a 100%.',
      },
    },
  },
};
