// src/constants/languages/languagePtBr/languageWarehouses.ts
// Tradução PT-BR do módulo de ARMAZÉNS (Cadastros Base).

import { ModuleWarehouses } from '@/@types/language/module-warehouses';

export const languageWarehouses: ModuleWarehouses = {
  warehouse: {
    singularLabel: 'Armazém',
    list: {
      pageTitle: 'Armazéns',
      pageSubtitle: 'Administre os armazéns utilizados para o controle de estoques.',
      deletedToast: 'Armazém removido com sucesso',
      table: {
        initials: 'Sigla',
        description: 'Descrição',
        type: 'Tipo',
        active: 'Status',
        activeLabel: 'Ativo',
        inactiveLabel: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum armazém cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro armazém.',
        titleFiltered: 'Nenhum armazém encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar Armazém',
      },
    },
    filter: {
      title: 'Filtrar armazéns',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por sigla ou descrição',
      type: 'Tipo',
      typeAll: 'Todos',
      typeOptions: {
        insumos: 'Insumos',
        producao: 'Produção',
        formulacao: 'Formulação',
      },
      isActive: 'Status',
      isActiveAll: 'Todos',
      activeOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
    },
    form: {
      title: {
        create: 'Novo Armazém',
        edit: 'Editar Armazém',
      },
      subtitle: {
        create: 'Cadastre um novo armazém para o controle de estoques.',
        edit: 'Atualize os dados do armazém.',
      },
      fields: {
        initials: 'Sigla',
        type: 'Tipo',
        description: 'Descrição',
        isActive: 'Ativo',
      },
      placeholders: {
        initials: 'Ex.: ALG',
        description: 'Ex.: Armazém de Insumos - Sede',
      },
      hints: {
        isActiveHelp: 'Armazéns inativos deixam de aparecer como opção em outras telas do sistema.',
      },
      validation: {
        initialsRequired: 'A sigla é obrigatória',
        initialsMinLength: 'A sigla deve ter no mínimo 2 caracteres',
        initialsMaxLength: 'A sigla deve ter no máximo 6 caracteres',
        typeRequired: 'Selecione um tipo',
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMinLength: 'A descrição deve ter no mínimo 2 caracteres',
        descriptionMaxLength: 'A descrição deve ter no máximo 80 caracteres',
      },
    },
  },
};
