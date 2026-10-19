// src/constants/languages/languagePtBr/languageClasses.ts
// Tradução PT-BR do módulo de CLASSES DE PRODUTO (Kind — Cadastros Base /
// Estrutura, execução 024).

import { ModuleKinds } from '@/@types/language/module-kinds';

export const languageClasses: ModuleKinds = {
  kind: {
    singularLabel: 'Classe',
    list: {
      pageTitle: 'Classes',
      pageSubtitle: 'Administre as classes de produto vinculadas às categorias cadastradas.',
      deletedToast: 'Classe excluída com sucesso',
      table: {
        name: 'Nome',
        category: 'Categoria',
        active: 'Ativo',
        activeLabel: 'Ativo',
        inactiveLabel: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma classe cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira classe.',
        titleEmptyNoCreate: 'Nenhuma classe disponível.',
        descriptionEmptyNoCreate:
          'Ainda não há classes cadastradas. Entre em contato com o administrador da plataforma.',
        titleFiltered: 'Nenhuma classe encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova Classe',
      },
      deleteConfirm: {
        title: 'Excluir classe',
        description: 'Tem certeza que deseja excluir a classe',
        warning:
          'Se houver produtos vinculados a esta classe, a exclusão será bloqueada pelo sistema.',
      },
    },
    filter: {
      title: 'Filtrar classes',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nome',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
      category: 'Categoria',
      categoryAll: 'Todas',
      categorySearchPlaceholder: 'Buscar por descrição',
    },
    form: {
      title: {
        create: 'Nova Classe',
        edit: 'Editar Classe',
      },
      subtitle: {
        create: 'Cadastre uma nova classe de produto vinculada a uma categoria.',
        edit: 'Atualize os dados da classe.',
      },
      fields: {
        name: 'Nome',
        isEnabled: 'Ativo',
        category: 'Categoria',
      },
      placeholders: {
        name: 'Ex.: Fertilizante Nitrogenado',
        category: 'Buscar por descrição',
      },
      hints: {
        categoryRequired: 'A categoria é obrigatória.',
      },
      validation: {
        nameRequired: 'O nome é obrigatório',
        nameMaxLength: 'O nome deve ter no máximo 100 caracteres',
        categoryRequired: 'Selecione uma categoria',
      },
    },
  },
};
