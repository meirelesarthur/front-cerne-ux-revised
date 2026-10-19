// src/constants/languages/languagePtBr/languageFinancialFreeze.ts
// Tradução PT-BR da feature "Congelamentos Financeiros" (FinancialFreeze —
// F-110, esteira 97-Esteiras/008, Tarefa 31). Composto dentro de
// `languageFinancial.ts` (chave `financial.financialFreeze`, mirror
// `expense`/`mercadoPago`/`ofxImport`) — ver
// `@/@types/language/module-financial/financial-freeze.d.ts` para o tipo.

import type { FinancialFreezeLanguage } from '@/@types/language/module-financial/financial-freeze';

export const languageFinancialFreeze: FinancialFreezeLanguage = {
  singularLabel: 'Congelamento Financeiro',
  pluralLabel: 'Congelamentos Financeiros',

  months: {
    january: 'Janeiro',
    february: 'Fevereiro',
    march: 'Março',
    april: 'Abril',
    may: 'Maio',
    june: 'Junho',
    july: 'Julho',
    august: 'Agosto',
    september: 'Setembro',
    october: 'Outubro',
    november: 'Novembro',
    december: 'Dezembro',
  },

  list: {
    pageTitle: 'Congelamentos Financeiros',
    pageSubtitle: 'Meses com lançamentos financeiros bloqueados.',
    table: {
      month: 'Mês',
      year: 'Ano',
      responsible: 'Responsável',
      isFrozen: 'Congelado?',
      createdAt: 'Dt. Criação',
      updatedAt: 'Dt. Atualização',
    },
    actions: {
      view: 'Visualizar',
      edit: 'Editar',
      delete: 'Excluir',
    },
    emptyState: {
      titleEmpty: 'Nenhum congelamento financeiro cadastrado.',
      descriptionEmpty: 'Cadastre um congelamento para bloquear lançamentos do mês.',
      titleFiltered: 'Nenhum resultado para este filtro.',
      descriptionFiltered: 'Ajuste os filtros e tente novamente.',
      cta: 'Novo',
    },
    deletedToast: 'excluído(a) com sucesso',
  },

  filter: {
    title: 'Filtrar Congelamentos Financeiros',
    month: 'Mês',
    monthAll: 'Todos os meses',
    year: 'Ano',
    yearPlaceholder: 'Ex.: 2026',
  },

  form: {
    title: {
      create: 'Novo Congelamento Financeiro',
      edit: 'Editar Congelamento Financeiro',
      view: 'Visualizar Congelamento Financeiro',
    },
    fields: {
      month: 'Mês',
      year: 'Ano',
      isFrozen: 'Congelado?',
    },
    validation: {
      monthRequired: 'O mês é obrigatório.',
      yearRequired: 'O ano é obrigatório.',
      yearDigits: 'O ano deve conter 4 dígitos.',
      isFrozenRequired: 'O campo de congelamento é obrigatório.',
    },
    createdToast: 'criado(a) com sucesso',
    updatedToast: 'atualizado(a) com sucesso',
    historySection: {
      title: 'Histórico de Movimentações',
      emptyLabel: 'Nenhuma movimentação registrada.',
      columns: {
        isFrozen: 'Congelado?',
        responsible: 'Responsável',
        date: 'Data',
      },
    },
  },
};
