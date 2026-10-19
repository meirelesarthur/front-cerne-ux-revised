// src/@types/language/module-dashboards/cashbook-dashboard.d.ts
// Tipo espelhado da tela Livro Caixa (execução 048, TASK-03-FE).

export interface ModuleDashboardsCashbookDashboard {
  /** Usado na composição da query-key (`dashboards.cashbookDashboard`). */
  singularLabel: string;
  title: string;
  subtitle: string;
  filter: {
    title: string;
    year: string;
    proprietary: string;
    proprietaryAllPlaceholder: string;
    operation: string;
    operationOptions: {
      all: string;
      income: string;
      expense: string;
    };
  };
  kpis: {
    totalEntrance: string;
    totalExit: string;
    totalBalance: string;
    projectedBalance: string;
    /** Rótulo curto ao lado das variações % (`entrance_variation`/`exit_variation`/`balance_percentage`), fiel ao legado. */
    vsLastYear: string;
    /** Nota curta sob "Saldo projetado (12m)" — explica o cálculo (run-rate × 12). */
    projectedBalanceNote: string;
  };
  charts: {
    cashFlowTitle: string;
    cashFlowEntrance: string;
    cashFlowExit: string;
    cashFlowBalance: string;
  };
  accounts: {
    title: string;
  };
  movements: {
    title: string;
    month: string;
    columns: {
      date: string;
      document: string;
      person: string;
      type: string;
      value: string;
    };
    noDocument: string;
    noPerson: string;
  };
}
