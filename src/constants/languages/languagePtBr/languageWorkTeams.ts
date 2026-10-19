// src/constants/languages/languagePtBr/languageWorkTeams.ts
// Tradução PT-BR do módulo de EQUIPES (Administrativo / Gestão Pessoal).
// Namespace `workTeams` — GAP-EQ-FE-01 (colisão com `languageGB.teams` do
// domínio SaaS/billing).

import { ModuleWorkTeams } from '@/@types/language/module-work-teams';

export const languageWorkTeams: ModuleWorkTeams = {
  workTeam: {
    singularLabel: 'Equipe',
    pluralLabel: 'Equipes',
    list: {
      pageTitle: 'Equipes',
      pageSubtitle: 'Gerencie as equipes de trabalho e seus integrantes.',
      deletedToast: 'Equipe excluída com sucesso',
      table: {
        name: 'Nome',
        description: 'Descrição',
        supervisor: 'Encarregado',
        supervisorEmpty: '—',
        status: 'Status',
        statusActive: 'Ativo',
        statusInactive: 'Inativo',
        createdAt: 'Dt. Criação',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma equipe cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira equipe.',
        titleFiltered: 'Nenhum registro encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar',
      },
      error: {
        message: 'Não foi possível carregar os dados.',
        retry: 'Tentar novamente',
      },
    },
    filter: {
      title: 'Filtrar equipes',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nome ou descrição',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
    },
    deleteDialog: {
      title: 'Confirmar exclusão',
      descriptionTemplate: '{name} será excluído permanentemente. Esta ação não pode ser desfeita.',
    },
    reportButton: {
      label: 'Relatório PDF',
      successToast: 'Relatório baixado com sucesso',
      exportError: {
        title: 'Relatório',
        description: 'Não foi possível gerar o relatório. Tente novamente.',
      },
    },
    form: {
      title: {
        create: 'Nova equipe',
        edit: 'Editar equipe',
        view: 'Visualizar equipe',
      },
      backButton: 'Voltar',
      fields: {
        name: 'Nome',
        description: 'Descrição',
        employeeUuid: 'Encarregado',
        isEnabled: 'Ativo',
      },
      placeholders: {
        name: 'Nome da equipe',
        description: 'Descrição da equipe',
        employeeUuid: 'Selecione o encarregado',
      },
      validation: {
        nameMaxLength: 'O nome deve ter no máximo 30 caracteres.',
        descriptionMaxLength: 'A descrição deve ter no máximo 50 caracteres.',
        memberRowIncomplete: 'Selecione o Tipo e o Integrante desta linha, ou remova-a.',
      },
      members: {
        sectionTitle: 'Integrantes',
        addButton: 'Adicionar',
        removeRowButton: 'Remover integrante',
        emptyState: 'Nenhum integrante cadastrado.',
        incompleteRowWarning: 'Preencha todos os campos antes de adicionar novos.',
        memberPlaceholder: 'Selecione o integrante',
        memberPlaceholderNoType: 'Selecione o tipo primeiro',
        optionsError: 'Não foi possível carregar os integrantes.',
        optionsRetry: 'Tentar novamente',
        table: {
          type: 'Tipo',
          member: 'Integrante',
          active: 'Ativo',
        },
        typeOptions: {
          employee: 'Funcionário',
          thirdParty: 'Terceirizado',
        },
      },
      unsavedChanges: {
        title: 'Alterações não salvas',
        message: 'Você tem alterações não salvas. Deseja sair sem salvar?',
        confirm: 'Sair sem salvar',
      },
      businessErrorFallback: 'Não foi possível salvar a equipe. Verifique os dados informados.',
    },
  },
};
