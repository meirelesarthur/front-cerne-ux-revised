// src/@types/v2/AccountsReports/index.ts
// -----------------------------------------------------------------------------
// Tipos dos relatórios de Contas (Financeiro) — F-262 C. à Pagar / F-291 C.
// Pagas / F-271 C. a Receber / F-292 C. Recebidas, esteira 97-Esteiras/050.
// Mirror estrutural de `@/@types/v2/Dre` (tela de filtro + download binário,
// SEM grid/prévia) — aqui existem 4 telas irmãs com formato de download
// comum (`pdf`/`xlsx`), direção de ordenação comum (`asc`/`desc`) e
// periodicidade comum (`0|1`, só nos relatórios "em aberto" F-262/F-292).
//
// TASK-050-FE-00 declara o bloco COMPARTILHADO (`ReportFormat`/
// `ReportOrderDirection`/`ReportPeriodicity`/`ReportDownloadParamsBase`).
// TASK-050-262-FE-01 e TASK-050-291-FE-01 ACRESCENTAM os tipos particulares
// do lado despesa (`ExpenseReport*`/`PaidExpenseReport*`); TASK-050-271-FE-01
// e TASK-050-292-FE-01 fecham o lote acrescentando o lado receita
// (`IncomeReport*`/`PaidIncomeReport*`), neste MESMO arquivo.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { ExpenseClassificationValue } from '@/@types/v2/Financeiro/expense';

// ============================================
// COMPARTILHADO (TASK-050-FE-00)
// ============================================

export type ReportFormat = 'pdf' | 'xlsx';
export type ReportOrderDirection = 'asc' | 'desc';
/** 0 = Geral · 1 = Diário — só nos relatórios "em aberto" (F-262/F-292). */
export type ReportPeriodicity = 0 | 1;

/**
 * Campos comuns aos `params` de download dos 4 relatórios (`GET
 * /*-report`/`/*-expenses-report`, sempre `responseType:'blob'`). Cada tela
 * estende este helper com seus próprios campos particulares (`periodicity`,
 * `account_id`, `harvest_id`, `columns`/`order` tipados por enum próprio
 * etc.) — este tipo nunca é usado sozinho como `params` de um service.
 */
export interface ReportDownloadParamsBase {
  start_date?: string;
  end_date?: string;
  start_emission_date?: string;
  end_emission_date?: string;
  farm_id?: string;
  center_id?: string;
  proprietary_id?: string;
  categories?: string[];
  columns: string[];
  order_direction: ReportOrderDirection;
  format: ReportFormat;
}

// ============================================
// F-262 C. à Pagar (TASK-050-262-FE-01) — `GET /expenses-report`,
// `ExpenseReportRequest`/`ExpenseReportColumnEnum`/`ExpenseReportSortEnum`
// (`GB.Cerne.Api`, lidos diretamente — 18 colunas, 5 ordenações, 15 params).
// ============================================

export type ExpenseReportColumnKey =
  | 'number'
  | 'invoice_number'
  | 'provider_name'
  | 'provider_nif'
  | 'proprietary_name'
  | 'note'
  | 'dt_emission'
  | 'due_date'
  | 'value'
  | 'balance'
  | 'interest'
  | 'classification'
  | 'farm'
  | 'type'
  | 'synthetic'
  | 'analytic'
  | 'center'
  | 'products';

export type ExpenseReportOrderKey =
  'dt_emission' | 'due_date' | 'provider_name' | 'proprietary_name' | 'value';

export interface ExpenseReportParams {
  start_date?: string;
  end_date?: string;
  start_emission_date?: string;
  end_emission_date?: string;
  classification?: ExpenseClassificationValue;
  /** `'0'` é a sentinela sintética TRIBUTO (`T-262-RQ-06`), demais itens são uuid de `providers`. */
  providers?: string[];
  categories?: string[];
  proprietary_id?: string;
  farm_id?: string;
  center_id?: string;
  periodicity?: ReportPeriodicity;
  columns: ExpenseReportColumnKey[];
  order: ExpenseReportOrderKey;
  order_direction: ReportOrderDirection;
  format: ReportFormat;
}

