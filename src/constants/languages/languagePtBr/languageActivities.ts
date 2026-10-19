// src/constants/languages/languagePtBr/languageActivities.ts
// Tradução PT-BR do módulo de ATIVIDADES (Activity — Cadastros Base / Agrícola).

import { ModuleActivities } from '@/@types/language/module-activities';

export const languageActivities: ModuleActivities = {
  activity: {
    singularLabel: 'Atividade',
    list: {
      pageTitle: 'Atividades',
      pageSubtitle: 'Administre as atividades utilizadas na apropriação de custo por hectare.',
      deletedToast: 'Atividade removida com sucesso',
      table: {
        name: 'Nome',
        description: 'Descrição',
        vlHectare: 'Valor/Hectare',
        type: 'Tipo',
        use: 'Uso',
        operations: 'Operações',
        status: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma atividade cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira atividade.',
        titleFiltered: 'Nenhuma atividade encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova Atividade',
      },
    },
    filter: {
      title: 'Filtrar atividades',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nome',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
      type: 'Tipo',
      typeAll: 'Todos',
      typeOptions: {
        costing: 'Custeio',
        investment: 'Investimento',
        undefined: 'Á Definir',
      },
      use: 'Uso',
      useAll: 'Todos',
      useOptions: {
        both: 'Ambos',
        agriculture: 'Agricultura',
        fruitculture: 'Fruticultura',
        beefCattle: 'Pecuária de Corte',
      },
    },
    form: {
      title: {
        create: 'Nova Atividade',
        edit: 'Editar Atividade',
      },
      subtitle: {
        create: 'Cadastre uma nova atividade para uso na apropriação de custos.',
        edit: 'Atualize os dados da atividade.',
      },
      fields: {
        name: 'Nome',
        description: 'Descrição',
        vlHectare: 'Valor/Hectare',
        type: 'Tipo',
        use: 'Uso',
        isEnabled: 'Status',
        operations: 'Operações',
      },
      operationsField: {
        searchPlaceholder: 'Buscar operação por nome',
        selectAllLabel: 'Marcar todos',
        deselectAllLabel: 'Desmarcar todos',
        selectedCountLabel: 'Nº de registros selecionados',
        emptyLabel: 'Nenhuma operação encontrada.',
        errorLabel: 'Erro ao carregar as operações.',
        retryLabel: 'Tentar novamente',
      },
      placeholders: {
        name: 'Ex.: Colheita de Soja, Manutenção de Cerca',
        description: 'Descrição opcional da atividade',
        vlHectare: '0,00',
      },
      typeOptions: {
        costing: 'Custeio',
        investment: 'Investimento',
        undefined: 'Á Definir',
      },
      useOptions: {
        both: 'Ambos',
        agriculture: 'Agricultura',
        fruitculture: 'Fruticultura',
        beefCattle: 'Pecuária de Corte',
      },
      validation: {
        nameRequired: 'O nome é obrigatório',
        nameMaxLength: 'O nome deve ter no máximo 30 caracteres',
        descriptionMaxLength: 'A descrição deve ter no máximo 50 caracteres',
        isEnabledRequired: 'O status é obrigatório',
        vlHectareRequired: 'O valor por hectare é obrigatório',
        vlHectareMin: 'O valor por hectare não pode ser negativo',
        typeRequired: 'O tipo é obrigatório',
        useRequired: 'O uso é obrigatório',
      },
    },
  },
};
