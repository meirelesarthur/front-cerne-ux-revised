// src/@types/v2/Relatorios/ledger-category-report.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Razão Categoria" (F-273, execução 059,
// `CONTRATO-F273-razao-categoria.md`, TASK-273-FE-01). Download-only puro
// (PDF+Excel via campo `format` único, MESMO endpoint, SEM grid/prévia —
// mirror ESTRUTURAL de `@/@types/v2/CashFlowByCategoryReport`).
//
// Campos EXATOS de `LedgerCategoryReportFilterData`/`LedgerCategoryReportRequest`
// (API real, `GB.Cerne.Api/app/Data/Reports/LedgerCategoryReport/
// LedgerCategoryReportFilterData.php` + `app/Http/Requests/Api/V1/
// LedgerCategoryReportRequest.php`, lidos diretamente, não presumidos):
//   start_date     required date
//   end_date       required date (after_or_equal:start_date)
//   farm_id        opcional uuid tenant-scoped
//   proprietary_id opcional uuid (pivot `proprietary_tenant`, SEM coluna
//                  `tenant_id` própria em `proprietaries`)
//   center_id      opcional uuid (centro GLOBAL `tenant_id IS NULL` OU do
//                  tenant — mesmo racional `CostCenterTenantScope`)
//   categories[]   opcional uuid[] (`financial_categories`, bi-modal
//                  global/tenant — mesmo racional de `center_id`)
//   format         required 'pdf' | 'xlsx'
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

/** Forma INTERNA do form (react-hook-form/react-select) — `buildParams` no
 *  submit achata para `LedgerCategoryReportParams` antes de chamar o
 *  service. `format` guarda o `Option<T>` inteiro (mirror
 *  `CashFlowByCategoryReportFilterForm`), extraído só no `buildParams`. */
export interface LedgerCategoryReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  farm_id: Option<string> | null;
  proprietary_id: Option<string> | null;
  center_id: Option<string> | null;
  /** Valores selecionados do `CheckboxListField` (uuid de `financial_categories`). */
  categories: string[];
  format: Option<ReportFormat> | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com
 *  `LedgerCategoryReportRequest::rules()`. */
export interface LedgerCategoryReportParams {
  start_date: string;
  end_date: string;
  farm_id?: string;
  proprietary_id?: string;
  center_id?: string;
  categories?: string[];
  format: ReportFormat;
}
