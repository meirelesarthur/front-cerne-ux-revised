// src/constants/languages/languagePtBr/languageBullSeedSeason.ts
// Tradução PT-BR do módulo "Touros/Sêmen/Embrião" (BullSeedSeason —
// Operacional / Reprodução, 97-Esteiras/005, Tarefa 24).

import { ModuleBullSeedSeason } from '@/@types/language/module-bull-seed-season';

export const languageBullSeedSeason: ModuleBullSeedSeason = {
  bullSeedSeason: {
    singularLabel: 'Touros/Sêmen/Embrião',
    pluralLabel: 'Touros/Sêmen/Embrião',
    titleModule: 'Touros/Sêmen/Embrião',
    list: {
      pageTitle: 'Touros/Sêmen/Embrião',
      pageSubtitle: 'Gerencie os registros de touros, sêmen e embriões cadastrados.',
      deletedToast: 'Registro excluído com sucesso',
      newButton: 'Novo',
      table: {
        code: 'Código',
        date: 'Data',
        breedingSeason: 'Estação de Monta',
        responsible: 'Responsável',
        description: 'Descrição',
        actions: 'Ações',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum registro cadastrado.',
        descriptionEmpty: 'Comece cadastrando um novo registro.',
        titleFiltered: 'Nenhum registro encontrado.',
        descriptionFiltered: 'Tente ajustar o período.',
        cta: 'Novo',
      },
      filter: {
        title: 'Filtrar Touros/Sêmen/Embrião',
        startDate: 'Data inicial',
        endDate: 'Data final',
      },
      deleteDialog: {
        title: 'Excluir registro de Touros/Sêmen/Embrião?',
        description: 'será excluído permanentemente.',
        warning: 'Esta ação não pode ser desfeita.',
      },
    },
    detail: {
      title: 'Touros/Sêmen/Embrião',
      backButton: 'Voltar',
      editButton: 'Editar',
      deleteButton: 'Excluir',
      sections: {
        generalData: 'Dados Gerais',
        animals: 'Animais',
        products: 'Produtos',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        description: 'Descrição',
        breedingSeason: 'Estação de Monta',
        createdAt: 'Criado em',
        updatedAt: 'Atualizado em',
      },
      animalsEmpty: 'Nenhum animal vinculado.',
      productsEmpty: 'Nenhum produto vinculado.',
      productsTable: {
        product: 'Produto',
        warehouse: 'Armazém',
        quantity: 'Quantidade',
        measurement: 'UM',
        noWarehouse: '—',
      },
      notFound: {
        title: 'Registro não encontrado.',
        description: 'O registro pode ter sido excluído ou o link está incorreto.',
      },
      invalidParamsToast: {
        title: 'Touros/Sêmen/Embrião',
        description: 'Parâmetros inválidos para exibir o detalhe.',
      },
    },
    form: {
      title: {
        create: 'Novo Touros/Sêmen/Embrião',
        edit: 'Editar Touros/Sêmen/Embrião',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        description: 'Descrição',
        breedingSeason: 'Estação de Monta',
      },
      animals: {
        sectionTitle: 'Animais',
        animalLabel: 'Animal',
        addButton: 'Adicionar Animal',
        removeButton: 'Remover',
        emptyState: 'Nenhum animal adicionado.',
      },
      products: {
        sectionTitle: 'Produtos',
        warehouseLabel: 'Armazém',
        productLabel: 'Produto',
        quantityLabel: 'Quantidade',
        measurementLabel: 'UM',
        stockLabel: 'Estoque',
        addButton: 'Adicionar Produto',
        removeButton: 'Remover',
        emptyState: 'Nenhum produto adicionado.',
      },
      validation: {
        dateRequired: 'Informe a data',
        descriptionRequired: 'Informe a descrição',
        breedingSeasonRequired: 'Informe a Estação de Monta',
        animalRequired: 'Selecione um animal',
        productRequired: 'Selecione um produto',
        quantityRequired: 'Informe a quantidade',
        quantityMin: 'A quantidade não pode ser negativa',
      },
      unsavedChangesDialog: {
        title: 'Sair sem salvar?',
        description: 'Existem alterações não salvas neste formulário que serão perdidas',
        confirmButton: 'Sair sem salvar',
      },
    },
  },
};
