// src/@types/v2/AccountsPayableReceivableReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Consolidado Pagar/Receber" (F-214, esteira
// 97-Esteiras/052, TASK-052-214-FE-01). Contrato de tela SELADO (DEC-225) —
// `97-Esteiras/052/ROTEIROS/roteiro-front-F214-consolidado.md` — mirror
// ESTRUTURAL de `@/@types/v2/AccountsReports` (tela de filtro + download
// binário, SEM grid/prévia), download-only PDF+Excel via campo `format`
// único.
//
// Campos EXATOS de `AccountsPayableReceivableReportRequest` (arquitetura
// F-214 selada):
//   start_emission_date  required date
//   end_emission_date    required date (>= start_emission_date)
//   start_write_off_date opcional date
//   end_write_off_date   opcional date (>= start_write_off_date, quando ambos presentes)
//   provider              opcional uuid — SELECIONA SÓ PAGAR (precede client)
//   client                opcional uuid — seleciona só Receber (se provider vazio)
//   center                opcional uuid (centro GLOBAL de tenant nulo OU do tenant)
//   account               opcional uuid tenant-scoped
//   category              opcional uuid tenant-scoped
//   status[]              opcional array int 1-4 (catálogo LOCAL, `AccountsPayableReceivableStatusEnum`)
//   format                required 'pdf'|'xlsx' (default 'pdf' no form)
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export type AccountsPayableReceivableReportFormat = 'pdf' | 'xlsx';

/** 1 Em Aberto · 2 Parcial · 3 Quitado · 4 Adiantamento (`AccountsPayableReceivableStatusEnum`, backend). */
export type AccountsPayableReceivableStatus = 1 | 2 | 3 | 4;

/** Forma INTERNA do form (react-hook-form/react-select) — `buildParams` na
 *  página achata para `AccountsPayableReceivableReportParams` antes de
 *  chamar o service. Selects/lookups guardam o `Option<T>` inteiro (mirror
 *  `ContasAPagar`/`CentroCusto`), extraído só no `buildParams` do submit. */
export interface AccountsPayableReceivableReportFilterForm {
  start_emission_date: string | null;
  end_emission_date: string | null;
  start_write_off_date: string | null;
  end_write_off_date: string | null;
  provider: Option<string> | null;
  client: Option<string> | null;
  center: Option<string> | null;
  account: Option<string> | null;
  category: Option<string> | null;
  /** Valores selecionados do `CheckboxListField` local (catálogo fixo 1-4). */
  status: AccountsPayableReceivableStatus[];
  format: Option<AccountsPayableReceivableReportFormat> | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com
 *  `AccountsPayableReceivableReportRequest::rules()`. */
export interface AccountsPayableReceivableReportParams {
  start_emission_date: string;
  end_emission_date: string;
  start_write_off_date?: string;
  end_write_off_date?: string;
  provider?: string;
  client?: string;
  center?: string;
  account?: string;
  category?: string;
  status?: AccountsPayableReceivableStatus[];
  format: AccountsPayableReceivableReportFormat;
}
