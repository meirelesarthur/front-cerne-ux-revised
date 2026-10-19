// src/services/v2/Relatorios/animal-movement-analysis-report-service.ts
// -----------------------------------------------------------------------------
// Service do relatório F-223 Análise Mov. Lote (esteira 97-Esteiras/059,
// CONTRATO-F223-analise-mov-lote.md §5, TASK-223-API-03). Endpoint ÚNICO
// `GET /api/v1/animal-movement-analysis-report` (`type` decide o FORMATO da
// resposta binária — PDF SEMPRE paisagem/inline OU Excel download),
// `responseType:'blob'` obrigatório — mirror
// `downloadAnimalBatchHistoryReport` (F-221, MESMA view
// `animal_batch_histories`).
//
// `farm.context` (tenant-scoped) — `X-Farm-Id` propagado pelo interceptor
// genérico do `api.ts`, nunca hardcode manual aqui. SEM MOCK: nenhum dado
// simulado — a chamada é real contra o endpoint já commitado no
// `api_root` (`AnimalMovementAnalysisReportController`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { AnimalMovementAnalysisReportParams } from '@/@types/v2/AnimalMovementAnalysisReport';

export async function downloadAnimalMovementAnalysisReport(
  params: AnimalMovementAnalysisReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/animal-movement-analysis-report',
    {
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      batch: params.batch,
      type: params.type,
    },
    { responseType: 'blob' }
  );
  return data;
}
