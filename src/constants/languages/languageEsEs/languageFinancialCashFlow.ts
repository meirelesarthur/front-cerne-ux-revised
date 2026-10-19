// src/constants/languages/languageEsEs/languageFinancialCashFlow.ts
// Traducción ES-ES del informe "Flujo Bancario" (F-107, esteira 070,
// TASK-CF-FE-01). Espejo de
// `languagePtBr/languageFinancialCashFlow.ts` (misma forma de claves).

import type { CashFlowLanguage } from '@/@types/language/module-financial/cash-flow';

export const languageFinancialCashFlow: CashFlowLanguage = {
  singularLabel: 'Flujo Bancario',
  pluralLabel: 'Flujos Bancarios',
  pageTitle: 'Análisis del Flujo Bancario',
  pageSubtitle: 'Flujo Bancario Realizado',

  filter: {
    accountLabel: 'Cuenta Bancaria',
    accountPlaceholder: 'Todas las cuentas',
    periodLabel: 'Periodicidad',
    periodOptions: {
      diary: 'Diario',
      monthly: 'Mensual',
      yearly: 'Anual',
    },
    typeLabel: 'Tipo',
    typeOptions: {
      synthetic: 'Sintético',
      analytical: 'Analítico',
    },
    startDateLabel: 'Fecha Inicio',
    endDateLabel: 'Fecha Fin',
    filterButton: 'Filtrar',
    clearButton: 'Limpiar',
    endAfterStartError: 'La fecha final debe ser igual o posterior a la fecha inicial.',
  },

  emptyBeforeFilter: 'Aplique los filtros y haga clic en Filtrar.',
  emptyReport: 'Ningún resultado encontrado.',
  errorMessage: 'No fue posible cargar el informe de flujo bancario.',
  retryButton: 'Intentar de nuevo',

  cards: {
    sectionTitle: 'Saldos',
    cashierLabel: 'En Caja',
    accountsLabel: 'En bancos',
  },

  charts: {
    incomeExpenseTitle: 'Entradas x Salidas',
    balanceTitle: 'Saldo inicial x Saldo final',
    initialBalanceLabel: 'Saldo Inicial',
    finalBalanceLabel: 'Saldo Final',
  },

  table: {
    dateColumn: 'Fecha Movimiento',
    incomesColumn: 'Entradas',
    expensesColumn: 'Salidas',
    balanceDayColumn: 'Saldo del Día',
    balanceColumn: 'Saldo Bancario',
    totalRowLabel: 'Total',
  },

  drilldown: {
    title: 'Movimientos de la Fecha',
    dateColumn: 'Fecha',
    noteColumn: 'Histórico',
    typeColumn: 'Tipo',
    valueColumn: 'Valor',
    notInformed: 'No informado',
    incomeLabel: 'Entrada',
    expenseLabel: 'Salida',
  },

  resultTitle: 'Resultado del período',
  printButton: 'Imprimir',
};
