// src/@types/v2/Relatorios/animalsPerBatchReport.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Animais por Lote" (Tarefa 51, esteira
// CORE_WORKSPACE/97-Esteiras/015). Composição de 2 precedentes diretos em
// produção: `AccumulatedWeighingBatchReportFilterForm`/`Params`
// (`@/@types/v2/Relatorios/accumulated-weighing-batch-report.ts`, casca +
// branch `format` pdf/xlsx) + a técnica exata de cascata Lote→Animal de
// `CreateOrUpdateLossAnimal.tsx` (`batch_uuid` real filtra o combo de Animal
// server-side, correção por construção do achado legado `C21`).
//
// Query params reais enviados ao endpoint de download (`GET
// /animals-per-batch-report`, `AnimalsPerBatchReportRequest::rules()`,
// `api-contract-animais-por-lote.md §2`): `batch_id`/`view_type`/`animal_id`/
// `format` — SEM `category_id`/`processing_id` (código morto legado, não
// portado, contrato de tela §"Riscos" #5) e SEM `farm_id` explícito (o
// client injeta `X-Farm-Id` automaticamente).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

/** Modo de Visualização — enum nomeado, upgrade do `view_type` numérico do
 *  legado (`api-contract-animais-por-lote.md §2#9/#10`). */
export type AnimalsPerBatchReportViewType = 'individual' | 'aggregated';

export interface AnimalsPerBatchReportFilterForm {
  batch_id: Option<string> | null;
  view_type: Option<AnimalsPerBatchReportViewType> | null;
  /** Opcional — só relevante em `view_type=individual` (Riscos #1 do
   *  contrato de tela); desabilitado e limpo quando `view_type=aggregated`. */
  animal_id: Option<string> | null;
  format: Option<ReportFormat>;
}

/** Payload REAL — nomes 1:1 com `AnimalsPerBatchReportRequest::rules()`. */
export interface AnimalsPerBatchReportParams {
  batch_id: string;
  view_type: AnimalsPerBatchReportViewType;
  animal_id?: string;
  format?: ReportFormat;
}
