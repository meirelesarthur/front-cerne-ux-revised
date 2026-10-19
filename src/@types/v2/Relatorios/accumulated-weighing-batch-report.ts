// src/@types/v2/Relatorios/accumulated-weighing-batch-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Pesagem/Lote" (Tarefa 49, esteira
// CORE_WORKSPACE/97-Esteiras/014). Mirror ESTRUTURAL de
// `management-batch-report.ts` (F-279, mesmo endpoint `/options` com o
// padrão `{categories,batches}` — MESMOS Resources reusados pelo backend,
// `CategoryAnimalOptionResource`/`BatchOptionResource`, ambos `{uuid,label}`,
// confirmado em `api-architecture-pesagem-lote.md §3.10`).
//
// Query params reais enviados ao endpoint de download (`GET
// /accumulated-weighing-batch-report`,
// `AccumulatedWeighingBatchReportRequest::rules()`, api-architecture
// §"Nomes de query string"): `batch_id`/`category_id`/`only_active_batch`
// (NOMES PRESERVADOS iguais ao legado, DIFERENTE de `management-batch-
// report` que usa `category`/`batch` sem sufixo `_id`) — não confundir os
// 2 contratos.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

export interface AccumulatedWeighingBatchCategoryRef {
  uuid: string;
  label: string;
}

export interface AccumulatedWeighingBatchBatchRef {
  uuid: string;
  label: string;
}

export interface AccumulatedWeighingBatchReportOptionsData {
  /** Todas as categorias, SEM filtro `is_enabled` (CLM-014 preservado, sem AJAX). */
  categories: AccumulatedWeighingBatchCategoryRef[];
  /** Lotes ATIVOS da fazenda (farm-scoped via HasFarmTenantScope), sem AJAX. */
  batches: AccumulatedWeighingBatchBatchRef[];
}

export interface AccumulatedWeighingBatchReportFilterForm {
  batch_id: Option<string> | null;
  category_id: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  only_active_batch: Option<boolean> | null;
  format: Option<ReportFormat>;
}

/** Payload REAL — nomes 1:1 com `AccumulatedWeighingBatchReportRequest::rules()`. */
export interface AccumulatedWeighingBatchReportParams {
  batch_id?: string;
  category_id?: string;
  start_date: string;
  end_date: string;
  /** '1'/'0' string — NUNCA boolean cru nem 'true'/'false' (422 na regra Laravel `boolean`). */
  only_active_batch?: '1' | '0';
  format?: ReportFormat;
}
