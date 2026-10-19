// src/@types/v2/CashflowProductReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Estoque Financeiro" (F-241, esteira 97-Esteiras/013,
// TASK-013-241-FE-01). Contrato de tela PLANEJADO
// (`97-Esteiras/013/ROTEIROS/roteiro-front-F241-estoque-financeiro.md` v2
// §1-§3) — download-only puro (PDF+Excel via campo `format` único, SEM
// grid/prévia, `DE-01` fechada 2026-09-08), mirror ESTRUTURAL do irmão direto
// `@/@types/v2/CashFlowByCategoryReport` (F-240) REDUZIDO a exatamente 3
// campos (sem `group`/`accounts`/`last_balance`/`proprietary_id`/`center_id`/
// `farm_id`/`report_type` — este relatório não tem esses filtros, CL-16).
//
// Nenhum tipo de linha de resultado (`DE-01` = download-only; o front nunca
// tipa linha — a tabela vive só dentro do documento gerado pela API).
//
// ⚠️ `LAC-FE-04` (reduzida a parâmetros) / `LAC-FE-01`: o domínio do campo
// `format` é PROVISÓRIO até `CONTRATO_AUTOAPROVADO` da camada API — adotado
// `'pdf' | 'xlsx'` via `ReportFormat` (mirror exato do irmão F-240, 17 telas
// já reusam). Se a API divergir, troca-se só o tipo/fábrica, nunca a forma
// do widget.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

/** Forma INTERNA do form (react-hook-form/react-select) — `buildParams` na
 *  página achata para `CashflowProductReportParams` antes de chamar o
 *  service. `format` guarda o `Option<T>` inteiro (mirror `format` de
 *  `CashFlowByCategoryReportFilterForm`), extraído só no `buildParams` do
 *  submit. */
export interface CashflowProductReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  format: Option<ReportFormat> | null;
}

/** Payload REAL enviado ao servidor — 3 parâmetros, `LAC-FE-05` (rota
 *  provisória `GET /api/v1/cashflow-product-report`). */
export interface CashflowProductReportParams {
  start_date: string;
  end_date: string;
  format: ReportFormat;
}
