// src/constants/languages/languagePtBr/languageBonuses.ts
// Tradução PT-BR do módulo de REGISTRO DE EVENTOS (Bonus — Administrativo).
// Esteira 037 — CRUD núcleo (sem parcelas/dimensão financeira, fora do
// contrato real de Bonus).

import { ModuleBonuses } from '@/@types/language/module-bonuses';

export const languageBonuses: ModuleBonuses = {
  bonus: {
    singularLabel: 'Registro de Evento',
    pluralLabel: 'Registros de Eventos',
    list: {
      pageTitle: 'Registros de Eventos',
      pageSubtitle: 'Administre os eventos de bônus registrados para os funcionários.',
      deletedToast: 'Registro de evento removido com sucesso',
      table: {
        employee: 'Funcionário',
        event: 'Evento',
        date: 'Data',
        amount: 'Valor',
        actions: 'Ações',
      },
      actions: {
        view: 'Visualizar registro de evento',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum registro de evento cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro registro de evento.',
        cta: 'Novo Registro de Evento',
      },
    },
    detail: {
      generalData: {
        title: 'Dados Gerais',
      },
      fields: {
        employee: 'Funcionário',
        event: 'Evento',
        date: 'Data',
        amount: 'Valor',
      },
      actions: {
        edit: 'Editar',
      },
      notFound: {
        title: 'Registro de evento não encontrado',
        description:
          'O registro de evento solicitado não existe, foi removido ou pertence a outra fazenda.',
        back: 'Voltar para Registros de Eventos',
      },
    },
    form: {
      title: {
        create: 'Novo Registro de Evento',
        edit: 'Editar Registro de Evento',
      },
      fields: {
        employee: 'Funcionário',
        event: 'Evento',
        date: 'Data',
        amount: 'Valor',
      },
      validation: {
        employeeRequired: 'Selecione o funcionário',
        eventRequired: 'Selecione o evento',
        dateRequired: 'A data é obrigatória',
        amountRequired: 'Informe um valor válido',
      },
    },
  },
};
