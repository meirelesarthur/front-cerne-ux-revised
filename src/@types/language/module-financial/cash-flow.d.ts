// src/@types/language/module-financial/cash-flow.d.ts
// -----------------------------------------------------------------------------
// Tipo de tradução do relatório "Fluxo Bancário" (F-107, esteira 070,
// TASK-CF-FE-01). Chave irmã de `expense`/`mercadoPago`/`ofxImport`/
// `financialFreeze`/`budgetPlanning` dentro de `ModuleFinancial`
// (`financial.cashFlow.*`), mesma técnica de decomposição (arquivo próprio,
// ver `./ofx-import.d.ts` como mirror de forma).
//
// Rótulos exatos do legado (CLM-31, F-107 frontend contract §"Leitura do
// dev"/§3/§4): "Fluxo Bancário", "Análise do Fluxo Bancário", "Fluxo
// Bancário Realizado", "Conta Bancária", "Periodicidade"/"Diário"/"Mensal"/
// "Anual", "Tipo"/"Sintético"/"Analítico", "Dt. Início", "Dt. Fim",
// "Filtrar", "Limpar", "Saldos"/"Em Caixa"/"Em bancos", "Entradas x
// Saídas", "Saldo inicial x Saldo final", "Dt. Movimento", "Entradas",
// "Saídas", "Saldo do Dia", "Saldo Bancário", "Nenhuma informação
// encontrada.", "Movimentações da Data", "Data", "Histórico", "Tipo",
// "Valor", "Não informado".
//
// ESCOPO desta rodada (TASK-CF-FE-01/02): só `filter`/`emptyBeforeFilter`/
// `emptyReport`/`errorMessage`/`retryButton` são CONSUMIDOS pela tela ainda
// (casco + filtro + fetch manual). `cards`/`charts`/`table`/`drilldown`/
// `printButton` já nascem tipados e traduzidos aqui (fundação, TASK-CF-FE-01)
// para `TASK-CF-FE-03`/`TASK-CF-FE-04` consumirem sem precisar reabrir este
// arquivo — mirror da decisão de fundação completa antes da UI faseada.
// -----------------------------------------------------------------------------

export interface CashFlowLanguage {
  singularLabel: string;
  pluralLabel: string;
  pageTitle: string;
  pageSubtitle: string;

  filter: {
    accountLabel: string;
    accountPlaceholder: string;
    periodLabel: string;
    periodOptions: {
      diary: string;
      monthly: string;
      yearly: string;
    };
    typeLabel: string;
    typeOptions: {
      synthetic: string;
      analytical: string;
    };
    startDateLabel: string;
    endDateLabel: string;
    filterButton: string;
    clearButton: string;
    endAfterStartError: string;
  };

  emptyBeforeFilter: string;
  emptyReport: string;
  errorMessage: string;
  retryButton: string;

  cards: {
    sectionTitle: string;
    cashierLabel: string;
    accountsLabel: string;
  };

  charts: {
    incomeExpenseTitle: string;
    balanceTitle: string;
    // Rótulos das 2 barras do gráfico "Saldo inicial x Saldo final"
    // (TASK-CF-FE-03 §4.2) — adição aditiva à fundação (TASK-CF-FE-01), que
    // já previa o título do card mas não os rótulos por barra.
    initialBalanceLabel: string;
    finalBalanceLabel: string;
  };

  table: {
    dateColumn: string;
    incomesColumn: string;
    expensesColumn: string;
    balanceDayColumn: string;
    balanceColumn: string;
    totalRowLabel: string;
  };

  drilldown: {
    title: string;
    dateColumn: string;
    noteColumn: string;
    typeColumn: string;
    valueColumn: string;
    notInformed: string;
    incomeLabel: string;
    expenseLabel: string;
  };

  resultTitle: string;
  printButton: string;
}
