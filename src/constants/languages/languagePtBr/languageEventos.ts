// src/constants/languages/languagePtBr/languageEventos.ts
// Tradução PT-BR do módulo de EVENTOS (Administrativo / Gestão Pessoal).

import { ModuleEvents } from '@/@types/language/module-events';

export const languageEventos: ModuleEvents = {
  event: {
    singularLabel: 'Evento',
    pluralLabel: 'Eventos',
    list: {
      pageTitle: 'Eventos',
      pageSubtitle: 'Gerencie o catálogo de eventos (rubricas de folha de pagamento).',
      deletedToast: 'Evento excluído com sucesso',
      table: {
        name: 'Nome',
        type: 'Periodicidade',
        method: 'Método',
        condition: 'Condição',
        active: 'Ativo',
        activeLabel: 'Ativo',
        inactiveLabel: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum evento cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro evento.',
        titleFiltered: 'Nenhum evento encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Evento',
      },
      error: {
        message: 'Não foi possível carregar os eventos.',
        retry: 'Tentar novamente',
      },
    },
    filter: {
      title: 'Filtrar eventos',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nome',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
      dateFrom: 'Data de cadastro (de)',
      dateTo: 'Data de cadastro (até)',
      dateRangeInvalid: 'A data final não pode ser anterior à data inicial.',
    },
    deleteBlocked: {
      title: 'Não é possível excluir',
      description:
        'Existem registros vinculados a este evento. Remova ou reatribua os vínculos abaixo antes de excluir',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        earning_event: 'Provento(s) vinculado(s)',
        employee_events: 'Funcionário(s) vinculado(s)',
        absences: 'Falta(s) vinculada(s)',
        bonuses: 'Bônus vinculado(s)',
        advances: 'Adiantamento(s) vinculado(s)',
      },
    },
    typeOptions: {
      weekly: 'Semanal',
      biweekly: 'Quinzenal',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      semiannual: 'Semestral',
      annual: 'Anual',
    },
    methodOptions: {
      informed: 'Informado',
      fixed: 'Fixo',
    },
    conditionOptions: {
      sum: 'Soma',
      decrease: 'Diminui',
    },
    form: {
      title: { create: 'Novo Evento', edit: 'Editar Evento' },
      subtitle: {
        create: 'Cadastre um novo evento (rubrica de folha de pagamento).',
        edit: 'Atualize os dados do evento.',
      },
      fields: {
        name: 'Nome',
        type: 'Periodicidade',
        method: 'Método',
        condition: 'Condição',
        isEnabled: 'Ativo',
      },
      placeholders: {
        name: 'Ex.: Salário Família',
      },
      validation: {
        nameMaxLength: 'O nome deve ter no máximo 30 caracteres',
      },
    },
  },
};
