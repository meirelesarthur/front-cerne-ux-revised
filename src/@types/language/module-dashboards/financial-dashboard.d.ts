// src/@types/language/module-dashboards/financial-dashboard.d.ts
// Tipo espelhado da tela Financeiro (execução 048, TASK-04-FE). **DEC-191:
// sem heatmap de receita por hora** — nenhuma chave relacionada existe aqui,
// de propósito.

export interface ModuleDashboardsFinancialDashboard {
  /** Usado na composição da query-key (`dashboards.financialDashboard`). */
  singularLabel: string;
  title: string;
  subtitle: string;
  filter: {
    title: string;
    year: string;
    month: string;
    months: {
      january: string;
      february: string;
      march: string;
      april: string;
      may: string;
      june: string;
      july: string;
      august: string;
      september: string;
      october: string;
      november: string;
      december: string;
    };
    costCenter: string;
    costCenterAllPlaceholder: string;
  };
  kpis: {
    monthIncomes: string;
    monthExpenses: string;
    monthBalance: string;
    overdueTotal: string;
  };
  budget: {
    title: string;
    centerLabel: string;
    realized: string;
    predicted: string;
  };
  overdue: {
    title: string;
    payable: string;
    receivable: string;
    detailsAction: string;
    modalTitle: string;
    columns: {
      description: string;
      dueDate: string;
      amount: string;
      type: string;
    };
    typeExpense: string;
    typeIncome: string;
  };
  byCostCenter: {
    title: string;
    columns: {
      costCenter: string;
      incomes: string;
      expenses: string;
      balance: string;
    };
  };
  expensesByCategory: {
    title: string;
    centerLabel: string;
  };
  dueSoon: {
    title: string;
    noDescription: string;
  };
  evolution: {
    title: string;
    incomesSeries: string;
    expensesSeries: string;
  };
}
