// src/constants/languages/languagePtBr/languageCategoriaAnimal.ts
// Tradução PT-BR do módulo "Categorias Animais" (CategoryAnimal — Cadastros
// Base / Pecuários, execução 025). TASK-FE-540 (infra + validação) +
// TASK-FE-541 (listagem/filtro).

import { ModuleCategoryAnimals } from '@/@types/language/module-category-animals';

export const languageCategoriaAnimal: ModuleCategoryAnimals = {
  categoryAnimal: {
    singularLabel: 'Categoria Animal',
    pluralLabel: 'Categorias Animais',

    genderOptions: {
      male: 'Macho',
      female: 'Fêmea',
      both: 'Ambos',
    },

    list: {
      pageTitle: 'Categorias Animais',
      pageSubtitle: 'Administre as categorias de animais utilizadas na pecuária.',
      deletedToast: 'Categoria animal excluída com sucesso',
      table: {
        description: 'Descrição',
        specie: 'Espécie',
        specieEmpty: '—',
        gender: 'Sexo',
        ageRange: 'Faixa etária',
        ageRangeEmpty: '—',
        ageRangeFrom: 'a partir de {months} meses',
        ageRangeTo: 'até {months} meses',
        ageRangeBetween: 'de {start} a {end} meses',
        active: 'Status',
        activeLabel: 'Ativo',
        inactiveLabel: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma categoria animal cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira categoria.',
        titleEmptyNoCreate: 'Nenhuma categoria animal disponível.',
        descriptionEmptyNoCreate:
          'Ainda não há categorias cadastradas. Entre em contato com o administrador da plataforma.',
        titleFiltered: 'Nenhuma categoria encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova Categoria',
      },
      deleteConfirm: {
        title: 'Excluir categoria animal',
        description: 'Tem certeza que deseja excluir a categoria',
        warning:
          'Esta ação é definitiva e não pode ser desfeita. Se houver vínculos dependentes, a exclusão pode ser bloqueada pelo sistema.',
      },
    },

    filter: {
      title: 'Filtrar categorias animais',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
      specie: 'Espécie',
      specieAll: 'Todas',
      gender: 'Sexo',
      genderAll: 'Todos',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
    },

    form: {
      title: {
        create: 'Nova Categoria Animal',
        edit: 'Editar Categoria Animal',
      },
      subtitle: {
        create: 'Cadastre uma nova categoria de animal vinculada a uma espécie.',
        edit: 'Atualize os dados da categoria animal.',
      },
      fields: {
        description: 'Descrição',
        isEnabled: 'Ativo',
        specie: 'Espécie',
        gender: 'Sexo',
        startMonth: 'Mês inicial',
        endMonth: 'Mês final',
        nextCategory: 'Próxima Categoria (Evolução)',
      },
      placeholders: {
        description: 'Ex.: Bezerro',
        specie: 'Buscar por descrição',
        nextCategory: 'Buscar por descrição',
      },
      hints: {
        specieRequired: 'A espécie é obrigatória.',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
        specieRequired: 'Selecione uma espécie',
        genderRequired: 'Selecione o sexo',
        startMonthMin: 'O mês inicial não pode ser negativo',
        endMonthMin: 'O mês final não pode ser negativo',
      },
    },
  },
};
