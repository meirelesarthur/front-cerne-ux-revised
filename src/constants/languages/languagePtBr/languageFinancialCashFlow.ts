// src/constants/languages/languagePtBr/languageFinancialCashFlow.ts
// Tradução PT-BR do relatório "Fluxo Bancário" (F-107, esteira 070,
// TASK-CF-FE-01). Composto dentro de `languageFinancial.ts` (chave
// `financial.cashFlow`, mirror `expense`/`mercadoPago`/`ofxImport`) — ver
// `@/@types/language/module-financial/cash-flow.d.ts` para o tipo.
//
// Rótulos exatos do legado (CLM-31).

import type { CashFlowLanguage } from '@/@types/language/module-financial/cash-flow';

export const languageFinancialCashFlow: CashFlowLanguage = {
  singularLabel: 'Fluxo Bancário',
  pluralLabel: 'Fluxos Bancários',
  pageTitle: 'Análise do Fluxo Bancário',
  pageSubtitle: 'Fluxo Bancário Realizado',

  filter: {
    accountLabel: 'Conta Bancária',
    accountPlaceholder: 'Todas as contas',
    periodLabel: 'Periodicidade',
    periodOptions: {
      diary: 'Diário',
      monthly: 'Mensal',
      yearly: 'Anual',
    },
    typeLabel: 'Tipo',
    typeOptions: {
      synthetic: 'Sintético',
      analytical: 'Analítico',
    },
    startDateLabel: 'Dt. Início',
    endDateLabel: 'Dt. Fim',
    filterButton: 'Filtrar',
    clearButton: 'Limpar',
    endAfterStartError: 'A data final deve ser igual ou posterior à data inicial.',
  },

  emptyBeforeFilter: 'Aplique os filtros e clique em Filtrar.',
  emptyReport: 'Nenhuma informação encontrada.',
  errorMessage: 'Não foi possível carregar o relatório de fluxo bancário.',
  retryButton: 'Tentar novamente',

  cards: {
    sectionTitle: 'Saldos',
    cashierLabel: 'Em Caixa',
    accountsLabel: 'Em bancos',
  },

  charts: {
    incomeExpenseTitle: 'Entradas x Saídas',
    balanceTitle: 'Saldo inicial x Saldo final',
    initialBalanceLabel: 'Saldo Inicial',
    finalBalanceLabel: 'Saldo Final',
  },

  table: {
    dateColumn: 'Dt. Movimento',
    incomesColumn: 'Entradas',
    expensesColumn: 'Saídas',
    balanceDayColumn: 'Saldo do Dia',
    balanceColumn: 'Saldo Bancário',
    totalRowLabel: 'Total',
  },

  drilldown: {
    title: 'Movimentações da Data',
    dateColumn: 'Data',
    noteColumn: 'Histórico',
    typeColumn: 'Tipo',
    valueColumn: 'Valor',
    notInformed: 'Não informado',
    incomeLabel: 'Entrada',
    expenseLabel: 'Saída',
  },

  resultTitle: 'Resultado do período',
  printButton: 'Imprimir',
};
