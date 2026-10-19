// src/services/v2/Relatorios/weighing-batch-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Pesagem/Animal" (feature F-334,
// `CONTRATO-F334-pesagem-animal.md` TASK-334-API-01/02/03) — mirror
// ESTRUTURAL de `accumulated-weighing-batch-report-service.ts` (irmão
// "Pesagem/Lote"), endpoint PRÓPRIO:
//
//   - `GET /api/v1/weighing-batch-report/options` — envelope
//     `{success,message,data,errors,meta}`, `data.categories`/`data.batches`
//     (`CategoryAnimalOptionResource`/`BatchOptionResource`, ambos
//     `{uuid,label}`).
//   - `GET /api/v1/weighing-batch-report` — PDF (landscape) ou Excel
//     binário conforme `format`, SEM envelope, `responseType:'blob'`
//     obrigatório.
//
// Lookup de Animal (`animal_id`) NÃO é endpoint desta Tarefa — a tela
// consome `GET /api/v1/animals/options` já migrado
// (`@/services/v2/Animals/animal-service` → `listAnimalOptions`).
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  WeighingBatchReportOptionsData,
  WeighingBatchReportParams,
} from '@/@types/v2/Relatorios/weighing-batch-report';

interface WeighingBatchReportOptionsResponse {
  categories: WeighingBatchReportOptionsData['categories'];
  batches: WeighingBatchReportOptionsData['batches'];
}

async function getWeighingBatchReportOptions(): Promise<WeighingBatchReportOptionsData> {
  const { data } = await api.V2.get<Response<WeighingBatchReportOptionsResponse>>(
    '/weighing-batch-report/options'
  );
  return { categories: data.data.categories, batches: data.data.batches };
}

async function downloadWeighingBatchReport(params: WeighingBatchReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/weighing-batch-report',
    {
      batch_id: params.batch_id || undefined,
      category_id: params.category_id || undefined,
      animal_id: params.animal_id || undefined,
      start_date: params.start_date,
      end_date: params.end_date,
      format: params.format || undefined,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadWeighingBatchReport, getWeighingBatchReportOptions };
