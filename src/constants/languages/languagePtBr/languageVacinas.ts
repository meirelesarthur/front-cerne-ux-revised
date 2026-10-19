// src/constants/languages/languagePtBr/languageVacinas.ts
// Tradução PT-BR do módulo de VACINAS (Cadastros Base / Pecuária).

import { ModuleVaccines } from '@/@types/language/module-vaccines';

export const languageVacinas: ModuleVaccines = {
  vaccine: {
    singularLabel: 'Vacina',
    list: {
      pageTitle: 'Vacinas',
      pageSubtitle: 'Administre os tipos de vacina aplicáveis aos animais.',
      deletedToast: 'Vacina excluída com sucesso',
      table: {
        description: 'Descrição',
        specie: 'Espécie',
        active: 'Ativo',
        activeLabel: 'Ativo',
        inactiveLabel: 'Inativo',
      },
      actions: { edit: 'Editar', delete: 'Excluir' },
      emptyState: {
        titleEmpty: 'Nenhuma vacina cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira vacina.',
        titleEmptyNoCreate: 'Nenhuma vacina disponível.',
        descriptionEmptyNoCreate:
          'Ainda não há vacinas cadastradas. Entre em contato com o administrador da plataforma.',
        titleFiltered: 'Nenhuma vacina encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova Vacina',
      },
      deleteConfirm: {
        title: 'Excluir vacina',
        description: 'Tem certeza que deseja excluir a vacina',
        warning:
          'Esta ação não pode ser desfeita. Uma vacina com registros vinculados não pode ser excluída; nesse caso, desative-a.',
      },
    },
    filter: {
      title: 'Filtrar vacinas',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: { active: 'Ativa', inactive: 'Inativa' },
      specie: 'Espécie',
      specieAll: 'Todas',
      specieSearchPlaceholder: 'Buscar por descrição',
    },
    form: {
      title: { create: 'Nova Vacina', edit: 'Editar Vacina' },
      subtitle: {
        create: 'Cadastre um novo tipo de vacina.',
        edit: 'Atualize os dados da vacina.',
      },
      fields: { description: 'Descrição', isEnabled: 'Status', specie: 'Espécie' },
      placeholders: { description: 'Ex.: Aftosa', specie: 'Buscar por descrição' },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
      },
    },
  },
};
