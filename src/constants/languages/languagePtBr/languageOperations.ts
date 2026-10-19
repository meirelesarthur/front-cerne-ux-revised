// src/constants/languages/languagePtBr/languageOperations.ts
// Tradução PT-BR do módulo de OPERAÇÕES (Operation — Cadastros Base / Agrícola).

import { ModuleOperations } from '@/@types/language/module-operations';

export const languageOperations: ModuleOperations = {
  operation: {
    singularLabel: 'Operação',
    list: {
      pageTitle: 'Operações',
      pageSubtitle: 'Administre as operações vinculadas às atividades agrícolas e pecuárias.',
      deletedToast: 'Operação removida com sucesso',
      table: {
        name: 'Nome',
        grouper: 'Agrupador',
        order: 'Ordem',
        status: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
        noGrouper: 'Nenhum',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma operação cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira operação.',
        titleFiltered: 'Nenhuma operação encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova Operação',
      },
    },
    filter: {
      title: 'Filtrar operações',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nome',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
      use: 'Uso',
      useAll: 'Todos',
      useOptions: {
        both: 'Ambos',
        agriculture: 'Agricultura',
        livestock: 'Pecuária',
      },
      grouper: 'Agrupador',
      grouperAll: 'Todos',
    },
    form: {
      title: {
        create: 'Nova Operação',
        edit: 'Editar Operação',
      },
      subtitle: {
        create: 'Cadastre uma nova operação para uso nas atividades agrícolas e pecuárias.',
        edit: 'Atualize os dados da operação.',
      },
      fields: {
        name: 'Nome',
        description: 'Descrição',
        grouper: 'Agrupador',
        order: 'Ordem',
        use: 'Uso',
        isEnabled: 'Status',
      },
      placeholders: {
        name: 'Ex.: Plantio, Colheita, Pulverização',
        description: 'Descrição opcional da operação',
        grouper: 'Buscar agrupador por código ou nome',
        order: '0',
      },
      useOptions: {
        both: 'Ambos',
        agriculture: 'Agricultura',
        livestock: 'Pecuária',
      },
      validation: {
        nameRequired: 'O nome é obrigatório',
        nameMaxLength: 'O nome deve ter no máximo 30 caracteres',
        descriptionMaxLength: 'A descrição deve ter no máximo 50 caracteres',
        orderRequired: 'A ordem é obrigatória',
        useRequired: 'O uso é obrigatório',
        isEnabledRequired: 'O status é obrigatório',
      },
    },
  },
};
