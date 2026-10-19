// src/constants/languages/languagePtBr/languageGroupers.ts
// Tradução PT-BR do módulo de AGRUPADORES (Grouper — Cadastros Base / Financeiro).

import { ModuleGroupers } from '@/@types/language/module-groupers';

export const languageGroupers: ModuleGroupers = {
  grouper: {
    singularLabel: 'Agrupador',
    list: {
      pageTitle: 'Agrupadores',
      pageSubtitle: 'Administre a árvore de agrupadores utilizada no plano de contas financeiro.',
      deletedToast: 'Agrupador removido com sucesso',
      table: {
        code: 'Código',
        name: 'Nome',
        description: 'Descrição',
        type: 'Tipo',
        condition: 'Condição',
        order: 'Ordem',
        operations: 'Operações',
        status: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
        addChild: 'Adicionar agrupador filho',
        expand: 'Expandir',
        collapse: 'Recolher',
      },
      emptyState: {
        titleEmpty: 'Nenhum agrupador cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro agrupador.',
        titleFiltered: 'Nenhum agrupador encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Agrupador',
      },
      deleteConfirm: {
        title: 'Excluir agrupador',
        description: 'Tem certeza que deseja excluir o agrupador',
        warning:
          'Esta ação também excluirá todos os agrupadores descendentes, caso existam, e não pode ser desfeita.',
      },
      loadingChildren: 'Carregando descendentes...',
      error: {
        message: 'Não foi possível carregar os descendentes deste agrupador.',
        retry: 'Tentar novamente',
      },
    },
    filter: {
      title: 'Filtrar agrupadores',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nome ou código',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
      type: 'Tipo',
      typeAll: 'Todos',
      typeOptions: {
        cost: 'Custo',
        revenue: 'Receita',
        depreciation: 'Depreciação',
        financial: 'Financeiro',
      },
      condition: 'Condição',
      conditionAll: 'Todas',
      conditionOptions: {
        category: 'Categoria',
        calculation: 'Cálculo',
      },
    },
    form: {
      title: {
        create: 'Novo Agrupador',
        edit: 'Editar Agrupador',
        createChild: 'Novo Agrupador Filho',
      },
      subtitle: {
        create: 'Cadastre um novo agrupador no plano de contas financeiro.',
        edit: 'Atualize os dados do agrupador.',
      },
      fields: {
        name: 'Nome',
        description: 'Descrição',
        type: 'Tipo',
        condition: 'Condição',
        isEnabled: 'Status',
        order: 'Ordem',
        formula: 'Fórmula',
        parent: 'Agrupador pai',
      },
      placeholders: {
        name: 'Ex.: Custos Fixos, Receitas Operacionais',
        description: 'Descrição opcional do agrupador',
        formula: 'Fórmula opcional de cálculo',
      },
      parentPlaceholder: {
        root: 'Nenhum (agrupador raiz)',
      },
      typeOptions: {
        cost: 'Custo',
        revenue: 'Receita',
        depreciation: 'Depreciação',
        financial: 'Financeiro',
      },
      conditionOptions: {
        category: 'Categoria',
        calculation: 'Cálculo',
      },
      validation: {
        nameRequired: 'O nome é obrigatório',
        nameMaxLength: 'O nome deve ter no máximo 60 caracteres',
        descriptionMaxLength: 'A descrição deve ter no máximo 50 caracteres',
        typeRequired: 'O tipo é obrigatório',
        conditionRequired: 'A condição é obrigatória',
        isEnabledRequired: 'O status é obrigatório',
        orderRequired: 'A ordem é obrigatória',
        orderMin: 'A ordem deve ser no mínimo 1',
        formulaMaxLength: 'A fórmula deve ter no máximo 191 caracteres',
      },
    },
  },
};
