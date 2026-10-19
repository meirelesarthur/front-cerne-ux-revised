// src/services/v2/Relatorios/accumulated-weighing-batch-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Pesagem/Lote" (Tarefa 49, esteira CORE_WORKSPACE/97-Esteiras/014)
// — mirror ESTRUTURAL de `management-batch-report-service.ts` (F-279), MESMO
// arquétipo de options (`{categories,batches}`), mas endpoint PRÓPRIO — não
// reaproveita o service irmão (contrato de API §3.3-§3.10).
//
//   - `GET /api/v1/accumulated-weighing-batch-report/options` — envelope
//     `{success,message,data,errors,meta}`, `data.categories`/`data.batches`
//     (`CategoryAnimalOptionResource`/`BatchOptionResource`, ambos
//     `{uuid,label}`).
//   - `GET /api/v1/accumulated-weighing-batch-report` — PDF (portrait) ou
//     Excel binário conforme `format`, SEM envelope, `responseType:'blob'`
//     obrigatório.
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  AccumulatedWeighingBatchReportOptionsData,
  AccumulatedWeighingBatchReportParams,
} from '@/@types/v2/Relatorios/accumulated-weighing-batch-report';

interface AccumulatedWeighingBatchReportOptionsResponse {
  categories: AccumulatedWeighingBatchReportOptionsData['categories'];
  batches: AccumulatedWeighingBatchReportOptionsData['batches'];
}

async function getAccumulatedWeighingBatchReportOptions(): Promise<AccumulatedWeighingBatchReportOptionsData> {
  const { data } = await api.V2.get<Response<AccumulatedWeighingBatchReportOptionsResponse>>(
    '/accumulated-weighing-batch-report/options'
  );
  return { categories: data.data.categories, batches: data.data.batches };
}

async function downloadAccumulatedWeighingBatchReport(
  params: AccumulatedWeighingBatchReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/accumulated-weighing-batch-report',
    {
      batch_id: params.batch_id || undefined,
      category_id: params.category_id || undefined,
      start_date: params.start_date,
      end_date: params.end_date,
      only_active_batch: params.only_active_batch ?? undefined,
      format: params.format || undefined,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadAccumulatedWeighingBatchReport, getAccumulatedWeighingBatchReportOptions };
