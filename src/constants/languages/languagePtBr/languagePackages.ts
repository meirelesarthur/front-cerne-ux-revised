// src/constants/languages/languagePtBr/languagePackages.ts
// Tradução PT-BR do módulo de EMBALAGENS (Package — Cadastros Base /
// Estrutura, execução 025).

import { ModulePackages } from '@/@types/language/module-packages';

export const languagePackages: ModulePackages = {
  package: {
    singularLabel: 'Embalagem',
    form: {
      title: {
        create: 'Nova Embalagem',
        edit: 'Editar Embalagem',
      },
      subtitle: {
        create: 'Cadastre uma nova embalagem vinculada a uma unidade de medida.',
        edit: 'Atualize os dados da embalagem.',
      },
      fields: {
        description: 'Descrição',
        size: 'Quantidade',
        measurement: 'Unidade de Medida',
      },
      placeholders: {
        description: 'Ex: SC 60KG',
        measurement: 'Selecione...',
      },
      hints: {
        measurementRequired: 'A unidade de medida é obrigatória.',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 255 caracteres',
        sizeRequired: 'A quantidade é obrigatória',
        sizeMin: 'A quantidade deve ser maior que zero',
        measurementRequired: 'Selecione uma unidade de medida',
      },
      noFarmSelected: {
        title: 'Selecione uma fazenda',
        description:
          'O catálogo de Embalagens é compartilhado por todas as fazendas do tenant, mas o acesso exige uma fazenda ativa selecionada.',
      },
    },
    list: {
      pageTitle: 'Embalagens',
      pageSubtitle: 'Administre as embalagens vinculadas às unidades de medida cadastradas.',
      columns: {
        description: 'Descrição',
        size: 'Quantidade',
        measurement: 'Un. de Medida',
        actions: 'Ações',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      deletedToast: 'Embalagem excluída com sucesso',
      empty: {
        title: 'Nenhuma embalagem cadastrada',
        description: 'Comece adicionando a primeira embalagem.',
      },
      emptyState: {
        titleEmpty: 'Nenhuma embalagem cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira embalagem.',
        titleEmptyNoCreate: 'Nenhuma embalagem disponível.',
        descriptionEmptyNoCreate:
          'Ainda não há embalagens cadastradas. Entre em contato com o administrador da plataforma.',
        titleFiltered: 'Nenhuma embalagem encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova Embalagem',
      },
      deleteConfirm: {
        title: 'Excluir embalagem',
        description: 'Tem certeza que deseja excluir a embalagem',
        warning:
          'Se houver produtos vinculados a esta embalagem, a exclusão será bloqueada pelo sistema.',
      },
      noFarmSelected: {
        title: 'Selecione uma fazenda',
        description:
          'O catálogo de Embalagens é compartilhado por todas as fazendas do tenant, mas o acesso exige uma fazenda ativa selecionada.',
      },
    },
    filter: {
      title: 'Filtrar embalagens',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
      measurement: 'Unidade de Medida',
      measurementAll: 'Todas',
    },
  },
};
