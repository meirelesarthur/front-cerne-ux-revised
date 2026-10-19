// src/@types/v2/Relatorios/weighing-batch-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Pesagem/Animal" (feature F-334,
// `CONTRATO-F334-pesagem-animal.md` TASK-334-API-01/02). Mirror ESTRUTURAL de
// `accumulated-weighing-batch-report.ts` (irmão "Pesagem/Lote"), MESMO
// arquétipo de options (`{categories,batches}` — `CategoryAnimalOptionResource`/
// `BatchOptionResource`, ambos `{uuid,label}`, `WeighingBatchReportController::
// options()`).
//
// Query params reais enviados ao endpoint de download (`GET
// /weighing-batch-report`, `WeighingBatchReportRequest::rules()`): `batch_id`/
// `category_id`/`animal_id` (TODOS opcionais/`sometimes`) + `start_date`/
// `end_date` (obrigatórios) + `format` (`'pdf'|'xlsx'`, obrigatório) — 6
// filtros no total. DIFERENTE do irmão "Pesagem/Lote": SEM `only_active_batch`,
// COM `animal_id` (lookup reaproveitado de `GET /api/v1/animals/options`, já
// migrado — `AnimalOptionListItem`/`listAnimalOptions`, ver
// `@/services/v2/Animals/animal-service`).
//
// Relatório é 1 linha por PESAGEM (agrupada por Animal no PDF/Excel), NÃO
// agregada por MAX/MIN como o irmão — sem impacto na FORMA do filtro/tela,
// só no ViewModel do backend (fora do escopo desta camada).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

export interface WeighingBatchCategoryRef {
  uuid: string;
  label: string;
}

export interface WeighingBatchBatchRef {
  uuid: string;
  label: string;
}

export interface WeighingBatchReportOptionsData {
  /** Todas as categorias (catálogo global, mirror irmão "Pesagem/Lote"). */
  categories: WeighingBatchCategoryRef[];
  /** Lotes da fazenda (farm-scoped via HasFarmTenantScope, mirror irmão). */
  batches: WeighingBatchBatchRef[];
}

export interface WeighingBatchReportFilterForm {
  batch_id: Option<string> | null;
  category_id: Option<string> | null;
  /** NOVO nesta tela (ausente no irmão "Pesagem/Lote") — lookup via
   *  `GET /api/v1/animals/options` (`SelectAsyncPaginate` + `listAnimalOptions`,
   *  NÃO um endpoint novo desta Tarefa). */
  animal_id: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  format: Option<ReportFormat>;
}

/** Payload REAL — nomes 1:1 com `WeighingBatchReportRequest::rules()`. */
export interface WeighingBatchReportParams {
  batch_id?: string;
  category_id?: string;
  animal_id?: string;
  start_date: string;
  end_date: string;
  format?: ReportFormat;
}
