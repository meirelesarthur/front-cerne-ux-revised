// src/@types/language/module-accounts-reports/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Relatórios de Contas" (Financeiro) — F-262
// C. à Pagar / F-291 C. Pagas / F-271 C. a Receber / F-292 C. Recebidas,
// esteira 97-Esteiras/050. Módulo top-level ÚNICO (`accountsReports`)
// compartilhado pelas 4 telas irmãs (mirror `dre`/`dreAnnual` — chave
// TOP-LEVEL própria) — `shared` cobre os campos/opções em comum (formato,
// direção de ordenação, periodicidade, seletor de colunas, botão de gerar,
// mensagens de download, validação); cada tela tem sua própria sub-chave
// com `pageTitle`/`fields`/`columns`/`orderOptions` PRÓPRIOS — nenhuma
// coluna é compartilhada entre telas, cada uma espelha seu próprio
// `*ColumnEnum` da API.
//
// `shared.fields.startDate/endDate` guardam o rótulo GENÉRICO ("Data
// Início"/"Data Fim") — TASK-050-291-FE-02 confirma que quando o
// SIGNIFICADO diverge por tela (F-262 filtra Vencimento, F-291 filtra Data
// da Baixa) o rótulo usado é o da PRÓPRIA sub-chave (`expenses.fields.
// startDate`/`paidExpenses.fields.startDate`), nunca o genérico
// `shared.fields.startDate` — por isso cada sub-chave de tela também
// declara seu próprio par `startDate`/`endDate`.
//
// TASK-050-FE-00 preenche só `shared`. TASK-050-262-FE-01 e
// TASK-050-291-FE-01 completam `expenses` e `paidExpenses` (lado despesa).
// TASK-050-271-FE-01 e TASK-050-292-FE-01 fecham o lote completando
// `incomes` e `paidIncomes` (lado receita).
// -----------------------------------------------------------------------------

export interface ModuleAccountsReportsShared {
  formatOptions: {
    pdf: string;
    xlsx: string;
  };
  orderDirectionOptions: {
    asc: string;
    desc: string;
  };
  periodicityOptions: {
    general: string;
    daily: string;
  };
  fields: {
    /** Rótulo genérico ("Data Início") — telas com significado divergente (Vencimento/Baixa) usam o par próprio em `expenses.fields`/`paidExpenses.fields`. */
    startDate: string;
    endDate: string;
    startEmissionDate: string;
    endEmissionDate: string;
    farm: string;
    costCenter: string;
    proprietary: string;
    categories: string;
    columns: string;
    order: string;
    orderDirection: string;
    format: string;
    periodicity: string;
  };
  columnsFieldLabel: string;
  columnsSearchPlaceholder: string;
  columnsEmptyMessage: string;
  selectAll: string;
  deselectAll: string;
  lookupSearchPlaceholder: string;
  lookupEmptyMessage: string;
  generateButton: string;
  downloadError: string;
  downloadSuccess: string;
  apportionmentHint: string;
  validation: {
    invalidDateRange: string;
    invalidEmissionDateRange: string;
    columnsRequired: string;
  };
}

export interface ModuleAccountsReportsExpensesColumns {
  number: string;
  invoice_number: string;
  provider_name: string;
  provider_nif: string;
  proprietary_name: string;
  note: string;
  dt_emission: string;
  due_date: string;
  value: string;
  balance: string;
  interest: string;
  classification: string;
  farm: string;
  type: string;
  synthetic: string;
  analytic: string;
  center: string;
  products: string;
}

export interface ModuleAccountsReportsExpensesOrderOptions {
  dt_emission: string;
  due_date: string;
  provider_name: string;
  proprietary_name: string;
  value: string;
}

export interface ModuleAccountsReportsExpenses {
  pageTitle: string;
  pageSubtitle: string;
  fields: {
    startDate: string;
    endDate: string;
    classification: string;
    providers: string;
  };
  columns: ModuleAccountsReportsExpensesColumns;
  orderOptions: ModuleAccountsReportsExpensesOrderOptions;
  /** Item sintético prepended na lista de Fornecedores (`providers[]='0'`, `T-262-RQ-06`). */
  providerTributeLabel: string;
}

export interface ModuleAccountsReportsPaidExpensesColumns {
  number: string;
  nfe: string;
  provider_name: string;
  nif: string;
  farm: string;
  proprietary: string;
  note: string;
  products: string;
  dt_emission: string;
  due_date: string;
  date: string;
  classification: string;
  synthetic: string;
  analytic: string;
  center: string;
  discount: string;
  movement_value: string;
  value: string;
  harvest: string;
}

export interface ModuleAccountsReportsPaidExpensesOrderOptions {
  date: string;
  number: string;
  dt_emission: string;
  due_date: string;
  net_value: string;
}

export interface ModuleAccountsReportsPaidExpenses {
  pageTitle: string;
  pageSubtitle: string;
  fields: {
    /** "Data da Baixa" — NÃO "Vencimento" (D-291-04). */
    startDate: string;
    endDate: string;
    classification: string;
    providers: string;
    account: string;
    harvest: string;
  };
  columns: ModuleAccountsReportsPaidExpensesColumns;
  orderOptions: ModuleAccountsReportsPaidExpensesOrderOptions;
}

