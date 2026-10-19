// src/constants/languages/languagePtBr/languageCategoriasProduto.ts
// Tradução PT-BR do módulo de CATEGORIAS DE PRODUTO (Cadastros Base).

import { ModuleCategoryProducts } from '@/@types/language/module-category-products';

export const languageCategoriasProduto: ModuleCategoryProducts = {
  categoryProduct: {
    singularLabel: 'Categoria de Produto',
    list: {
      pageTitle: 'Categorias de Produto',
      pageSubtitle: 'Administre as categorias utilizadas para classificar os produtos do estoque.',
      deletedToast: 'Categoria de produto excluída com sucesso',
      table: {
        description: 'Descrição',
        type: 'Tipo',
        group: 'Grupo',
        financialCategory: 'Categoria Financeira',
        active: 'Ativo',
        activeLabel: 'Ativo',
        inactiveLabel: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma categoria de produto cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira categoria de produto.',
        titleEmptyNoCreate: 'Nenhuma categoria de produto disponível.',
        descriptionEmptyNoCreate:
          'Ainda não há categorias de produto cadastradas. Entre em contato com o administrador da plataforma.',
        titleFiltered: 'Nenhuma categoria de produto encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova Categoria de Produto',
      },
      deleteConfirm: {
        title: 'Excluir categoria de produto',
        description: 'Tem certeza que deseja excluir a categoria de produto',
        warning:
          'Esta exclusão pode ser bloqueada caso a categoria esteja em uso por Tipos (Kind) ou Produtos vinculados.',
      },
    },
    filter: {
      title: 'Filtrar categorias de produto',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
      group: 'Grupo de Produto',
      groupAll: 'Todos',
      type: 'Tipo',
      typeAll: 'Todos',
      typeOptions: {
        input: 'Insumos',
        equipment: 'Máquinas',
        production: 'Produção',
      },
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
    },
    form: {
      title: {
        create: 'Nova Categoria de Produto',
        edit: 'Editar Categoria de Produto',
      },
      subtitle: {
        create: 'Cadastre uma nova categoria para classificar produtos do estoque.',
        edit: 'Atualize os dados da categoria de produto.',
      },
      fields: {
        description: 'Descrição',
        isEnabled: 'Status',
        type: 'Tipo',
        group: 'Grupo de Produto',
        financialCategory: 'Categoria Financeira',
        typeOptions: {
          input: 'Insumos',
          equipment: 'Máquinas',
          production: 'Produção',
        },
      },
      placeholders: {
        description: 'Ex.: Fertilizantes Nitrogenados',
        group: 'Selecione o grupo de produto',
        financialCategory: 'Selecione a categoria financeira',
      },
      isEnabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
      hints: {
        groupRequired: 'Selecione o grupo de produto ao qual esta categoria pertence.',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
        isEnabledRequired: 'Selecione o status',
        typeRequired: 'Selecione o tipo',
        groupRequired: 'Selecione o grupo de produto',
        financialCategoryRequired: 'Selecione a categoria financeira',
      },
    },
  },
};
