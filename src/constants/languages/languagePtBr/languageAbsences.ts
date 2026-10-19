// src/constants/languages/languagePtBr/languageAbsences.ts
// Tradução PT-BR do módulo "Registro de Faltas" (Absence — Administrativo /
// Gestão Pessoal, 97-Esteiras/003, Tarefas 12/13).

import { ModuleAbsences } from '@/@types/language/module-absences';

export const languageAbsences: ModuleAbsences = {
  absence: {
    singularLabel: 'Falta',
    pluralLabel: 'Faltas',
    titleModule: 'Registro de Faltas',
    list: {
      pageTitle: 'Registro de Faltas',
      pageSubtitle: 'Gerencie as faltas registradas para os funcionários.',
      deletedToast: 'Falta excluída com sucesso',
      table: {
        date: 'Data',
        employee: 'Funcionário',
        event: 'Evento',
        amount: 'Valor',
        period: 'Período',
        actions: 'Ações',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma falta registrada.',
        descriptionEmpty: 'Comece registrando a falta de um funcionário.',
        titleFiltered: 'Nenhuma falta encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova Falta',
      },
      filter: {
        title: 'Filtrar Faltas',
        employee: 'Funcionário',
        event: 'Evento',
        startDate: 'Data (de)',
        endDate: 'Data (até)',
        dateRangeInvalid: 'A data final não pode ser anterior à data inicial.',
      },
    },
    periodOptions: {
      morning: 'Matutino',
      afternoon: 'Vespertino',
      fullDay: 'Integral',
    },
    form: {
      title: {
        create: 'Nova Falta',
        edit: 'Editar Falta',
        view: 'Visualizar Falta',
      },
      fields: {
        date: 'Data',
        employee: 'Funcionário',
        event: 'Evento',
        period: 'Período',
        amount: 'Valor',
      },
      validation: {
        dateRequired: 'Informe a data',
        employeeRequired: 'Selecione o funcionário',
        eventRequired: 'Selecione o evento',
        amountRequired: 'Informe um valor válido',
      },
    },
  },
};
