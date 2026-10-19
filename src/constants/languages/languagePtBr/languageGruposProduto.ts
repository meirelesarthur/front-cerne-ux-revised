// src/constants/languages/languagePtBr/languageGruposProduto.ts
// Tradução PT-BR do módulo de GRUPOS DE PRODUTO (Cadastros Base).

import { ModuleProductGroups } from '@/@types/language/module-product-groups';

export const languageGruposProduto: ModuleProductGroups = {
  productGroup: {
    singularLabel: 'Grupo de Produto',
    list: {
      pageTitle: 'Grupos de Produto',
      pageSubtitle: 'Administre os grupos utilizados para classificar os produtos do estoque.',
      deletedToast: 'Grupo de produto excluído com sucesso',
      table: {
        description: 'Descrição',
        active: 'Ativo',
        activeLabel: 'Ativo',
        inactiveLabel: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum grupo de produto cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro grupo de produto.',
        titleEmptyNoCreate: 'Nenhum grupo de produto disponível.',
        descriptionEmptyNoCreate:
          'Ainda não há grupos de produto cadastrados. Entre em contato com o administrador da plataforma.',
        titleFiltered: 'Nenhum grupo de produto encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Grupo de Produto',
      },
      deleteConfirm: {
        title: 'Excluir grupo de produto',
        description: 'Tem certeza que deseja excluir o grupo de produto',
        warning:
          'Esta exclusão é definitiva e não pode ser desfeita — o grupo de produto não utiliza exclusão reversível (sem lixeira).',
      },
    },
    filter: {
      title: 'Filtrar grupos de produto',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
    },
    form: {
      title: {
        create: 'Novo Grupo de Produto',
        edit: 'Editar Grupo de Produto',
      },
      subtitle: {
        create: 'Cadastre um novo grupo para classificar produtos do estoque.',
        edit: 'Atualize os dados do grupo de produto.',
      },
      fields: {
        description: 'Descrição',
        isEnabled: 'Status',
      },
      placeholders: {
        description: 'Ex.: Insumos Agrícolas',
      },
      isEnabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
        isEnabledRequired: 'Selecione o status',
      },
    },
  },
};
