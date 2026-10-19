// src/constants/languages/languagePtBr/languageFoodBeats.ts
// Tradução PT-BR do módulo "Batida" (FoodBeat — Fábrica, TASK-FB-FE-01).

import { ModuleFoodBeats } from '@/@types/language/module-food-beats';

export const languageFoodBeats: ModuleFoodBeats = {
  foodBeat: {
    singularLabel: 'Batida',
    pluralLabel: 'Batidas',
    list: {
      columns: {
        code: 'Código',
        date: 'Data',
        type: 'Tipo',
        warehouse: 'Armazém',
        productOrFood: 'Ração/Produto',
        quantity: 'Quantidade',
        user: 'Responsável',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Excluir',
        report: 'Relatório',
      },
      emptyState: {
        titleEmpty: 'Nenhuma batida cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira batida.',
        titleFiltered: 'Nenhuma batida encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar Batida',
      },
      deletedToast: 'Batida removida com sucesso',
      reportErrorToast: 'Não foi possível gerar o relatório da batida.',
    },
    filter: {
      title: 'Filtrar batidas',
      product: 'Ração/Produto',
      user: 'Responsável',
      startDate: 'Data inicial',
      endDate: 'Data final',
      productPlaceholder: 'Buscar por ração ou produto',
      userPlaceholder: 'Buscar por responsável',
    },
    form: {
      title: {
        create: 'Nova Batida',
        edit: 'Editar Batida',
      },
      typeOptions: {
        formulation: 'Formulação',
        stock: 'Estoque',
      },
      fields: {
        header: {
          code: 'Código',
          responsible: 'Responsável',
          date: 'Data',
          type: 'Tipo',
          warehouse: 'Armazém Destino',
          food: 'Ração',
          product: 'Produto',
          productQuantity: 'Quantidade Produzida',
          measurement: 'Unidade',
          quantity: 'Quantidade',
          providerLot: 'Lote',
          shelfLife: 'Validade',
          total: 'Total',
        },
        formulationItem: {
          stock: 'Armazém',
          feedstock: 'Matéria-Prima',
          measurement: 'Unidade',
          stockAvailable: 'Saldo Disponível',
          percentage: 'Percentual (%)',
          quantityPredicted: 'Quantidade Prevista',
          quantityRealized: 'Quantidade Realizada',
          difference: 'Diferença',
          amount: 'Custo Unitário',
          total: 'Total',
          addItem: 'Adicionar Matéria-Prima',
          removeItem: 'Remover',
          sectionTitle: 'Composição (Matérias-Primas)',
          insufficientStock: 'A quantidade realizada não pode exceder o saldo disponível.',
        },
        stockItem: {
          warehouse: 'Armazém',
          stock: 'Matéria Prima',
          measurement: 'Unidade',
          stockAvailable: 'Estoque',
          quantity: 'Quantidade',
          amount: 'Custo Unitário',
          total: 'Total',
          addItem: 'Adicionar Item',
          removeItem: 'Remover',
          sectionTitle: 'Itens de Estoque',
          insufficientStock: 'A quantidade não pode exceder o saldo disponível.',
          duplicateStock: 'Esse estoque já foi selecionado em outra linha.',
          footerTotalLabel: 'Total Geral',
        },
      },
      hints: {
        editReadonlyNotice:
          'Em edição, somente a data pode ser alterada. Os demais campos são exibidos apenas para consulta.',
        quantityHelp: 'Informe a quantidade produzida ou baixada nesta batida.',
      },
      validation: {
        warehouseRequired: 'Selecione o armazém.',
        dateRequired: 'Informe a data.',
        typeRequired: 'Selecione o tipo.',
        foodRequired: 'Selecione a ração.',
        productRequired: 'Selecione o produto.',
        quantityRequired: 'Informe a quantidade.',
        quantityMin: 'Informe uma quantidade maior que zero.',
        providerLotMax: 'O lote deve ter no máximo 15 caracteres.',
        providerLotRequiredWhenHasLot:
          'Informe o lote — o produto selecionado exige controle de lote.',
        shelfLifeRequiredWhenHasLot:
          'Informe a validade — o produto selecionado exige controle de lote.',
        itemStockRequired: 'Selecione o estoque de origem.',
        itemWarehouseRequired: 'Selecione o armazém.',
        itemQuantityRequired: 'Informe a quantidade.',
        itemAmountRequired: 'Informe o custo unitário.',
        itemTotalRequired: 'Informe o total.',
        itemsMin: 'Adicione ao menos um item.',
        numberType: 'Informe um número válido.',
      },
    },
    report: {
      aggregated: {
        title: 'Relatório de Batidas',
        food: 'Ração',
        startDate: 'Data inicial',
        endDate: 'Data final',
        generate: 'Gerar Relatório',
      },
    },
  },
};
