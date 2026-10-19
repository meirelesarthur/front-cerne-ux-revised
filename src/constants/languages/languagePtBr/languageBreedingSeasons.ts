// src/constants/languages/languagePtBr/languageBreedingSeasons.ts
// Tradução PT-BR do módulo "Estação de Monta" (BreedingSeason — Operacional /
// Reprodução, 97-Esteiras/003, Tarefas 12/13).

import { ModuleBreedingSeasons } from '@/@types/language/module-breeding-seasons';

export const languageBreedingSeasons: ModuleBreedingSeasons = {
  breedingSeason: {
    singularLabel: 'Estação de Monta',
    pluralLabel: 'Estações de Monta',
    titleModule: 'Estação de Monta',
    list: {
      pageTitle: 'Estação de Monta',
      pageSubtitle: 'Gerencie as estações de monta cadastradas.',
      deletedToast: 'Estação de monta excluída com sucesso',
      newButton: 'Nova Estação de Monta',
      table: {
        code: 'Código',
        date: 'Data Cadastro',
        startDate: 'Data Inicial',
        endDate: 'Data Final',
        responsible: 'Responsável',
        description: 'Descrição',
        actions: 'Ações',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma estação de monta cadastrada.',
        descriptionEmpty: 'Comece cadastrando uma nova estação de monta.',
        titleFiltered: 'Nenhum registro encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros.',
        cta: 'Nova Estação de Monta',
      },
      filter: {
        title: 'Filtrar Estações de Monta',
        responsible: 'Responsável',
      },
      deleteDialog: {
        title: 'Excluir estação de monta?',
        description: 'será excluída permanentemente.',
        warning: 'Esta ação não pode ser desfeita.',
      },
    },
    detail: {
      title: 'Estação de Monta',
      backButton: 'Voltar',
      editButton: 'Editar',
      stats: {
        days: 'Dias',
        weeks: 'Semanas',
      },
      sections: {
        generalData: 'Dados Gerais',
      },
      fields: {
        code: 'Código',
        date: 'Data Cadastro',
        startDate: 'Data Inicial',
        endDate: 'Data Final',
        responsible: 'Responsável',
        description: 'Descrição',
        createdAt: 'Criado em',
        updatedAt: 'Atualizado em',
      },
      notFound: {
        title: 'Estação de monta não encontrada.',
        description: 'O registro pode ter sido excluído ou o link está incorreto.',
      },
      invalidParamsToast: {
        title: 'Estação de Monta',
        description: 'Parâmetros inválidos para exibir o detalhe.',
      },
    },
    form: {
      title: {
        create: 'Nova Estação de Monta',
        edit: 'Editar Estação de Monta',
      },
      fields: {
        code: 'Código',
        responsible: 'Responsável',
        date: 'Data Cadastro',
        description: 'Descrição',
        startDate: 'Data Inicial',
        endDate: 'Data Final',
        daysPreview: 'Dias',
        weeksPreview: 'Semanas',
      },
      validation: {
        dateRequired: 'Informe a data',
        descriptionRequired: 'Informe a descrição',
        startDateRequired: 'Informe a data inicial',
        endDateRequired: 'Informe a data final',
        endDateBeforeStartDate: 'Data de início não pode ser maior que a data final',
      },
      unsavedChangesDialog: {
        title: 'Sair sem salvar?',
        description: 'Existem alterações não salvas neste formulário que serão perdidas',
        confirmButton: 'Sair sem salvar',
      },
    },
    chart: {
      title: 'Dias por mês',
      empty: 'Sem dados para o período informado.',
    },
  },
};
