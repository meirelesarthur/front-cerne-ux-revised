// src/@types/v2/CashFlowByCategoryReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Fluxo de Caixa Mensal" (F-240, esteira 97-Esteiras/053,
// TASK-053-240-FE-01). Contrato de tela SELADO
// (`97-Esteiras/053/ROTEIROS/roteiro-front-F240-fluxo-caixa.md` §3-§5) —
// download-only puro (PDF+Excel via campo `format` único, SEM grid/prévia),
// mirror ESTRUTURAL de `@/@types/v2/CostCenterReport` (mesmo conjunto-base de
// 6 campos: `group`/período/`accounts[]`/`proprietary_id`/`center_id`/
// `farm_id`) MENOS a prévia (F-240 não tem `/preview`) MAIS 3 campos novos
// (`last_balance`, `report_type`, `format`).
//
// Campos EXATOS de `CashFlowByCategoryReportRequest::rules()` (API real,
// `feature/053-relatorios`, commit `f18c67cdd`, lida diretamente):
//   group          required enum 'C' (Caixa) | 'O' (Competência)
//   start_date     required date
//   end_date       required date (after_or_equal:start_date)
//   accounts[]     opcional uuid[] tenant-scoped
//   last_balance   required boolean
//   proprietary_id opcional uuid (sem escopo de tenant — mirror CL-013 corrigido)
//   center_id      opcional uuid (centro GLOBAL de tenant nulo OU do tenant)
//   farm_id        opcional uuid tenant-scoped
//   report_type    required enum 'A' (Analítico) | 'S' (Sintético)
//   format         required 'pdf' | 'xlsx'
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

export type CashFlowByCategoryReportGroup = 'C' | 'O';
export type CashFlowByCategoryReportType = 'A' | 'S';

/** Forma INTERNA do form (react-hook-form/react-select) — `buildParams` na
 *  página achata para `CashFlowByCategoryReportParams` antes de chamar o
 *  service. `last_balance`/`report_type`/`format` guardam o `Option<T>`
 *  inteiro (mirror `periodicity`/`order`/`format` de `ExpenseReportFilterForm`),
 *  extraídos só no `buildParams` do submit. */
export interface CashFlowByCategoryReportFilterForm {
  group: Option<CashFlowByCategoryReportGroup> | null;
  /** Valores selecionados do `CheckboxListField` (uuid de `accounts`). */
  accounts: string[];
  start_date: string | null;
  end_date: string | null;
  last_balance: Option<boolean> | null;
  proprietary_id: Option<string> | null;
  center_id: Option<string> | null;
  farm_id: Option<string> | null;
  report_type: Option<CashFlowByCategoryReportType> | null;
  format: Option<ReportFormat> | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com
 *  `CashFlowByCategoryReportRequest::rules()`. */
export interface CashFlowByCategoryReportParams {
  group: CashFlowByCategoryReportGroup;
  start_date: string;
  end_date: string;
  accounts?: string[];
  /** Campo obrigatório no servidor — sempre `true`/`false`, nunca omitido. */
  last_balance: boolean;
  proprietary_id?: string;
  center_id?: string;
  farm_id?: string;
  report_type: CashFlowByCategoryReportType;
  format: ReportFormat;
}
