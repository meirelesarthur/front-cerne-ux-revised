// src/constants/languages/languagePtBr/languageSpecies.ts
// Tradução PT-BR do módulo de ESPÉCIES (Cadastros Base).

import { ModuleSpecies } from '@/@types/language/module-species';

export const languageSpecies: ModuleSpecies = {
  specie: {
    singularLabel: 'Espécie',
    list: {
      pageTitle: 'Espécies',
      pageSubtitle: 'Administre as espécies utilizadas no cadastro de animais.',
      deletedToast: 'Espécie removida com sucesso',
      table: {
        description: 'Descrição',
        status: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma espécie cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira espécie.',
        titleFiltered: 'Nenhuma espécie encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova Espécie',
      },
    },
    filter: {
      title: 'Filtrar espécies',
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
        create: 'Nova Espécie',
        edit: 'Editar Espécie',
      },
      subtitle: {
        create: 'Cadastre uma nova espécie para uso no cadastro de animais.',
        edit: 'Atualize os dados da espécie.',
      },
      fields: {
        description: 'Descrição',
        isEnabled: 'Status',
        costCenter: 'Centro de Custo',
      },
      placeholders: {
        description: 'Ex.: Bovino',
        costCenter: 'Buscar por código ou descrição',
      },
      hints: {
        costCenterOptional: 'Opcional — vincule um centro de custo para apropriar receitas e despesas desta espécie.',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
      },
    },
  },
};
