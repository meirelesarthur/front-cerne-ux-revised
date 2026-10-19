// src/@types/v2/Dashboards/cashbookDashboard/index.d.ts
// Tipos da dashboard Livro Caixa (execução 048, TASK-03-FE). Backend JÁ
// EXISTE (`CashBookDashboardController`/`GetCashBookDashboardAction`/
// `ListCashBookMonthlyMovementsAction`) — shape abaixo é ESPELHO EXATO do
// array retornado por `GetCashBookDashboardAction::handle()` (fonte:
// `GB.Cerne.Api/app/Actions/CashBook/GetCashBookDashboardAction.php`), não
// um contrato planejado. `meta` aditivo (ver `dashboard-meta.d.ts`) — este
// endpoint hoje não publica `meta`, mas a tela trata como ausente sem
// quebrar (mesma convenção das demais dashboards).

import type { Option } from '@/@types/option';
import type { DashboardMeta } from '@/@types/v2/Dashboards/dashboard-meta';

/** `CashBookDashboardRequest::rules()['operation']` — `A` (Ambos, default). */
export type CashbookOperation = 'A' | 'E' | 'S';

/** Forma INTERNA do filtro (Option-based) — mesmo racional de `AssetsDashboardFilterForm`. */
export interface CashbookDashboardFilterForm {
  year: Option<number> | null;
  proprietary: Option<string> | null;
  operation: Option<CashbookOperation> | null;
}

export interface CashbookDashboardFilterRequest {
  year?: number;
  proprietary_id?: string;
  operation?: CashbookOperation;
}

export interface CashbookMovementsFilterRequest extends CashbookDashboardFilterRequest {
  month: number;
}

export interface CashbookKpis {
  total_entrance: number;
  total_exit: number;
  total_balance: number;
  entrance_variation: number | null;
  exit_variation: number | null;
  projected_entrance: number;
  projected_exit: number;
  projected_balance: number;
  balance_percentage: number;
  balance_percentage_bar: number;
}

export interface CashbookAccountSummary {
  uuid: string;
  bank: string | null;
  agency: string | null;
  account: string | null;
  description: string | null;
  total: number;
  balance: number;
  share: number;
}

export interface CashbookMonthRow {
  month: number;
  month_label: string;
  year: number;
  entrance: number;
  exit: number;
  balance: number;
  accumulated_balance: number;
  has_data: boolean;
  is_past: boolean;
  is_current: boolean;
  is_future: boolean;
}

export interface CashbookDashboardData {
  year: number;
  operation: CashbookOperation;
  kpis: CashbookKpis;
  accounts: CashbookAccountSummary[];
  months: CashbookMonthRow[];
  has_lcdpr: boolean;
  meta?: DashboardMeta;
}

/** `ListCashBookMonthlyMovementsAction::handle()` — shape exato por item. */
export interface CashbookMovementRow {
  document: string | null;
  person: string | null;
  value: number;
  date: string;
  type: 'E' | 'S' | null;
  type_label: string;
}
