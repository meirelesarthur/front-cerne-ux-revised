// src/@types/v2/AnimalMovementAnalysisReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Análise Mov. Lote" (F-223, esteira 97-Esteiras/059,
// CONTRATO-F223-analise-mov-lote.md §5, TASK-223-API-01). Mirror estrutural
// de `@/@types/v2/AnimalBatchHistoryReport` (F-221 — mesma view Postgres
// `animal_batch_histories`, mesma família "form simples + download binário",
// SEM `columns`/`order`/`order_direction`: a matriz data×categoria e a
// ordenação são fixas no servidor,
// `AnimalMovementAnalysisReportRequest` não expõe esses parâmetros).
//
// Diverge do irmão F-221 por NÃO ter campo `status` — o filtro do endpoint
// `GET /api/v1/animal-movement-analysis-report` só expõe `batch`/
// `start_date`/`end_date`/`type` (contrato §5 TASK-223-API-01).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** `type` decide o FORMATO da resposta binária (PDF sempre paisagem, inline,
 * OU Excel download) — nome do campo mantido igual ao literal esperado pela
 * API (`?type=pdf|excel`), evita mapeamento silencioso (mirror F-221). */
export type AnimalMovementAnalysisReportOutputType = 'pdf' | 'excel';

/** Payload flat enviado para `GET /animal-movement-analysis-report`
 * (`responseType:'blob'`) — `Option<T>` já desembrulhado para o valor. */
export interface AnimalMovementAnalysisReportParams {
  start_date?: string;
  end_date?: string;
  batch: string;
  type: AnimalMovementAnalysisReportOutputType;
}

/** Estado do formulário de filtro (React Hook Form) — selects em
 * `Option<T>|null`, convertidos para o payload flat no submit. */
export interface AnimalMovementAnalysisReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  batch: Option<string> | null;
  type: Option<AnimalMovementAnalysisReportOutputType> | null;
}