/** Shape RHF — Selects/lookups guardam o `Option<T>` inteiro (mirror `charge-schema.ts`), extraído só no `buildParams` do submit. */
export interface ExpenseReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  start_emission_date: string | null;
  end_emission_date: string | null;
  classification: Option<ExpenseClassificationValue> | null;
  providers: string[];
  categories: string[];
  proprietary_id: Option<string> | null;
  farm_id: Option<string> | null;
  center_id: Option<string> | null;
  periodicity: Option<ReportPeriodicity> | null;
  columns: ExpenseReportColumnKey[];
  order: Option<ExpenseReportOrderKey> | null;
  order_direction: Option<ReportOrderDirection> | null;
  format: Option<ReportFormat> | null;
}

// ============================================
// F-291 C. Pagas (TASK-050-291-FE-01) — `GET /paid-expenses-report`,
// `PaidExpenseReportRequest`/`PaidExpenseReportColumnEnum`/
// `PaidExpenseReportSortEnum` (`GB.Cerne.Api` — 19 colunas, 5 ordenações,
// 16 params). SEM sentinela TRIBUTO (`providers.*` exige uuid real) e SEM
// `periodicity` (parâmetro inexistente nesta rota).
// ============================================

export type PaidExpenseReportColumnKey =
  | 'number'
  | 'nfe'
  | 'provider_name'
  | 'nif'
  | 'farm'
  | 'proprietary'
  | 'note'
  | 'products'
  | 'dt_emission'
  | 'due_date'
  | 'date'
  | 'classification'
  | 'synthetic'
  | 'analytic'
  | 'center'
  | 'discount'
  | 'movement_value'
  | 'value'
  | 'harvest';

export type PaidExpenseReportOrderKey =
  'date' | 'number' | 'dt_emission' | 'due_date' | 'net_value';

export interface PaidExpenseReportParams {
  providers?: string[];
  categories?: string[];
  proprietary_id?: string;
  account_id?: string;
  center_id?: string;
  harvest_id?: string;
  /** Datas 1-2 do contrato de tela filtram a DATA DE BAIXA (D-291-04), não o vencimento. */
  start_date?: string;
  end_date?: string;
  start_emission_date?: string;
  end_emission_date?: string;
  classification?: ExpenseClassificationValue;
  farm_id?: string;
  columns: PaidExpenseReportColumnKey[];
  order: PaidExpenseReportOrderKey;
  order_direction: ReportOrderDirection;
  format: ReportFormat;
}

export interface PaidExpenseReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  start_emission_date: string | null;
  end_emission_date: string | null;
  classification: Option<ExpenseClassificationValue> | null;
  providers: string[];
  categories: string[];
  proprietary_id: Option<string> | null;
  account_id: Option<string> | null;
  center_id: Option<string> | null;
  harvest_id: Option<string> | null;
  farm_id: Option<string> | null;
  columns: PaidExpenseReportColumnKey[];
  order: Option<PaidExpenseReportOrderKey> | null;
  order_direction: Option<ReportOrderDirection> | null;
  format: Option<ReportFormat> | null;
}

// ============================================
// F-271 C. a Receber (TASK-050-271-FE-01) — `GET /incomes-report`,
// `IncomeReportRequest`/`IncomeReportColumnEnum`/`IncomeReportSortEnum`
// (`GB.Cerne.Api`, lidos diretamente — 16 colunas, 5 ordenações, 12 params).
// Espelho do irmão F-262 no lado receita (Cliente no lugar de Fornecedor):
// SEM sentinela TRIBUTO, SEM `classification` e SEM coluna `products` — o
// legado não os oferece nesta rota (contrato de tela §2/§4, "não inventar").
// ============================================

export type IncomeReportColumnKey =
  | 'number'
  | 'nfe'
  | 'client_name'
  | 'client_nif'
  | 'proprietary_name'
  | 'note'
  | 'dt_emission'
  | 'due_date'
  | 'value'
  | 'balance'
  | 'interest'
  | 'farm'
  | 'type'
  | 'synthetic'
  | 'analytic'
  | 'center';

