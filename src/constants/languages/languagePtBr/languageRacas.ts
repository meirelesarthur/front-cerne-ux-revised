// src/constants/languages/languagePtBr/languageRacas.ts
// Tradução PT-BR do módulo de RAÇAS (Cadastros Base).

import { ModuleBreeds } from '@/@types/language/module-breeds';

export const languageRacas: ModuleBreeds = {
  breed: {
    singularLabel: 'Raça',
    list: {
      pageTitle: 'Raças',
      pageSubtitle: 'Administre as raças vinculadas às espécies cadastradas.',
      deletedToast: 'Raça excluída com sucesso',
      table: {
        description: 'Descrição',
        specie: 'Espécie',
        active: 'Ativo',
        activeLabel: 'Ativo',
        inactiveLabel: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma raça cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira raça.',
        titleEmptyNoCreate: 'Nenhuma raça disponível.',
        descriptionEmptyNoCreate:
          'Ainda não há raças cadastradas. Entre em contato com o administrador da plataforma.',
        titleFiltered: 'Nenhuma raça encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova Raça',
      },
      deleteConfirm: {
        title: 'Excluir raça',
        description: 'Tem certeza que deseja excluir a raça',
        warning:
          'Esta ação não pode ser desfeita. Uma raça com registros vinculados não pode ser excluída; nesse caso, desative-a.',
      },
    },
    filter: {
      title: 'Filtrar raças',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
      specie: 'Espécie',
      specieAll: 'Todas',
      specieSearchPlaceholder: 'Buscar por descrição',
    },
    form: {
      title: {
        create: 'Nova Raça',
        edit: 'Editar Raça',
      },
      subtitle: {
        create: 'Cadastre uma nova raça vinculada a uma espécie.',
        edit: 'Atualize os dados da raça.',
      },
      fields: {
        description: 'Descrição',
        isEnabled: 'Ativo',
        specie: 'Espécie',
      },
      placeholders: {
        description: 'Ex.: Nelore',
        specie: 'Buscar por descrição',
      },
      hints: {
        specieRequired: 'A espécie é obrigatória.',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
        specieRequired: 'Selecione uma espécie',
      },
    },
  },
};
