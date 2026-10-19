// src/constants/languages/languagePtBr/languageNutritions.ts
// Tradução PT-BR do módulo "Nutrição" (Nutrition — Operacional / Lançamento
// de consumo de ração, TASK-NT-FE-01).

import { ModuleNutritions } from '@/@types/language/module-nutritions';

export const languageNutritions: ModuleNutritions = {
  nutrition: {
    singularLabel: 'Nutrição',
    pluralLabel: 'Nutrições',
    list: {
      columns: {
        code: 'Código',
        date: 'Data',
        employeeOrUser: 'Responsável',
        areasGrazings: 'Áreas/Pastejos',
        batches: 'Lotes',
        products: 'Produtos',
        quantity: 'Quantidade Total',
        timeControl: 'Controle de Horas',
        actions: 'Ações',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma nutrição cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira nutrição.',
        titleFiltered: 'Nenhuma nutrição encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar Nutrição',
      },
      deletedToast: 'Nutrição removida com sucesso',
    },
    filter: {
      title: 'Filtrar nutrições',
      startDate: 'Data inicial',
      endDate: 'Data final',
      product: 'Produto',
      productPlaceholder: 'Buscar por produto',
      batch: 'Lote',
      batchPlaceholder: 'Buscar por lote',
      employee: 'Funcionário',
      employeePlaceholder: 'Buscar por funcionário',
    },
    detail: {
      back: 'Voltar',
    },
    form: {
      title: {
        create: 'Nova Nutrição',
        edit: 'Editar Nutrição',
        view: 'Visualizar Nutrição',
      },
      fields: {
        header: {
          code: 'Código',
          date: 'Data',
          user: 'Responsável',
          timeControl: 'Controle de Horas',
        },
        item: {
          sectionTitle: 'Itens',
          warehouse: 'Armazém',
          warehouseDeletedSuffix: '(excluído)',
          product: 'Produto',
          dietBeat: 'Dieta Automática',
          um: 'Unidade',
          stock: 'Estoque',
          quantity: 'Quantidade',
          area: 'Área',
          grazing: 'Pastejo',
          trough: 'Cocho',
          note: 'Observação',
          costCenter: 'Centro de Custo',
          batches: 'Lotes',
          batchesSearchPlaceholder: 'Buscar lote',
          batchesSelectedCountLabel: 'Lotes selecionados',
          addItem: 'Adicionar Item',
          removeItem: 'Remover',
          insufficientStock: 'A quantidade não pode exceder o estoque disponível.',
        },
        employee: {
          sectionTitle: 'Controle de Horas',
          funcType: 'Tipo',
          funcExecutor: 'Executor',
          funcUm: 'Unidade',
          funcTotalQuantity: 'Quantidade Total',
          addEmployee: 'Adicionar',
          removeEmployee: 'Remover',
        },
      },
      validation: {
        dateRequired: 'Informe a data.',
        numberType: 'Informe um número válido.',
        quantityMin: 'Informe uma quantidade maior que zero.',
        itemTroughRequired: 'Selecione o cocho.',
        itemQuantityRequired: 'Informe a quantidade.',
        itemProductOrDietRequired: 'Selecione o produto ou a dieta automática.',
        itemWarehouseRequired: 'Selecione o armazém.',
        itemBatchesMin: 'Selecione ao menos um lote.',
        itemsMin: 'Adicione ao menos um item.',
        employeeFuncTypeRequired: 'Selecione o tipo.',
        employeeFuncExecutorRequired: 'Selecione o executor.',
        employeeFuncUmRequired: 'Selecione a unidade.',
        employeeFuncTotalRequired: 'Informe a quantidade total.',
      },
    },
    options: {
      funcType: {
        employee: 'Funcionário',
        function: 'Função',
        provider: 'Fornecedor',
      },
      timeControl: {
        yes: 'Sim',
        no: 'Não',
      },
    },
  },
};