export type IncomeReportOrderKey =
  'dt_emission' | 'due_date' | 'client_name' | 'proprietary_name' | 'value';

export interface IncomeReportParams {
  clients?: string[];
  categories?: string[];
  center_id?: string;
  proprietary_id?: string;
  farm_id?: string;
  periodicity?: ReportPeriodicity;
  start_date?: string;
  end_date?: string;
  start_emission_date?: string;
  end_emission_date?: string;
  columns: IncomeReportColumnKey[];
  order: IncomeReportOrderKey;
  order_direction: ReportOrderDirection;
  format: ReportFormat;
}

/** Shape RHF — Selects/lookups guardam o `Option<T>` inteiro, extraído só no `buildParams` do submit. */
export interface IncomeReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  start_emission_date: string | null;
  end_emission_date: string | null;
  clients: string[];
  categories: string[];
  proprietary_id: Option<string> | null;
  farm_id: Option<string> | null;
  center_id: Option<string> | null;
  periodicity: Option<ReportPeriodicity> | null;
  columns: IncomeReportColumnKey[];
  order: Option<IncomeReportOrderKey> | null;
  order_direction: Option<ReportOrderDirection> | null;
  format: Option<ReportFormat> | null;
}

// ============================================
// F-292 C. Recebidas (TASK-050-292-FE-01) — `GET /paid-incomes-report`,
// `PaidIncomeReportRequest`/`PaidIncomeReportColumnEnum`/
// `PaidIncomeReportSortEnum` (`GB.Cerne.Api` — 16 colunas, 5 ordenações, 14
// params). Superfície MENOR que o irmão F-291 DE PROPÓSITO (`D-292-SIM`,
// docblock do `PaidIncomeReportRequest`) — SEM `harvest_id`, SEM
// `classification`, SEM `periodicity`; SEM as colunas `products`/
// `classification`/`harvest`. Reusa `listClientOptions` (LAC-FE-02,
// TASK-050-271-FE-01).
// ============================================

export type PaidIncomeReportColumnKey =
  | 'number'
  | 'nfe'
  | 'client_name'
  | 'nif'
  | 'farm'
  | 'proprietary'
  | 'note'
  | 'dt_emission'
  | 'due_date'
  | 'date'
  | 'synthetic'
  | 'analytic'
  | 'center'
  | 'discount'
  | 'movement_value'
  | 'value';

export type PaidIncomeReportOrderKey = 'date' | 'number' | 'dt_emission' | 'due_date' | 'net_value';

export interface PaidIncomeReportParams {
  clients?: string[];
  categories?: string[];
  proprietary_id?: string;
  account_id?: string;
  center_id?: string;
  /** Datas 1-2 do contrato de tela filtram a DATA DE BAIXA (D-292-09). */
  start_date?: string;
  end_date?: string;
  start_emission_date?: string;
  end_emission_date?: string;
  farm_id?: string;
  columns: PaidIncomeReportColumnKey[];
  order: PaidIncomeReportOrderKey;
  order_direction: ReportOrderDirection;
  format: ReportFormat;
}

export interface PaidIncomeReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  start_emission_date: string | null;
  end_emission_date: string | null;
  clients: string[];
  categories: string[];
  proprietary_id: Option<string> | null;
  account_id: Option<string> | null;
  center_id: Option<string> | null;
  farm_id: Option<string> | null;
  columns: PaidIncomeReportColumnKey[];
  order: Option<PaidIncomeReportOrderKey> | null;
  order_direction: Option<ReportOrderDirection> | null;
  format: Option<ReportFormat> | null;
}

// ============================================
// F-289 Pag. Prev. X Real (TASK-289-FE-01) — `GET /pag-prev-real-report`,
// `PagPrevRealReportRequest` (`GB.Cerne.Api`) — 8 params + format, SEM
// `columns[]`/`order`/`order_direction` (colunas e ordenação são fixas no
// servidor, `ORDER BY expenses.due_date`, RN-06). Reusa `ReportFormat` de
// cima — NÃO reusa `ReportDownloadParamsBase` (tem campos obrigatórios que
// aqui não existem).
// ============================================

