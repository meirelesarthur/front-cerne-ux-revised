// src/constants/languages/languagePtBr/languageWarehouseTransfers.ts
// Tradução PT-BR do módulo "Trans. Armazém" (WarehouseTransfer — Estoque,
// escrita, TASK-WT-FE-01).

import { ModuleWarehouseTransfers } from '@/@types/language/module-warehouse-transfers';

export const languageWarehouseTransfers: ModuleWarehouseTransfers = {
  warehouseTransfer: {
    singularLabel: 'Transferência entre Armazéns',
    pluralLabel: 'Transferências entre Armazéns',
    list: {
      columns: {
        code: 'Código',
        date: 'Data',
        product: 'Produto',
        originWarehouse: 'Armazém Origem',
        destinationWarehouse: 'Armazém Destino',
        quantity: 'Quantidade',
        user: 'Responsável',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma transferência cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira transferência entre armazéns.',
        titleFiltered: 'Nenhuma transferência encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar Transferência',
      },
      deletedToast: 'Transferência removida com sucesso',
    },
    filter: {
      title: 'Filtrar transferências',
      product: 'Produto',
      productPlaceholder: 'Buscar por produto',
      destinationWarehouse: 'Armazém Destino',
      destinationWarehousePlaceholder: 'Buscar por armazém destino',
      dateFrom: 'Data inicial',
      dateTo: 'Data final',
    },
    form: {
      title: {
        create: 'Nova Transferência',
        edit: 'Editar Transferência',
      },
      fields: {
        header: {
          code: 'Código',
          user: 'Responsável',
          date: 'Data',
          type: 'Tipo',
          typeValue: 'Transferência',
          originWarehouse: 'Armazém (origem)',
          destinationWarehouse: 'Armazém Destino',
        },
        item: {
          product: 'Produto',
          measurement: 'Unidade',
          stockAvailable: 'Estoque',
          quantity: 'Quantidade',
          unitValue: 'Valor Unitário',
          totalValue: 'Valor Total',
          costCenter: 'Centro de Custo',
          addItem: 'Adicionar Item',
          removeItem: 'Remover',
          sectionTitle: 'Itens da Transferência',
          insufficientStock: 'A quantidade não pode exceder o saldo disponível.',
          duplicateStock: 'Esse estoque já foi selecionado em outra linha.',
          footerTotalLabel: 'Total Geral',
        },
      },
      hints: {
        originWarehouseHelp:
          'O armazém de origem filtra os produtos disponíveis e não é enviado na transferência.',
      },
      validation: {
        dateRequired: 'Informe a data.',
        destinationWarehouseRequired: 'Selecione o armazém de destino.',
        originWarehouseRequired: 'Selecione o armazém de origem.',
        itemsMin: 'Adicione ao menos um item.',
        itemStockRequired: 'Selecione o produto/estoque de origem.',
        itemQuantityRequired: 'Informe a quantidade.',
        quantityMin: 'Informe uma quantidade maior que zero.',
        itemCostCenterRequired: 'Selecione o centro de custo.',
        numberType: 'Informe um número válido.',
      },
    },
  },
};
