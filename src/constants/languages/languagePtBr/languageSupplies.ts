// src/constants/languages/languagePtBr/languageSupplies.ts
// Tradução PT-BR do módulo Gestão de Frota — Abastecimentos (Supply) —
// domínio próprio, Tarefas 40/41 (esteira 009).

import { ModuleSupplies } from '@/@types/language/module-supplies';

export const languageSupplies: ModuleSupplies = {
  supply: {
    singularLabel: 'Abastecimento',
    pluralLabel: 'Abastecimentos',
    list: {
      pageTitle: 'Abastecimentos',
      pageSubtitle: 'Abastecimentos de frota por equipamento, com consumo de estoque.',
      deletedToast: 'Abastecimento removido com sucesso',
      table: {
        code: 'Código',
        date: 'Data',
        requester: 'Requisitante',
        createdAt: 'Dt. Criação',
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
        note: 'Observação',
        responsible: 'Responsável',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      filter: {
        title: 'Filtrar abastecimentos',
        equipment: 'Equipamento',
        equipmentPlaceholder: 'Buscar equipamento',
        startDate: 'Dt. início',
        endDate: 'Dt. fim',
      },
      emptyState: {
        title: 'Nenhum abastecimento cadastrado.',
        description: 'Comece adicionando seu primeiro abastecimento.',
        titleFiltered: 'Nenhum abastecimento encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar Novo',
      },
      errorState: {
        title: 'Não foi possível carregar os abastecimentos.',
        description: 'Verifique sua conexão e tente novamente.',
        retry: 'Tentar novamente',
      },
    },
    form: {
      title: {
        create: 'Novo Abastecimento',
        edit: 'Editar Abastecimento',
      },
      subtitle: {
        create: 'Cadastre um novo abastecimento de frota.',
        edit: 'Atualize os dados do abastecimento.',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        requester: 'Requisitante',
        user: 'Usuário',
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
          responsible: 'Responsável',
          note: 'Observação',
        },
        placeholders: {
          equipment: 'Buscar equipamento',
          warehouse: 'Buscar armazém',
          product: 'Buscar produto',
          measurement: 'Selecione a unidade',
          responsible: 'Buscar responsável',
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
      title: 'Abastecimento',
      sections: {
        header: 'Identificação',
        items: 'Itens',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
        back: 'Voltar',
      },
      notFound: {
        title: 'Abastecimento não encontrado.',
        description: 'Verifique se ele ainda existe.',
        back: 'Voltar para a listagem',
      },
    },
  },
};
