// src/@types/v2/ReceiptCashflowReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Fluxo Mensal de Recebimento" (F-303, esteira
// 97-Esteiras/059, TASK-303-API-01/02/03,
// `CONTRATO-F303-fluxo-mensal-recebimento.md` §"Decisão de arquitetura").
// Download-only puro (PDF+Excel via campo `format` único, SEM grid/prévia,
// SEM seletor de colunas — 11 colunas fixas server-side). Mirror ESTRUTURAL
// de `@/@types/v2/CashFlowByCategoryReport` (irmã direta, mesmo tipo de
// fluxo: `accounts[]` via `CheckboxListField` remoto + período +
// `proprietary_id`/`center_id`/`farm_id`), MENOS `group`/`last_balance`/
// `report_type` (F-303 não tem regime nem saldo anterior) MAIS `categories[]`
// (mirror `@/@types/v2/AccountsReports` — `IncomeReportFilterForm`/
// `ReceiptScheduleReportParams` — categorias tipo `type_id=2`/"Entradas").
//
// Campos EXATOS de `ReceiptCashflowReportRequest::rules()` (API real,
// branch `feature/059-relatorios`, lida diretamente):
//   accounts[]     opcional uuid[] tenant-scoped (`Rule::exists('accounts','uuid')`)
//   start_date     obrigatório date
//   end_date       obrigatório date (after_or_equal:start_date)
//   proprietary_id opcional uuid
//   center_id      opcional uuid (centro GLOBAL de tenant nulo OU do tenant, class=2 Analítico)
//   categories[]   opcional uuid[] (class=2 Analítico + type_id=2 "Entradas", tenant-scoped)
//   farm_id        opcional uuid tenant-scoped
//   format         obrigatório 'pdf' | 'xlsx'
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

/** Forma INTERNA do form (react-hook-form/react-select) — `buildParams` na
 *  página achata para `ReceiptCashflowReportParams` antes de chamar o
 *  service. `format` guarda o `Option<ReportFormat>` inteiro (mirror
 *  `format` de `CashFlowByCategoryReportFilterForm`), extraído só no
 *  `buildParams` do submit. */
export interface ReceiptCashflowReportFilterForm {
  /** Valores selecionados do `CheckboxListField` (uuid de `accounts`). */
  accounts: string[];
  start_date: string | null;
  end_date: string | null;
  proprietary_id: Option<string> | null;
  center_id: Option<string> | null;
  /** Valores selecionados do `CheckboxListField` (uuid de `categories`). */
  categories: string[];
  farm_id: Option<string> | null;
  format: Option<ReportFormat> | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com
 *  `ReceiptCashflowReportRequest::rules()`. */
export interface ReceiptCashflowReportParams {
  accounts?: string[];
  start_date: string;
  end_date: string;
  proprietary_id?: string;
  center_id?: string;
  categories?: string[];
  farm_id?: string;
  format: ReportFormat;
}
