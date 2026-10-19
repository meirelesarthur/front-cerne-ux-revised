// src/services/v2/BreedingMating/reproductive-history-report-service.ts
// -----------------------------------------------------------------------------
// Reproductive History Report Service — API v1 do backend Laravel GB.Cerne
// (execução 074, historico-reprodutivo-contrato-front.md §4). Mirror EXATO
// `pregnant-cows-report-service.ts` (mesma pasta de domínio — reprodução,
// mesmo backend-mirror family `PregnantCowsReportController`).
//
// `type` decide o FORMATO da mesma resposta binária (0=PDF inline,
// 1=Excel download) — não é filtro de dado. Resposta binária, fora do
// envelope `ApiResponse` (exceção documentada, mirror `dfe-service.ts`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { AnimalReproductiveStatus } from '@/@types/v2/Animals';

export interface ReproductiveHistoryReportFilterParams {
  start_date: string;
  end_date: string;
  batch_uuid?: string;
  reproductive_status?: AnimalReproductiveStatus; // 1|2|3
  type: 0 | 1; // 0=PDF inline, 1=Excel download
}

async function downloadReproductiveHistoryReport(
  params: ReproductiveHistoryReportFilterParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/reproductive-history-report',
    { ...params },
    {
      responseType: 'blob',
    }
  );
  return data;
}

export { downloadReproductiveHistoryReport };