export interface ModuleAccountsReportsIncomesColumns {
  number: string;
  nfe: string;
  client_name: string;
  client_nif: string;
  proprietary_name: string;
  note: string;
  dt_emission: string;
  due_date: string;
  value: string;
  balance: string;
  interest: string;
  farm: string;
  type: string;
  synthetic: string;
  analytic: string;
  center: string;
}

export interface ModuleAccountsReportsIncomesOrderOptions {
  dt_emission: string;
  due_date: string;
  client_name: string;
  proprietary_name: string;
  value: string;
}

/** F-271 C. a Receber (TASK-050-271-FE-01) — espelho do F-262, SEM Classificação/Produtos. */
export interface ModuleAccountsReportsIncomes {
  pageTitle: string;
  pageSubtitle: string;
  fields: {
    startDate: string;
    endDate: string;
    clients: string;
  };
  columns: ModuleAccountsReportsIncomesColumns;
  orderOptions: ModuleAccountsReportsIncomesOrderOptions;
}

export interface ModuleAccountsReportsPaidIncomesColumns {
  number: string;
  nfe: string;
  client_name: string;
  nif: string;
  farm: string;
  proprietary: string;
  note: string;
  dt_emission: string;
  due_date: string;
  date: string;
  synthetic: string;
  analytic: string;
  center: string;
  discount: string;
  movement_value: string;
  value: string;
}

export interface ModuleAccountsReportsPaidIncomesOrderOptions {
  date: string;
  number: string;
  dt_emission: string;
  due_date: string;
  net_value: string;
}

/**
 * F-292 C. Recebidas (TASK-050-292-FE-01) — superfície MENOR que o F-291
 * DE PROPÓSITO (`D-292-SIM`): SEM Safra, SEM Classificação, SEM
 * Periodicidade. Reusa o campo `clients` (não `providers`).
 */
export interface ModuleAccountsReportsPaidIncomes {
  pageTitle: string;
  pageSubtitle: string;
  fields: {
    /** "Dt. Baixa — Início" — NÃO "Vencimento" (D-292-09). */
    startDate: string;
    endDate: string;
    clients: string;
    account: string;
  };
  columns: ModuleAccountsReportsPaidIncomesColumns;
  orderOptions: ModuleAccountsReportsPaidIncomesOrderOptions;
}

/**
 * F-289 Pag. Prev. X Real (TASK-289-FE-01, esteira 054) — relatório
 * download-only, SEM seletor de colunas (`columns`/`orderOptions` fixos no
 * servidor, RN-06) — por isso não tem os campos `columns`/`orderOptions`
 * que as demais sub-chaves desta interface têm.
 */
export interface ModuleAccountsReportsPagPrevReal {
  pageTitle: string;
  pageSubtitle: string;
  conditionOptions: {
    withoutCategory: string;
    withCategory: string;
  };
  fields: {
    startDate: string;
    endDate: string;
    providers: string;
    condition: string;
  };
}

/**
 * F-219 Adiantamento (TASK-055-FE-01, esteira 055) — relatório
 * download-only, SEM seletor de colunas (fixo no servidor) — mirror
 * `ModuleAccountsReportsPagPrevReal`. `proprietary`/`farm`/`costCenter`/
 * `format` reusam `shared.fields`; `number`/`provider`/`client` são
 * PRÓPRIOS desta tela (lookups SINGLE-select, campo texto livre novo).
 */
export interface ModuleAccountsReportsAdvance {
  pageTitle: string;
  pageSubtitle: string;
  fields: {
    startDate: string;
    endDate: string;
    number: string;
    provider: string;
    client: string;
  };
}

/**
 * F-297 Rec. Prev. X Real (TASK-079-297-FE-01, esteira 079) — relatório
 * download-only, SEM seletor de colunas (`columns`/`orderOptions` fixos no
 * servidor) — mirror EXATO de `ModuleAccountsReportsPagPrevReal` (lado
 * Despesa), trocando `providers`→`clients` (lado Receita).
 */
export interface ModuleAccountsReportsRecPrevReal {
  pageTitle: string;
  pageSubtitle: string;
  conditionOptions: {
    withoutCategory: string;
    withCategory: string;
  };
  fields: {
    startDate: string;
    endDate: string;
    clients: string;
    condition: string;
  };
}

export interface ModuleAccountsReports {
  shared: ModuleAccountsReportsShared;
  expenses: ModuleAccountsReportsExpenses;
  paidExpenses: ModuleAccountsReportsPaidExpenses;
  incomes: ModuleAccountsReportsIncomes;
  paidIncomes: ModuleAccountsReportsPaidIncomes;
  pagPrevReal: ModuleAccountsReportsPagPrevReal;
  recPrevReal: ModuleAccountsReportsRecPrevReal;
  advance: ModuleAccountsReportsAdvance;
}
