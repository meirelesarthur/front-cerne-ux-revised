// src/@types/v2/FinancialMovementReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Movimento Bancário" (F-264, esteira 97-Esteiras/058,
// TASK-058-F264-FE-01). Mirror ESTRUTURAL de `@/@types/v2/CostCenterReport`
// (par `Form`/`Params`, `Option<T>` nos selects) — FRONT-F264-plano.md §3.
//
// Campos EXATOS de `FinancialMovementReportRequest` (plano de API §1.3):
//   accounts[]    opcional uuid[] tenant-scoped
//   proprietary   opcional uuid
//   types[]       opcional string[] (domínio `MovementType`, aplicado à
//                 coluna `type_category` no servidor — FID-01)
//   center_id     opcional uuid
//   categories[]  opcional uuid[]
//   farm_id       opcional uuid tenant-scoped
//   condition     opcional 'S' | 'C' (default 'S' — Sem Categoria)
//   start_date    OBRIGATÓRIO date
//   end_date      OBRIGATÓRIO date (>= start_date)
//   format        opcional 'pdf' | 'xlsx' (default 'pdf')
//
// SEM `columns`/`order` (colunas fixas no servidor, plano §"Leitura do dev") —
// SEM saldo inicial/final (contrato legado CL-09, PRESERVAR).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export type FinancialMovementCondition = 'S' | 'C';
export type FinancialMovementReportFormat = 'pdf' | 'xlsx';

/** Forma INTERNA do form (react-hook-form/react-select) — `buildParams` na
 *  página achata para `FinancialMovementReportParams` antes de chamar o
 *  service. */
export interface FinancialMovementReportFilterForm {
  /** Valores selecionados do `CheckboxListField` remoto (uuid de `accounts`,
   *  via `listAccounts` — NUNCA `getAccountOptions`, ver nota de cabeçalho do
   *  service). */
  accounts: string[];
  proprietary: Option<string> | null;
  /** Valores selecionados do `CheckboxListField` local de tipo de movimento
   *  (`type_category`, NÃO o enum completo `type` — ver FID-01/CL-08). */
  types: string[];
  center_id: Option<string> | null;
  /** Valores selecionados do `CheckboxListField` remoto (uuid de
   *  `categories`, via `listFinancialCategoryOptions`). */
  categories: string[];
  farm_id: Option<string> | null;
  condition: Option<FinancialMovementCondition> | null;
  start_date: string | null;
  end_date: string | null;
  format: Option<FinancialMovementReportFormat> | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com
 *  `FinancialMovementReportRequest::rules()` (plano de API §1.3). */
export interface FinancialMovementReportParams {
  accounts?: string[];
  proprietary?: string;
  types?: string[];
  center_id?: string;
  categories?: string[];
  farm_id?: string;
  condition?: FinancialMovementCondition;
  start_date: string;
  end_date: string;
  format: FinancialMovementReportFormat;
}
