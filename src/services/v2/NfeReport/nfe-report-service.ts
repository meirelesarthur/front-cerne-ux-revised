// src/services/v2/NfeReport/nfe-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "NFe/Emitidas" (F-287, esteira 97-Esteiras/079, TASK-F287-FE-01).
// Mirror estrutural de `nfe-product-report-service.ts` — 1 função de
// download síncrono, resposta BINÁRIA (PDF ou Excel conforme `format`),
// `responseType: 'blob'` OBRIGATÓRIO (sem isso o axios corrompe o binário).
//
// Endpoint: `GET /api/v1/nfe-report` (`NfeReportRequest`,
// F-287-plano-api-database §3). Envelope `{success,message,data,errors,meta}`
// NÃO se aplica (mesma exceção documentada para controllers de relatório
// binário); erro 422/401/403 chega como `Blob` também — o chamador usa
// `parseBlobError` no `catch`.
//
// `X-Farm-Id` é automático (interceptor de `@/services/api.ts`) — os 9
// campos são listados EXPLICITAMENTE (armadilha ERRO-FE-016: nunca descartar
// parâmetro em silêncio); string/array vazios viram `undefined`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { NfeReportParams } from '@/@types/v2/NfeReport';

async function downloadNfeReport(params: NfeReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/nfe-report',
    {
      start_date: params.start_date,
      end_date: params.end_date,
      status: params.status || undefined,
      client_ids: params.client_ids && params.client_ids.length > 0 ? params.client_ids : undefined,
      farm_ids: params.farm_ids && params.farm_ids.length > 0 ? params.farm_ids : undefined,
      center_ids: params.center_ids && params.center_ids.length > 0 ? params.center_ids : undefined,
      issuer_id: params.issuer_id || undefined,
      provider_id: params.provider_id || undefined,
      format: params.format || undefined,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadNfeReport };
