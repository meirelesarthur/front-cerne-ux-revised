// src/services/v2/AnimalBatchHistoryReport/animal-batch-history-report-service.ts
// -----------------------------------------------------------------------------
// Service do relatório F-221 Histórico de Animais/Lote (esteira
// 97-Esteiras/058, TASK-058-F221-FE-01). Endpoint ÚNICO
// `GET /api/v1/animal-batch-history-report` (`type` decide o FORMATO da
// resposta binária — PDF inline OU Excel download), `responseType:'blob'`
// obrigatório — mirror `downloadReproductiveHistoryReport`/
// `downloadAdvanceReport`.
//
// `farm.context` (tenant-scoped) — `X-Farm-Id` propagado pelo interceptor
// genérico do `api.ts`, nunca hardcode manual aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { AnimalBatchHistoryReportParams } from '@/@types/v2/AnimalBatchHistoryReport';

export async function downloadAnimalBatchHistoryReport(
  params: AnimalBatchHistoryReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/animal-batch-history-report',
    {
      start_date: params.start_date,
      end_date: params.end_date || undefined,
      batch: params.batch,
      status: params.status || undefined,
      type: params.type,
    },
    { responseType: 'blob' }
  );
  return data;
}