export type PagPrevRealCondition = 'S' | 'C';

export interface PagPrevRealReportParams {
  start_date: string;
  end_date: string;
  providers?: string[];
  proprietary_id?: string;
  center_id?: string;
  categories?: string[];
  farm_id?: string;
  condition?: PagPrevRealCondition;
  format: ReportFormat;
}

/** Shape RHF — Selects/lookups guardam o `Option<T>` inteiro, extraído só no `buildParams` do submit. */
export interface PagPrevRealReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  providers: string[];
  proprietary_id: Option<string> | null;
  center_id: Option<string> | null;
  categories: string[];
  farm_id: Option<string> | null;
  condition: Option<PagPrevRealCondition> | null;
  format: Option<ReportFormat> | null;
}

// ============================================
// F-297 Rec. Prev. X Real (TASK-079-297-FE-01, esteira 97-Esteiras/079) —
// `GET /rec-prev-real-report`, `RecPrevRealReportRequest` (`GB.Cerne.Api`)
// — mirror ESTRUTURAL de `PagPrevRealReportParams`/`PagPrevRealReportFilterForm`
// acima (lado Despesa), trocando `providers[]` por `clients[]` (lado
// Receita, lookup `listClientOptions`, mirror F-271/`ContasAReceber`). SEM
// `columns[]`/`order`/`order_direction` (colunas e ordenação fixas no
// servidor, mesma razão de RN-06 do irmão F-289).
// ============================================

export type RecPrevRealCondition = 'S' | 'C';

export interface RecPrevRealReportParams {
  start_date: string;
  end_date: string;
  clients?: string[];
  proprietary_id?: string;
  center_id?: string;
  categories?: string[];
  farm_id?: string;
  condition?: RecPrevRealCondition;
  format: ReportFormat;
}

/** Shape RHF — Selects/lookups guardam o `Option<T>` inteiro, extraído só no `buildParams` do submit. */
export interface RecPrevRealReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  clients: string[];
  proprietary_id: Option<string> | null;
  center_id: Option<string> | null;
  categories: string[];
  farm_id: Option<string> | null;
  condition: Option<RecPrevRealCondition> | null;
  format: Option<ReportFormat> | null;
}

// ============================================
// F-219 Adiantamento (TASK-055-FE-01, esteira 97-Esteiras/055) — `GET
// /advance-report`, `AdvanceReportRequest` (`GB.Cerne.Api`) — 9 params (2
// datas obrigatórias + `number` texto livre + 5 lookups + `format`), SEM
// `columns[]`/`order`/`order_direction` (colunas e ordenação fixas no
// servidor). NÃO reusa `ReportDownloadParamsBase` (tem campos obrigatórios
// que aqui não existem) — mirror estrutural de `PagPrevRealReportParams`.
//
// Divergência-chave frente aos irmãos `ExpenseReportParams`/
// `PagPrevRealReportParams`: os lookups `provider`/`client`/`proprietary`/
// `center`/`farm` são SINGLE-select (legado usa select2 simples, NÃO
// multi-checkbox) — por isso `provider_id`/`client_id` aqui, não
// `providers[]`/`clients[]`.
// ============================================

export interface AdvanceReportParams {
  start_date: string;
  end_date: string;
  number?: string;
  farm_id?: string;
  provider_id?: string;
  client_id?: string;
  proprietary_id?: string;
  center_id?: string;
  format: ReportFormat;
}

/** Shape RHF — Selects/lookups guardam o `Option<T>` inteiro (mirror `PagPrevRealReportFilterForm`), extraído só no `buildParams` do submit. */
export interface AdvanceReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  number: string | null;
  farm_id: Option<string> | null;
  provider_id: Option<string> | null;
  client_id: Option<string> | null;
  proprietary_id: Option<string> | null;
  center_id: Option<string> | null;
  format: Option<ReportFormat> | null;
}
